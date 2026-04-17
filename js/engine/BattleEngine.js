/**
 * BattleEngine V1 升级版 - 战斗引擎（纯逻辑层）
 *
 * 负责伤害计算、命中判定、暴击系统、属性克制、AI决策、回合执行、战斗流程
 * 不包含任何渲染或输入处理
 *
 * V1 升级内容：
 * - 新增：accuracy 命中判定（读取 skills.json 的 accuracy 字段）
 * - 新增：暴击系统（约 6.25% 概率，1.5 倍伤害）
 * - 扩充：完整属性克制表（覆盖 16 种属性）
 * - 改进：更合理的伤害公式（含等级因子）
 */

// ========== 完整属性克制表 ==========
// 攻击属性 → 防御属性 = 伤害倍率（2=克制, 0.5=抵抗, 0=免疫, 无键=1正常）
const FULL_TYPE_CHART = {
    fire:   { grass: 2, ice: 2, bug: 2, steel: 2, water: 0.5, fire: 0.5, rock: 0.5, dragon: 0.5 },
    water:  { fire: 2, ground: 2, rock: 2, grass: 0.5, water: 0.5, dragon: 0.5 },
    grass:  { water: 2, ground: 2, rock: 2, fire: 0.5, grass: 0.5, flying: 0.5, poison: 0.5, bug: 0.5, steel: 0.5, dragon: 0.5 },
    electric:{ water: 2, flying: 2, grass: 0.5, electric: 0.5, dragon: 0.5, ground: 0 }, // 地面免疫电
    ice:    { grass: 2, ground: 2, flying: 2, dragon: 2, fire: 0.5, water: 0.5, ice: 0.5, steel: 0.5 },
    fighting:{ normal: 2, ice: 2, rock: 2, dark: 2, steel: 2, poison: 0.5, flying: 0.5, psychic: 0.5, ghost: 0, bug: 0.5, fairy: 0.5 },
    poison: { grass: 2, fairy: 2, poison: 0.5, ground: 0.5, rock: 0.5, ghost: 0.5, steel: 0.5 },
    ground: { fire: 2, electric: 2, poison: 2, rock: 2, steel: 2, grass: 0.5, bug: 0.5, flying: 0 },
    flying: { grass: 2, fighting: 2, bug: 2, electric: 0.5, rock: 0.5, steel: 0.5 },
    psychic: { fighting: 2, poison: 2, psychic: 0.5, dark: 0, steel: 0.5 },
    bug:    { grass: 2, psychic: 2, dark: 2, fire: 0.5, fighting: 0.5, poison: 0.5, flying: 0.5, ghost: 0.5, steel: 0.5, fairy: 0.5 },
    rock:   { fire: 2, ice: 2, flying: 2, bug: 2, fighting: 0.5, ground: 0.5, steel: 0.5 },
    ghost:  { psychic: 2, ghost: 2, normal: 0, dark: 0.5 },
    dragon: { dragon: 2, fairy: 0 }, // 妖精龙系免疫
    dark:   { psychic: 2, ghost: 2, fighting: 0.5, dark: 0.5, fairy: 0.5 },
    normal: {}, // 普通系无特殊克制
    fairy:  { fighting: 2, dragon: 2, dark: 2, fire: 0.5, poison: 0.5, steel: 0.5 }
};

class BattleEngine {
    // 状态异常配置
    static STATUS_EFFECTS = {
        poison:   { name: '中毒', turnDamage: 0.0625, catchMod: 1.5, canAct: true },
        burn:     { name: '烧伤', turnDamage: 0.0625, catchMod: 1.5, canAct: true, atkMod: 0.5 },
        paralyze: { name: '麻痹', turnDamage: 0, catchMod: 1.5, canAct: true, speedMod: 0.25, actChance: 0.75 },
        freeze:   { name: '冰冻', turnDamage: 0, catchMod: 2.5, canAct: false, thawChance: 0.2 },
        sleep:    { name: '睡眠', turnDamage: 0, catchMod: 2.5, canAct: false, wakeChance: 0.33 }
    };

    constructor(eventBus) {
        this.eventBus = eventBus || null;
        this.state = null;

        // 使用完整属性克制表
        this.typeChart = FULL_TYPE_CHART;
    }

    /** 初始化野生精灵战斗 */
    initWildBattle(playerCreature, enemyCreature) {
        this.state = {
            phase: 'menu',
            turn: 0,
            battleType: 'wild',
            playerCreature,
            enemyCreature,
            trainerNPC: null,
            trainerParty: [],
            result: null,
            log: [],
            // V1 新增字段
            wasCriticalHit: false,     // 上次攻击是否暴击
            wasMissed: false,          // 上次攻击是否闪避
            lastDamageInfo: null       // 上次伤害详细信息
        };
        playerCreature.statModifiers = { attack: 0, defense: 0, speed: 0 };
        enemyCreature.statModifiers = { attack: 0, defense: 0, speed: 0 };
        this._addLog(`野生的${enemyCreature.name}出现了！`);
        if (this.eventBus) this.eventBus.emit(GameEvents.BATTLE_START, this.state);
        return this.state;
    }

    /** 初始化训练师战斗 */
    initTrainerBattle(playerCreature, enemyCreature, trainerNPC, trainerParty) {
        this.state = {
            phase: 'menu',
            turn: 0,
            battleType: 'trainer',
            playerCreature,
            enemyCreature,
            trainerNPC,
            trainerParty: trainerParty ? [...trainerParty] : [],
            result: null,
            log: [],
            wasCriticalHit: false,
            wasMissed: false,
            lastDamageInfo: null
        };
        playerCreature.statModifiers = { attack: 0, defense: 0, speed: 0 };
        enemyCreature.statModifiers = { attack: 0, defense: 0, speed: 0 };
        this._addLog(`训练师${trainerNPC.name}发起了挑战！`);
        if (this.eventBus) this.eventBus.emit(GameEvents.BATTLE_START, this.state);
        return this.state;
    }

    // ════════════════════════════════════
    //   属性克制系统（V1 完整版）
    // ════════════════════════════════════

    /**
     * 获取属性克制倍率
     * @param {string} attackType - 攻击技能的属性
     * @param {string|Array} defenderType - 防御方的属性（支持单属性或数组）
     * @returns {number} 伤害倍率
     */
    getTypeMultiplier(attackType, defenderType) {
        if (!attackType || !defenderType) return 1;

        const types = Array.isArray(defenderType) ? defenderType : [defenderType];
        let multiplier = 1;

        for (const defType of types) {
            const chart = this.typeChart[attackType];
            if (chart && typeof chart[defType] === 'number') {
                multiplier *= chart[defType];
            }
            if (multiplier === 0) return 0; // 任一属性完全免疫，直接返回
        }

        return multiplier;
    }

    /** 获取属性克制描述文字 */
    static getTypeEffectText(multiplier) {
        if (multiplier >= 4) return '效果拔群！';
        if (multiplier >= 2) return '效果很好！';
        if (multiplier > 1 && multiplier < 2) return '比较有效！';
        if (multiplier === 1) return '';
        if (multiplier > 0) return '效果不太好...';
        return '没有效果！';
    }

    // ════════════════════════════════════
    //   伤害计算（V1 升级版）
    // ════════════════════════════════════

    /**
     * 计算技能伤害 - V1 升级公式
     *
     * 公式灵感来自宝可梦：
     * Damage = ((2*Level/5 + 2) * Power * Atk/Def / 50 + 2) * Modifier
     * Modifier = Crit(×1.5) × Type(×0/0.25/0.5/1/2/4) × Random(0.85~1.15)
     *
     * @param {Object} attacker - 攻击者精灵
     * @param {Object} skill - 技能数据（需含 power/type/accuracy/category）
     * @param {Object} defender - 防守者精灵
     * @returns {{ damage:number, isCritical:boolean, isMissed:boolean, typeEffect:number, typeEffectText:string }}
     */
    calcDamage(attacker, skill, defender) {
        // 零威力技能不造成直接伤害（状态类技能）
        if (skill.power === 0) return { damage: 0, isCritical: false, isMissed: false, typeEffect: 1, typeEffectText: '' };

        // ===== V1 新增：命中率检查 =====
        const accuracy = skill.accuracy != null ? skill.accuracy : 100;
        const randomRoll = Math.random() * 100;

        if (randomRoll > accuracy) {
            // 未命中！
            if (this.state) {
                this.state.wasCriticalHit = false;
                this.state.wasMissed = true;
                this.state.lastDamageInfo = { damage: 0, isCritical: false, isMissed: true };
            }
            return { damage: 0, isCritical: false, isMissed: true, typeEffect: 1, typeEffectText: '' };
        }

        // ===== 基础攻防数值 =====
        const level = attacker.level || attacker.stats?.level || 5;
        let atkStat = attacker.stats.attack * (1 + attacker.statModifiers.attack * 0.25);
        const defStat = defender.stats.defense * (1 + defender.statModifiers.defense * 0.25);

        // 烧伤状态：物理伤害攻击力减半
        if (attacker.status === 'burn' && skill.category === 'physical') {
            atkStat = Math.floor(atkStat * 0.5);
        }

        // ===== 核心伤害公式 =====
        // 调整后的公式：大幅提高伤害倍率
        // Damage = ((2*Level/5 + 2) * Power * Atk/Def) / 8 + 10
        const power = skill.power || 40; // 确保power有值
        
        let baseDamage = Math.floor(
            (((2 * level / 5 + 2) * power * (atkStat / defStat)) / 8) + 10
        );
        baseDamage = Math.max(1, baseDamage); // 最少1点伤害

        // ===== V1 新增：暴击判定（约6.25%，即经典1/16）=====
        const CRIT_CHANCE = 0.0625;
        const isCrit = Math.random() < CRIT_CHANCE;
        const critMult = isCrit ? 1.5 : 1;

        // ===== 属性克制 =====
        const typeMult = this.getTypeMultiplier(skill.type, defender.type);
        const effectText = BattleEngine.getTypeEffectText(typeMult);

        // ===== 随机浮动（±15%）=====
        const randomFactor = 0.85 + Math.random() * 0.3; // 0.85 ~ 1.15

        // ===== 最终伤害 =====
        let finalDamage = Math.floor(baseDamage * critMult * typeMult * randomFactor);
        finalDamage = Math.max(0, finalDamage);

        // 缓存结果到 state（供渲染使用）
        if (this.state) {
            this.state.wasCriticalHit = isCrit;
            this.state.wasMissed = false;
            this.state.lastDamageInfo = {
                damage: finalDamage,
                isCritical: isCrit,
                isMissed: false,
                baseDamage: baseDamage,
                typeEffect: typeMult,
                typeEffectText: effectText,
                moveType: skill.type
            };
        }

        return {
            damage: finalDamage,
            isCritical: isCrit,
            isMissed: false,
            typeEffect: typeMult,
            typeEffectText: effectText
        };
    }

    // ════════════════════════════════════
    //   技能效果（保持不变，已完善）
    // ════════════════════════════════════

    /**
     * 应用技能的附加效果（非伤害类）
     * 返回效果描述文本，null表示无附加效果
     */
    applySkillEffect(skill, user, target) {
        // 状态异常施加
        if (skill.statusEffect && skill.statusChance) {
            const inflicted = this.tryInflictStatus(target, skill.statusEffect, skill.statusChance);
            if (inflicted) {
                const effectName = BattleEngine.STATUS_EFFECTS[skill.statusEffect]?.name || skill.statusEffect;
                return `${target.name}陷入了${effectName}状态！`;
            }
        }

        switch (skill.name) {
            case '叫声':
                target.statModifiers.attack = Math.max(-6, target.statModifiers.attack - 1);
                return `${target.name}的攻击力降低了！`;
            case '变硬':
                user.statModifiers.defense = Math.min(6, user.statModifiers.defense + 1);
                return `${user.name}的防御力提升了！`;
            case '龙之舞':
                user.statModifiers.attack = Math.min(6, user.statModifiers.attack + 1);
                user.statModifiers.speed = Math.min(6, user.statModifiers.speed + 1);
                return `${user.name}的攻击和速度提升了！`;
            default:
                return null;
        }
    }

    // ════════════════════════════════════
    //   AI 决策（保持不变）
    // ════════════════════════════════════

    /**
     * AI 选择使用哪个技能
     * 策略：60%概率选择属性克制的有威力技能，否则随机选有威力的
     */
    aiSelectSkill(creature, targetType) {
        const available = creature.skills.filter(s => s.currentPP > 0);
        if (available.length === 0) return null;

        // 优先选择属性克制的技能
        const effectiveSkills = available.filter(s => {
            const mult = this.getTypeMultiplier(s.type, targetType);
            return mult > 1 && s.power > 0;
        });

        if (effectiveSkills.length > 0 && Math.random() < 0.6) {
            return effectiveSkills[Math.floor(Math.random() * effectiveSkills.length)];
        }

        // 随机选择有威力的技能
        const powerSkills = available.filter(s => s.power > 0);
        if (powerSkills.length > 0) {
            return powerSkills[Math.floor(Math.random() * powerSkills.length)];
        }

        return available[Math.floor(Math.random() * available.length)];
    }

    // ════════════════════════════════════
    //   回合执行（保持不变）
    // ════════════════════════════════════

    /** 判断先后手（速度优先） */
    determineTurnOrder() {
        let pSpd = this.state.playerCreature.stats.speed * (1 + this.state.playerCreature.statModifiers.speed * 0.25);
        let eSpd = this.state.enemyCreature.stats.speed * (1 + this.state.enemyCreature.statModifiers.speed * 0.25);

        // 麻痹状态：速度降为25%
        if (this.state.playerCreature.status === 'paralyze') pSpd = Math.floor(pSpd * 0.25);
        if (this.state.enemyCreature.status === 'paralyze') eSpd = Math.floor(eSpd * 0.25);

        return pSpd >= eSpd;
    }

    /** 应用伤害到目标 */
    applyDamage(target, damage) {
        target.currentHP = Math.max(0, target.currentHP - damage);
        return target.currentHP <= 0;
    }

    // ════════════════════════════════════
    //   捕捉系统（V1 微调）
    // ════════════════════════════════════

    /**
     * 计算捕捉成功率并执行判定 - V1 升级版
     * 公式：catchChance = ballRate × (3*MaxHP-2*CurHP)/(3*MaxHP) × statusMod
     */
    tryCatch(ballRate, itemData) {
        if (this.state.battleType !== 'wild') return false;

        const enemy = this.state.enemyCreature;
        const maxHp = enemy.maxHP || enemy.stats?.maxHP || 100;
        const currentHp = enemy.currentHP;
        const hpRatio = (3 * maxHp - 2 * currentHp) / (3 * maxHp); // HP越低越容易抓

        // 稀有度修正
        const rarityBonus = enemy.rarity === 'rare' ? 0.7 :
                            enemy.rarity === 'legendary' ? 0.3 : 1;

        // 状态修正
        let statusMod = 1;
        if (enemy.status === 'sleep' || enemy.status === 'freeze') statusMod = 2.5;
        else if (enemy.status === 'paralyze' || enemy.status === 'poison' || enemy.status === 'burn') statusMod = 1.5;

        const catchChance = (itemData?.catchRate || ballRate) * hpRatio * rarityBonus * statusMod;

        return Math.random() < Math.min(0.95, catchChance);
    }

    // ════════════════════════════════════
    //   逃跑系统（保持不变）
    // ════════════════════════════════════

    tryRun() {
        if (this.state.battleType === 'trainer') return false;

        const pSpd = this.state.playerCreature.stats.speed;
        const eSpd = this.state.enemyCreature.stats.speed;
        // V1微调：每回合增加逃跑概率上限
        const turnBonus = Math.min(0.15, this.state.turn * 0.03);
        const runChance = Math.min(0.95, pSpd / (pSpd + eSpd) + 0.45 + turnBonus);

        return Math.random() < runChance;
    }

    // ════════════════════════════════════
    //   战斗结束检测（保持不变）
    // ════════════════════════════════════

    checkBattleEnd() {
        if (this.state.result) return this.state.result;

        if (this.state.enemyCreature.currentHP <= 0) {
            if (this.state.battleType === 'trainer' && this.state.trainerParty.length > 0) {
                return 'next_creature';
            }
            this.state.result = 'win';
            this.state.phase = 'result';
            if (this.eventBus) this.eventBus.emit(GameEvents.BATTLE_END, { result: 'win' });
            return 'win';
        }

        if (this.state.playerCreature.currentHP <= 0) {
            this.state.result = 'lose';
            this.state.phase = 'result';
            if (this.eventBus) this.eventBus.emit(GameEvents.BATTLE_END, { result: 'lose' });
            return 'lose';
        }

        return null;
    }

    sendNextTrainerCreature() {
        if (!this.state.trainerParty || this.state.trainerParty.length === 0) return null;
        const next = this.state.trainerParty.find(c => c.currentHP > 0);
        if (next) {
            next.statModifiers = { attack: 0, defense: 0, speed: 0 };
            this.state.enemyCreature = next;
            this._addLog(`训练师派出了${next.name}！`);
            return next;
        }
        return null;
    }

    /** 战斗胜利奖励计算 */
    calcWinRewards() {
        const enemy = this.state.enemyCreature;
        const expGain = Math.floor(enemy.level * 15 + 20);
        const goldGain = Math.floor(enemy.level * 10 + 10);

        let trainerBonus = 0;
        if (this.state.battleType === 'trainer' && this.state.trainerNPC) {
            trainerBonus = this.state.trainerNPC.reward || 0;
        }

        return { expGain, goldGain: goldGain + trainerBonus };
    }

    // ════════════════════════════════════
    //   日志管理
    // ════════════════════════════════════

    addLog(text) {
        this.state.log.push(text);
        if (this.state.log.length > 8) this.state.log.shift(); // V1: 日志容量从5扩到8
    }

    getLogs() { return this.state.log || []; }

    // ════════════════════════════════════
    //   阶段控制
    // ════════════════════════════════════

    getPhase() { return this.state ? this.state.phase : 'idle'; }
    setPhase(phase) { if (this.state) this.state.phase = phase; }
    getResult() { return this.state ? this.state.result : null; }
    setResult(result) { if (this.state) this.state.result = result; }
    getState() { return this.state; }

    endBattle() {
        const result = this.state ? this.state.result : null;
        this.state = null;
        return result;
    }

    // ─── 内部方法 ───
    _addLog(text) {
        if (this.state) {
            this.state.log.push(text);
            if (this.state.log.length > 8) this.state.log.shift();
        }
    }

    // ════════════════════════════════════
    //   状态异常系统
    // ════════════════════════════════════

    /** 尝试施加状态异常 */
    tryInflictStatus(target, statusName, chance) {
        // 已有状态不能覆盖（睡眠除外可以被其他状态覆盖）
        if (target.status && target.status !== 'sleep') return false;
        if (statusName === 'sleep' && target.status) return false;

        // 属性免疫：火系免疫烧伤，冰系免疫冰冻，毒系免疫中毒
        const immunities = { fire: 'burn', ice: 'freeze', poison: 'poison' };
        if (immunities[target.type] === statusName) return false;

        // 概率判定
        if (Math.random() > chance) return false;

        target.status = statusName;
        target.statusTurns = 0;
        return true;
    }

    /** 回合结束时处理状态异常 */
    processEndOfTurnStatus(creature) {
        if (!creature.status) return null;

        const effect = BattleEngine.STATUS_EFFECTS[creature.status];
        creature.statusTurns++;

        const messages = [];

        // 中毒/烧伤扣血
        if (effect.turnDamage > 0) {
            const damage = Math.max(1, Math.floor(creature.maxHP * effect.turnDamage));
            creature.currentHP = Math.max(0, creature.currentHP - damage);
            messages.push(`${creature.name}受到了${effect.name}的伤害！(-${damage}HP)`);
        }

        // 冰冻：20%概率自然解冻
        if (creature.status === 'freeze' && Math.random() < effect.thawChance) {
            creature.status = null;
            creature.statusTurns = 0;
            messages.push(`${creature.name}从${effect.name}中恢复了！`);
        }

        // 睡眠：33%概率自然苏醒
        if (creature.status === 'sleep' && Math.random() < effect.wakeChance) {
            creature.status = null;
            creature.statusTurns = 0;
            messages.push(`${creature.name}醒来了！`);
        }

        return messages.length > 0 ? messages : null;
    }

    /** 检查状态异常是否阻止行动 */
    canAct(creature) {
        if (!creature.status) return { canAct: true };

        const effect = BattleEngine.STATUS_EFFECTS[creature.status];

        if (!effect.canAct) {
            // 冰冻/睡眠：无法行动
            return { canAct: false, reason: `${creature.name}处于${effect.name}状态，无法行动！` };
        }

        if (creature.status === 'paralyze' && Math.random() > effect.actChance) {
            // 麻痹：25%概率无法行动
            return { canAct: false, reason: `${creature.name}因${effect.name}而无法行动！` };
        }

        return { canAct: true };
    }
}

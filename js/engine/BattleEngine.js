/**
 * BattleEngine - 战斗引擎（纯逻辑层）
 * 负责伤害计算、属性克制、AI决策、回合执行、战斗流程
 * 不包含任何渲染或输入处理
 */
class BattleEngine {
    constructor(eventBus) {
        this.eventBus = eventBus || null;
        this.state = null;

        // 属性克制表（克制1.5x，被克制0.67x）— 完整版
        this.typeChart = {
            fire: { grass: 1.5, water: 0.67, rock: 0.67 },
            water: { fire: 1.5, grass: 0.67, rock: 1.5 },
            grass: { water: 1.5, fire: 0.67, rock: 1.5 },
            electric: { water: 1.5, rock: 0.67 },
            rock: { fire: 1.5, water: 0.67 },
            dark: { dragon: 1.5 },
            dragon: { dragon: 1.5 },
            normal: {}
        };
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
            log: []
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
            log: []
        };
        playerCreature.statModifiers = { attack: 0, defense: 0, speed: 0 };
        enemyCreature.statModifiers = { attack: 0, defense: 0, speed: 0 };
        this._addLog(`训练师${trainerNPC.name}发起了挑战！`);
        if (this.eventBus) this.eventBus.emit(GameEvents.BATTLE_START, this.state);
        return this.state;
    }

    // ─── 属性克制系统 ───

    /** 获取属性克制倍率 */
    getTypeMultiplier(attackType, defenderType) {
        if (!attackType || !defenderType) return 1;
        const chart = this.typeChart[attackType];
        if (!chart) return 1;
        return chart[defenderType] || 1;
    }

    // ─── 伤害计算 ───

    /**
     * 计算技能伤害
     * 公式：floor(攻修正 * 技能威力 / 防修正) * 属性克制 * 随机因子(0.85~1.0)
     */
    calcDamage(attacker, skill, defender) {
        if (skill.power === 0) return 0;

        const atkStat = attacker.stats.attack * (1 + attacker.statModifiers.attack * 0.25);
        const defStat = defender.stats.defense * (1 + defender.statModifiers.defense * 0.25);
        const typeMult = this.getTypeMultiplier(skill.type, defender.type);
        const random = 0.85 + Math.random() * 0.15;

        const damage = Math.floor((atkStat * skill.power / defStat) * typeMult * random);
        return Math.max(1, damage);
    }

    // ─── 技能效果 ───

    /**
     * 应用技能的附加效果（非伤害类）
     * 返回效果描述文本，null表示无附加效果
     */
    applySkillEffect(skill, user, target) {
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

    // ─── AI 决策 ───

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

    // ─── 回合执行 ───

    /**
     * 判断先后手（速度优先）
     * @returns {boolean} true=玩家先手
     */
    determineTurnOrder() {
        const pSpd = this.state.playerCreature.stats.speed * (1 + this.state.playerCreature.statModifiers.speed * 0.25);
        const eSpd = this.state.enemyCreature.stats.speed * (1 + this.state.enemyCreature.statModifiers.speed * 0.25);
        return pSpd >= eSpd;
    }

    /**
     * 应用伤害到目标
     * @returns {boolean} true=目标HP归零（倒下）
     */
    applyDamage(target, damage) {
        target.currentHP = Math.max(0, target.currentHP - damage);
        return target.currentHP <= 0;
    }

    // ─── 捕捉系统 ───

    /**
     * 计算捕捉成功率并执行判定
     * @param {number} ballRate - 精灵球的基础捕捉率
     * @param {object} itemData - 精灵球物品数据（含 catchRate）
     * @returns {boolean} true=捕捉成功
     */
    tryCatch(ballRate, itemData) {
        if (this.state.battleType !== 'wild') return false;

        const enemy = this.state.enemyCreature;
        const hpRatio = enemy.currentHP / enemy.maxHP;
        const rarityBonus = enemy.rarity === 'rare' ? 0.7 :
                            enemy.rarity === 'legendary' ? 0.3 : 1;
        const catchChance = (itemData || {}).catchRate || ballRate;
        const finalRate = catchChance * (1 - hpRatio * 0.5) * rarityBonus;

        return Math.random() < finalRate;
    }

    // ─── 逃跑系统 ───

    /**
     * 计算逃跑成功率并执行判定
     * @returns {boolean} true=逃跑成功
     */
    tryRun() {
        if (this.state.battleType === 'trainer') return false;

        const pSpd = this.state.playerCreature.stats.speed;
        const eSpd = this.state.enemyCreature.stats.speed;
        const runChance = Math.min(0.9, pSpd / (pSpd + eSpd) + 0.45);

        return Math.random() < runChance;
    }

    // ─── 战斗结束检测 ───

    /**
     * 检查战斗是否结束
     * @returns {string|null} 'win' | 'lose' | null
     */
    checkBattleEnd() {
        if (this.state.result) return this.state.result;

        if (this.state.enemyCreature.currentHP <= 0) {
            // 训练师战斗：检查后备精灵
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

    /** 训练师派出下一只精灵 */
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

    // ─── 日志管理 ───

    /** 添加战斗日志（最多保留5条） */
    addLog(text) {
        this.state.log.push(text);
        if (this.state.log.length > 5) this.state.log.shift();
    }

    getLogs() {
        return this.state.log || [];
    }

    // ─── 阶段控制 ───

    getPhase() { return this.state ? this.state.phase : 'idle'; }
    setPhase(phase) { if (this.state) this.state.phase = phase; }
    getResult() { return this.state ? this.state.result : null; }
    setResult(result) { if (this.state) this.state.result = result; }

    /** 获取当前状态的只读副本 */
    getState() { return this.state; }

    /** 结束战斗 */
    endBattle() {
        const result = this.state ? this.state.result : null;
        this.state = null;
        return result;
    }

    // ─── 内部方法 ───
    _addLog(text) {
        if (this.state) {
            this.state.log.push(text);
            if (this.state.log.length > 5) this.state.log.shift();
        }
    }
}

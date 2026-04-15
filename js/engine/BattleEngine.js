/**
 * BattleEngine - 战斗引擎（纯逻辑层）
 * 负责战斗流程、伤害计算、AI决策
 */
class BattleEngine {
    constructor(eventBus) {
        this.eventBus = eventBus;
        this.state = null;
        
        // 属性克制表
        this.typeChart = {
            'fire': { 'grass': 2, 'water': 0.5, 'fire': 0.5 },
            'water': { 'fire': 2, 'grass': 0.5, 'water': 0.5 },
            'grass': { 'water': 2, 'fire': 0.5, 'grass': 0.5 },
            'electric': { 'water': 2, 'grass': 0.5 },
            'normal': {}
        };
    }

    /** 初始化战斗 */
    initBattle(config) {
        this.state = {
            phase: 'menu', // menu, skillSelect, animating, result
            turn: 0,
            playerCreature: config.playerCreature,
            enemyCreature: config.enemyCreature,
            battleType: config.battleType || 'wild',
            trainerNPC: config.trainerNPC || null,
            trainerParty: config.trainerParty || [],
            log: [],
            result: null
        };
        this.eventBus.emit(GameEvents.BATTLE_START, this.state);
        return this.state;
    }

    /** 玩家选择技能 */
    selectSkill(skillIndex) {
        if (this.state.phase !== 'skillSelect') return null;
        return this._executeTurn(skillIndex);
    }

    /** 执行回合 */
    _executeTurn(playerSkillIndex) {
        const player = this.state.playerCreature;
        const enemy = this.state.enemyCreature;
        const playerSkill = player.skills[playerSkillIndex];
        
        // 计算行动顺序（速度决定）
        const playerFirst = player.speed >= enemy.speed;
        
        const actions = [];
        
        if (playerFirst) {
            actions.push(this._createAttackAction(player, enemy, playerSkill, 'player'));
            if (enemy.currentHP > 0) {
                const enemySkill = this._aiSelectSkill(enemy);
                actions.push(this._createAttackAction(enemy, player, enemySkill, 'enemy'));
            }
        } else {
            const enemySkill = this._aiSelectSkill(enemy);
            actions.push(this._createAttackAction(enemy, player, enemySkill, 'enemy'));
            if (player.currentHP > 0) {
                actions.push(this._createAttackAction(player, enemy, playerSkill, 'player'));
            }
        }
        
        this.state.turn++;
        this.state.phase = 'animating';
        
        return actions;
    }

    /** 创建攻击动作 */
    _createAttackAction(attacker, defender, skill, source) {
        const damage = this._calcDamage(attacker, defender, skill);
        return {
            type: 'attack',
            attacker,
            defender,
            skill,
            source,
            damage,
            effective: this._getTypeMultiplier(skill.type, defender.type)
        };
    }

    /** 计算伤害 */
    _calcDamage(attacker, defender, skill) {
        const baseDamage = skill.power || 40;
        const attack = skill.category === 'special' ? attacker.spAttack : attacker.attack;
        const defense = skill.category === 'special' ? defender.spDefense : defender.defense;
        
        const typeMultiplier = this._getTypeMultiplier(skill.type, defender.type);
        const random = 0.85 + Math.random() * 0.15;
        
        const damage = Math.floor(
            ((2 * attacker.level / 5 + 2) * baseDamage * attack / defense / 50 + 2) 
            * typeMultiplier * random
        );
        
        return Math.max(1, damage);
    }

    /** 获取属性克制倍率 */
    _getTypeMultiplier(attackType, defenseType) {
        if (!attackType || !defenseType) return 1;
        const chart = this.typeChart[attackType];
        if (!chart) return 1;
        return chart[defenseType] || 1;
    }

    /** AI选择技能 */
    _aiSelectSkill(creature) {
        const skills = creature.skills.filter(s => s && s.power > 0);
        if (skills.length === 0) return creature.skills[0];
        // 简单AI：随机选择，偏好高威力技能
        const weights = skills.map(s => s.power);
        const total = weights.reduce((a, b) => a + b, 0);
        let rand = Math.random() * total;
        for (let i = 0; i < skills.length; i++) {
            rand -= weights[i];
            if (rand <= 0) return skills[i];
        }
        return skills[0];
    }

    /** 应用伤害 */
    applyDamage(target, damage) {
        target.currentHP = Math.max(0, target.currentHP - damage);
        return target.currentHP <= 0;
    }

    /** 检查战斗结束 */
    checkBattleEnd() {
        if (this.state.playerCreature.currentHP <= 0) {
            this.state.result = 'lose';
            this.state.phase = 'result';
            this.eventBus.emit(GameEvents.BATTLE_END, { result: 'lose' });
            return 'lose';
        }
        if (this.state.enemyCreature.currentHP <= 0) {
            if (this.state.battleType === 'trainer' && this.state.trainerParty.length > 0) {
                // 训练师还有后备精灵
                const next = this.state.trainerParty.shift();
                this.state.enemyCreature = next;
                return 'next';
            }
            this.state.result = 'win';
            this.state.phase = 'result';
            this.eventBus.emit(GameEvents.BATTLE_END, { result: 'win' });
            return 'win';
        }
        return null;
    }

    /** 尝试捕捉 */
    tryCatch(ballRate = 1) {
        const enemy = this.state.enemyCreature;
        const hpRatio = enemy.currentHP / enemy.maxHP;
        const catchRate = (1 - hpRatio * 0.5) * ballRate * (enemy.catchRate || 150);
        const roll = Math.random() * 255;
        return roll < catchRate;
    }

    /** 尝试逃跑 */
    tryRun() {
        if (this.state.battleType === 'trainer') return false;
        return Math.random() > 0.3;
    }

    /** 获取当前状态 */
    getState() {
        return this.state;
    }

    /** 设置阶段 */
    setPhase(phase) {
        this.state.phase = phase;
    }

    /** 结束战斗 */
    endBattle() {
        const result = this.state.result;
        this.state = null;
        return result;
    }
}

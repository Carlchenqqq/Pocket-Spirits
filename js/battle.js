/**
 * BattleManager - 回合制战斗系统
 * 处理战斗流程、伤害计算、AI、动画
 */
class BattleManager {
    constructor(ctx, canvas, creaturesManager, uiManager) {
        this.ctx = ctx;
        this.canvas = canvas;
        this.W = canvas.width;
        this.H = canvas.height;
        this.cm = creaturesManager;
        this.ui = uiManager;

        // 战斗状态
        this.active = false;
        this.phase = 'idle'; // idle, menu, skillSelect, animating, result
        this.battleType = 'wild'; // wild, trainer

        // 战斗参与者
        this.playerCreature = null;
        this.enemyCreature = null;
        this.trainerNPC = null;

        // 菜单选择
        this.menuIndex = 0;
        this.skillIndex = 0;
        this.menuItems = ['攻击', '捕捉', '切换', '逃跑'];

        // 动画
        this.animTimer = 0;
        this.animDuration = 0;
        this.animCallback = null;
        this.shakeOffset = { x: 0, y: 0 };
        this.flashTimer = 0;

        // 战斗结果
        this.result = null; // 'win', 'lose', 'catch_success', 'catch_fail', 'run'
        this.resultCallback = null;
        this.caughtCreatureId = 0;

        // 属性克制表（克制1.5x，被克制0.67x）
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

        // 战斗日志
        this.battleLog = [];
    }

    /** 开始野生精灵战斗 */
    startWildBattle(creature) {
        this.active = true;
        this.battleType = 'wild';
        this.phase = 'menu';
        this.menuIndex = 0;
        this.skillIndex = 0;
        this.playerCreature = this.cm.getFirstAlive();
        this.enemyCreature = creature;
        this.trainerNPC = null;
        this.result = null;
        this.battleLog = [];

        // 重置战斗属性修正
        this.playerCreature.statModifiers = { attack: 0, defense: 0, speed: 0 };
        this.enemyCreature.statModifiers = { attack: 0, defense: 0, speed: 0 };

        this._addLog(`野生的${creature.name}出现了！`);
    }

    /** 开始训练师战斗 */
    startTrainerBattle(trainerNPC, trainerParty) {
        this.active = true;
        this.battleType = 'trainer';
        this.phase = 'menu';
        this.menuIndex = 0;
        this.skillIndex = 0;
        this.playerCreature = this.cm.getFirstAlive();
        this.enemyCreature = trainerParty.find(c => c.currentHP > 0);
        this.trainerNPC = trainerNPC;
        this.trainerParty = trainerParty;
        this.result = null;
        this.battleLog = [];

        this.playerCreature.statModifiers = { attack: 0, defense: 0, speed: 0 };
        this.enemyCreature.statModifiers = { attack: 0, defense: 0, speed: 0 };

        this._addLog(`训练师${trainerNPC.name}发起了挑战！`);
    }

    /** 获取属性克制倍率 */
    _getTypeMultiplier(attackType, defenderType) {
        if (this.typeChart[attackType] && this.typeChart[attackType][defenderType]) {
            return this.typeChart[attackType][defenderType];
        }
        return 1;
    }

    /** 计算伤害 */
    _calcDamage(attacker, skill, defender) {
        if (skill.power === 0) return 0;

        const atkStat = attacker.stats.attack * (1 + attacker.statModifiers.attack * 0.25);
        const defStat = defender.stats.defense * (1 + defender.statModifiers.defense * 0.25);
        const typeMultiplier = this._getTypeMultiplier(skill.type, defender.type);
        const random = 0.85 + Math.random() * 0.15;

        const damage = Math.floor((atkStat * skill.power / defStat) * typeMultiplier * random);
        return Math.max(1, damage);
    }

    /** 执行技能效果 */
    _applySkillEffect(skill, user, target) {
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
            case '吸血':
                return null; // 特殊处理在伤害之后
            default:
                return null;
        }
    }

    /** 玩家选择攻击 */
    selectAttack() {
        this.phase = 'skillSelect';
        this.skillIndex = 0;
    }

    /** 玩家选择技能 */
    confirmSkill() {
        const skill = this.playerCreature.skills[this.skillIndex];
        if (!skill || skill.currentPP <= 0) return;

        this._executeTurn(skill, true);
    }

    /** 玩家选择捕捉 */
    selectCatch() {
        if (this.battleType !== 'wild') {
            this._addLog('训练师战斗中无法捕捉！');
            return;
        }

        // 查找精灵球
        let ballId = 1; // 精灵球
        if (this.cm.getItemCount(2) > 0) ballId = 2; // 优先使用超级球
        if (this.cm.getItemCount(ballId) === 0) {
            this._addLog('没有精灵球了！');
            return;
        }

        this.cm.useItem(ballId);
        const ballData = this.cm.getItemData(ballId);
        this._addLog(`使用了${ballData.name}！`);

        // 捕捉概率计算
        const hpRatio = this.enemyCreature.currentHP / this.enemyCreature.maxHP;
        const rarityBonus = this.enemyCreature.rarity === 'rare' ? 0.7 :
                           this.enemyCreature.rarity === 'legendary' ? 0.3 : 1;
        const catchChance = ballData.catchRate * (1 - hpRatio * 0.5) * rarityBonus;

        this.phase = 'animating';
        this.animDuration = 1500;
        this.animTimer = 0;
        this.animCallback = () => {
            if (Math.random() < catchChance) {
                this.caughtCreatureId = this.enemyCreature.id;
                this._addLog(`成功捕获了${this.enemyCreature.name}！`);
                this.result = 'catch_success';
                this.cm.addToParty(this.enemyCreature);
                this.phase = 'result';
            } else {
                this._addLog(`${this.enemyCreature.name}挣脱了！`);
                // 敌方反击
                this._enemyTurn();
            }
        };
    }

    /** 玩家选择切换精灵 */
    selectSwitch() {
        const aliveCreatures = this.cm.party.filter(c => c.currentHP > 0 && c !== this.playerCreature);
        if (aliveCreatures.length === 0) {
            this._addLog('没有可以切换的精灵！');
            return;
        }

        this.ui.showCreatureSelect(aliveCreatures, (index) => {
            if (index >= 0) {
                this.ui.closeCreatureSelect();
                const newCreature = aliveCreatures[index];
                this.playerCreature = newCreature;
                this.playerCreature.statModifiers = { attack: 0, defense: 0, speed: 0 };
                this._addLog(`上吧，${newCreature.name}！`);
                this._enemyTurn();
            } else {
                this.ui.closeCreatureSelect();
                this.phase = 'menu';
            }
        });
        // 使用 animating phase 暂停战斗输入，设置大 animDuration 防止自动触发回调
        this.phase = 'animating';
        this.animDuration = Infinity;
        this.animTimer = 0;
        this.animCallback = null;
    }

    /** 玩家选择逃跑 */
    selectRun() {
        if (this.battleType !== 'wild') {
            this._addLog('训练师战斗中无法逃跑！');
            return;
        }

        // 逃跑概率（根据速度）
        const playerSpeed = this.playerCreature.stats.speed;
        const enemySpeed = this.enemyCreature.stats.speed;
        const runChance = Math.min(0.9, playerSpeed / (playerSpeed + enemySpeed) + 0.3);

        if (Math.random() < runChance) {
            this._addLog('成功逃跑了！');
            this.result = 'run';
            this.phase = 'result';
        } else {
            this._addLog('逃跑失败！');
            this._enemyTurn();
        }
    }

    /** 执行回合 */
    _executeTurn(playerSkill) {
        this.phase = 'animating';

        // 判断先后手
        const playerSpeed = this.playerCreature.stats.speed * (1 + this.playerCreature.statModifiers.speed * 0.25);
        const enemySpeed = this.enemyCreature.stats.speed * (1 + this.enemyCreature.statModifiers.speed * 0.25);
        const playerFirst = playerSpeed >= enemySpeed;

        if (playerFirst) {
            this._playerAttack(playerSkill, () => {
                if (this.result) return;
                this._enemyAttack(() => {
                    this._checkBattleEnd();
                });
            });
        } else {
            this._enemyAttack(() => {
                if (this.result) return;
                this._playerAttack(playerSkill, () => {
                    this._checkBattleEnd();
                });
            });
        }
    }

    /** 玩家攻击 */
    _playerAttack(skill, callback) {
        skill.currentPP--;
        this._addLog(`${this.playerCreature.name}使用了${skill.name}！`);

        // 技能效果
        const effectMsg = this._applySkillEffect(skill, this.playerCreature, this.enemyCreature);
        if (effectMsg) {
            this._addLog(effectMsg);
            this.animDuration = 800;
            this.animTimer = 0;
            this.animCallback = callback;
            return;
        }

        const damage = this._calcDamage(this.playerCreature, skill, this.enemyCreature);
        this.enemyCreature.currentHP = Math.max(0, this.enemyCreature.currentHP - damage);

        // 属性克制提示
        const typeMultiplier = this._getTypeMultiplier(skill.type, this.enemyCreature.type);
        if (typeMultiplier > 1) {
            this._addLog('效果拔群！');
        } else if (typeMultiplier < 1) {
            this._addLog('效果不太好...');
        }

        // 吸血技能恢复HP
        if (skill.name === '吸血' && damage > 0) {
            const healAmount = Math.floor(damage / 2);
            this.playerCreature.currentHP = Math.min(this.playerCreature.maxHP, this.playerCreature.currentHP + healAmount);
            this._addLog(`${this.playerCreature.name}恢复了${healAmount}HP！`);
        }

        this._addLog(`造成了${damage}点伤害！`);

        // 攻击动画
        this.shakeTarget = 'enemy';
        this.animDuration = 600;
        this.animTimer = 0;
        this.animCallback = () => {
            this.shakeTarget = null;
            if (this.enemyCreature.currentHP <= 0) {
                this._addLog(`${this.enemyCreature.name}倒下了！`);
                this._handleEnemyFainted(callback);
            } else {
                callback();
            }
        };
    }

    /** 敌方攻击 */
    _enemyAttack(callback) {
        // AI选择技能
        const skill = this._aiSelectSkill();
        if (!skill) {
            callback();
            return;
        }

        skill.currentPP--;
        this._addLog(`${this.enemyCreature.name}使用了${skill.name}！`);

        const effectMsg = this._applySkillEffect(skill, this.enemyCreature, this.playerCreature);
        if (effectMsg) {
            this._addLog(effectMsg);
            this.animDuration = 800;
            this.animTimer = 0;
            this.animCallback = callback;
            return;
        }

        const damage = this._calcDamage(this.enemyCreature, skill, this.playerCreature);
        this.playerCreature.currentHP = Math.max(0, this.playerCreature.currentHP - damage);

        const typeMultiplier = this._getTypeMultiplier(skill.type, this.playerCreature.type);
        if (typeMultiplier > 1) this._addLog('效果拔群！');
        else if (typeMultiplier < 1) this._addLog('效果不太好...');

        if (skill.name === '吸血' && damage > 0) {
            const healAmount = Math.floor(damage / 2);
            this.enemyCreature.currentHP = Math.min(this.enemyCreature.maxHP, this.enemyCreature.currentHP + healAmount);
        }

        this._addLog(`造成了${damage}点伤害！`);

        this.shakeTarget = 'player';
        this.animDuration = 600;
        this.animTimer = 0;
        this.animCallback = () => {
            this.shakeTarget = null;
            if (this.playerCreature.currentHP <= 0) {
                this._addLog(`${this.playerCreature.name}倒下了！`);
                this._handlePlayerFainted(callback);
            } else {
                callback();
            }
        };
    }

    /** 敌方回合 */
    _enemyTurn() {
        this._enemyAttack(() => {
            this._checkBattleEnd();
        });
    }

    /** AI选择技能 */
    _aiSelectSkill() {
        const available = this.enemyCreature.skills.filter(s => s.currentPP > 0);
        if (available.length === 0) return null;

        // 优先选择属性克制的技能
        const effectiveSkills = available.filter(s => {
            const mult = this._getTypeMultiplier(s.type, this.playerCreature.type);
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

    /** 处理敌方精灵倒下 */
    _handleEnemyFainted(callback) {
        // 经验值和金币
        const expGain = Math.floor(this.enemyCreature.level * 15 + 20);
        const goldGain = Math.floor(this.enemyCreature.level * 10 + 10);
        const leveledUp = this.cm.addExp(this.playerCreature, expGain);
        this.cm.gold += goldGain;

        this._addLog(`获得${expGain}经验值和${goldGain}金币！`);
        if (leveledUp) {
            this._addLog(`${this.playerCreature.name}升到了${this.playerCreature.level}级！`);
        }

        // 训练师战斗：检查是否还有下一只精灵
        if (this.battleType === 'trainer' && this.trainerParty) {
            const nextCreature = this.trainerParty.find(c => c.currentHP > 0);
            if (nextCreature) {
                this._addLog(`训练师派出了${nextCreature.name}！`);
                this.animDuration = 1000;
                this.animTimer = 0;
                this.animCallback = () => {
                    this.enemyCreature = nextCreature;
                    this.enemyCreature.statModifiers = { attack: 0, defense: 0, speed: 0 };
                    this.phase = 'menu';
                };
                return;
            }

            // 训练师全部精灵倒下
            if (this.trainerNPC) {
                this.cm.gold += (this.trainerNPC.reward || 0);
                this._addLog(`战胜了训练师${this.trainerNPC.name}！获得${this.trainerNPC.reward}金币！`);
            }
        }

        this.result = 'win';
        this.phase = 'result';
        if (callback) callback();
    }

    /** 处理玩家精灵倒下 */
    _handlePlayerFainted(callback) {
        const nextAlive = this.cm.party.find(c => c.currentHP > 0 && c !== this.playerCreature);
        if (nextAlive) {
            this._addLog(`上吧，${nextAlive.name}！`);
            this.animDuration = 1000;
            this.animTimer = 0;
            this.animCallback = () => {
                this.playerCreature = nextAlive;
                this.playerCreature.statModifiers = { attack: 0, defense: 0, speed: 0 };
                this.phase = 'menu';
            };
        } else {
            // 全灭
            this.result = 'lose';
            this.phase = 'result';
            if (callback) callback();
        }
    }

    /** 检查战斗是否结束 */
    _checkBattleEnd() {
        if (this.result) return;
        if (this.enemyCreature.currentHP <= 0 || this.cm.isPartyFainted()) {
            this.phase = 'result';
        } else {
            this.phase = 'menu';
        }
    }

    /** 添加战斗日志 */
    _addLog(text) {
        this.battleLog.push(text);
        if (this.battleLog.length > 5) this.battleLog.shift();
    }

    /** 更新战斗 */
    update(deltaTime) {
        if (!this.active) return;

        // 更新动画
        if (this.phase === 'animating') {
            this.animTimer += deltaTime;

            // 抖动效果
            if (this.shakeTarget) {
                const progress = this.animTimer / this.animDuration;
                if (progress < 0.5) {
                    this.shakeOffset.x = (Math.random() - 0.5) * 6;
                    this.shakeOffset.y = (Math.random() - 0.5) * 4;
                } else {
                    this.shakeOffset.x = 0;
                    this.shakeOffset.y = 0;
                }
            }

            if (this.animTimer >= this.animDuration) {
                this.shakeOffset.x = 0;
                this.shakeOffset.y = 0;
                if (this.animCallback) {
                    const cb = this.animCallback;
                    this.animCallback = null;
                    cb();
                }
            }
        }
    }

    /** 渲染战斗界面 */
    render() {
        if (!this.active) return;

        const ctx = this.ctx;

        // 战斗背景
        this._renderBattleBackground(ctx);

        // 敌方精灵（上方）
        this._renderEnemyCreature(ctx);

        // 我方精灵（下方）
        this._renderPlayerCreature(ctx);

        // 敌方信息框
        this._renderEnemyInfo(ctx);

        // 我方信息框
        this._renderPlayerInfo(ctx);

        // 战斗菜单
        if (this.phase === 'menu') {
            this._renderBattleMenu(ctx);
        }

        // 技能选择
        if (this.phase === 'skillSelect') {
            this._renderSkillSelect(ctx);
        }

        // 战斗日志
        this._renderBattleLog(ctx);

        // 结果画面
        if (this.phase === 'result') {
            this._renderResult(ctx);
        }
    }

    /** 渲染战斗背景 */
    _renderBattleBackground(ctx) {
        // 渐变背景
        const gradient = ctx.createLinearGradient(0, 0, 0, this.H);
        gradient.addColorStop(0, '#87CEEB');
        gradient.addColorStop(0.5, '#98FB98');
        gradient.addColorStop(1, '#228B22');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, this.W, this.H);

        // 远山细节
        ctx.fillStyle = '#5a8a4a';
        ctx.beginPath();
        ctx.moveTo(0, this.H * 0.45);
        ctx.lineTo(80, this.H * 0.3);
        ctx.lineTo(160, this.H * 0.42);
        ctx.lineTo(240, this.H * 0.28);
        ctx.lineTo(360, this.H * 0.38);
        ctx.lineTo(440, this.H * 0.32);
        ctx.lineTo(540, this.H * 0.4);
        ctx.lineTo(640, this.H * 0.35);
        ctx.lineTo(640, this.H * 0.5);
        ctx.lineTo(0, this.H * 0.5);
        ctx.fill();

        // 云朵
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        // 云1
        ctx.fillRect(60, 30, 40, 12);
        ctx.fillRect(50, 36, 60, 10);
        ctx.fillRect(55, 26, 30, 8);
        // 云2
        ctx.fillRect(350, 50, 50, 14);
        ctx.fillRect(340, 56, 70, 10);
        ctx.fillRect(355, 44, 40, 10);
        // 云3
        ctx.fillRect(520, 20, 35, 10);
        ctx.fillRect(512, 26, 50, 8);

        // 地面
        ctx.fillStyle = '#4a8c3f';
        ctx.fillRect(0, this.H * 0.6, this.W, this.H * 0.4);
        // 地面纹理
        ctx.fillStyle = '#3d7a34';
        ctx.fillRect(20, this.H * 0.65, 30, 2);
        ctx.fillRect(100, this.H * 0.72, 40, 2);
        ctx.fillRect(300, this.H * 0.68, 35, 2);
        ctx.fillRect(450, this.H * 0.75, 25, 2);
    }

    /** 渲染敌方精灵 */
    _renderEnemyCreature(ctx) {
        if (!this.enemyCreature) return;
        const ox = this.shakeTarget === 'enemy' ? this.shakeOffset.x : 0;
        const oy = this.shakeTarget === 'enemy' ? this.shakeOffset.y : 0;
        this.cm.renderCreature(ctx, this.enemyCreature.id, 420 + ox, 50 + oy, 96, true);
    }

    /** 渲染我方精灵 */
    _renderPlayerCreature(ctx) {
        if (!this.playerCreature) return;
        const ox = this.shakeTarget === 'player' ? this.shakeOffset.x : 0;
        const oy = this.shakeTarget === 'player' ? this.shakeOffset.y : 0;
        this.cm.renderCreature(ctx, this.playerCreature.id, 80 + ox, 240 + oy, 112);
    }

    /** 渲染敌方信息框 */
    _renderEnemyInfo(ctx) {
        if (!this.enemyCreature) return;
        const c = this.enemyCreature;

        // 信息框背景
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(280, 20, 220, 55);
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 1;
        ctx.strokeRect(280, 20, 220, 55);

        // 名称和等级
        ctx.fillStyle = '#FFF';
        ctx.font = 'bold 13px monospace';
        ctx.fillText(c.name, 290, 40);
        ctx.fillStyle = '#AAA';
        ctx.font = '12px monospace';
        ctx.fillText(`Lv.${c.level}`, 410, 40);

        // 类型标签
        ctx.fillStyle = this.cm.getTypeColor(c.type);
        ctx.font = '11px monospace';
        ctx.fillText(c.type, 290, 54);

        // HP条
        this.ui.renderHPBar(290, 58, 200, 10, c.currentHP, c.maxHP);

        // HP数值
        ctx.fillStyle = '#AAA';
        ctx.font = '10px monospace';
        ctx.fillText(`${c.currentHP}/${c.maxHP}`, 410, 68);
    }

    /** 渲染我方信息框 */
    _renderPlayerInfo(ctx) {
        if (!this.playerCreature) return;
        const c = this.playerCreature;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(10, 280, 240, 60);
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 1;
        ctx.strokeRect(10, 280, 240, 60);

        ctx.fillStyle = '#FFF';
        ctx.font = 'bold 13px monospace';
        ctx.fillText(c.name, 20, 300);
        ctx.fillStyle = '#AAA';
        ctx.font = '12px monospace';
        ctx.fillText(`Lv.${c.level}`, 180, 300);

        ctx.fillStyle = this.cm.getTypeColor(c.type);
        ctx.font = '11px monospace';
        ctx.fillText(c.type, 20, 314);

        this.ui.renderHPBar(20, 320, 220, 12, c.currentHP, c.maxHP);

        ctx.fillStyle = '#AAA';
        ctx.font = '10px monospace';
        ctx.fillText(`${c.currentHP}/${c.maxHP}`, 180, 330);

        // 经验条
        if (c.expToNext > 0) {
            const expRatio = c.exp / c.expToNext;
            ctx.fillStyle = '#333';
            ctx.fillRect(20, 334, 220, 4);
            ctx.fillStyle = '#4169E1';
            ctx.fillRect(20, 334, 220 * expRatio, 4);
        }
    }

    /** 渲染战斗菜单 */
    _renderBattleMenu(ctx) {
        const menuX = 340;
        const menuY = 300;
        const menuW = 280;
        const menuH = 120;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(menuX, menuY, menuW, menuH);
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 1;
        ctx.strokeRect(menuX, menuY, menuW, menuH);

        ctx.font = '14px monospace';
        const items = this.menuItems;
        for (let i = 0; i < items.length; i++) {
            const col = i % 2;
            const row = Math.floor(i / 2);
            const ix = menuX + 15 + col * 130;
            const iy = menuY + 20 + row * 42;

            if (i === this.menuIndex) {
                ctx.fillStyle = 'rgba(255, 215, 0, 0.2)';
                ctx.fillRect(ix - 5, iy - 12, 120, 30);
                ctx.fillStyle = '#FFD700';
                ctx.fillText('▶', ix, iy + 2);
            }

            ctx.fillStyle = i === this.menuIndex ? '#FFF' : '#AAA';
            ctx.fillText(items[i], ix + 16, iy + 2);
        }
    }

    /** 渲染技能选择 */
    _renderSkillSelect(ctx) {
        const boxX = 20;
        const boxY = 380;
        const boxW = this.W - 40;
        const boxH = 65;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        ctx.fillRect(boxX, boxY, boxW, boxH);
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 1;
        ctx.strokeRect(boxX, boxY, boxW, boxH);

        const skills = this.playerCreature.skills;
        for (let i = 0; i < skills.length; i++) {
            const col = i % 2;
            const row = Math.floor(i / 2);
            const sx = boxX + 15 + col * 280;
            const sy = boxY + 15 + row * 25;

            if (i === this.skillIndex) {
                ctx.fillStyle = 'rgba(255, 215, 0, 0.2)';
                ctx.fillRect(sx - 5, sy - 10, 265, 22);
                ctx.fillStyle = '#FFD700';
                ctx.fillText('▶', sx, sy + 2);
            }

            const skill = skills[i];
            ctx.fillStyle = skill.currentPP > 0 ? (i === this.skillIndex ? '#FFF' : '#CCC') : '#666';
            ctx.font = '12px monospace';
            ctx.fillText(`${skill.name}`, sx + 16, sy + 2);

            ctx.fillStyle = this.cm.getTypeColor(skill.type);
            ctx.fillText(skill.type, sx + 90, sy + 2);

            ctx.fillStyle = '#888';
            ctx.fillText(`PP:${skill.currentPP}/${skill.pp}`, sx + 150, sy + 2);
        }

        ctx.fillStyle = '#888';
        ctx.font = '11px monospace';
        ctx.fillText('B返回', boxX + boxW - 60, boxY + boxH - 8);
    }

    /** 渲染战斗日志 */
    _renderBattleLog(ctx) {
        const logX = 10;
        const logY = 220;

        ctx.font = '11px monospace';
        const displayLogs = this.battleLog.slice(-3);
        displayLogs.forEach((log, i) => {
            ctx.fillStyle = 'rgba(0,0,0,0.5)';
            ctx.fillRect(logX, logY + i * 16, ctx.measureText(log).width + 10, 14);
            ctx.fillStyle = '#FFF';
            ctx.fillText(log, logX + 5, logY + i * 16 + 11);
        });
    }

    /** 渲染结果画面 */
    _renderResult(ctx) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, this.W, this.H);

        ctx.textAlign = 'center';
        ctx.font = 'bold 22px monospace';

        switch (this.result) {
            case 'win':
                ctx.fillStyle = '#FFD700';
                ctx.fillText('胜利！', this.W / 2, this.H / 2 - 20);
                break;
            case 'lose':
                ctx.fillStyle = '#F44336';
                ctx.fillText('战斗失败...', this.W / 2, this.H / 2 - 20);
                ctx.font = '14px monospace';
                ctx.fillStyle = '#AAA';
                ctx.fillText('回到最近的城镇...', this.W / 2, this.H / 2 + 15);
                break;
            case 'catch_success':
                ctx.fillStyle = '#4CAF50';
                ctx.fillText('捕获成功！', this.W / 2, this.H / 2 - 20);
                break;
            case 'run':
                ctx.fillStyle = '#AAA';
                ctx.fillText('成功逃跑！', this.W / 2, this.H / 2 - 20);
                break;
        }

        // 继续按钮
        const btnW = 120;
        const btnH = 35;
        const btnX = (this.W - btnW) / 2;
        const btnY = this.H / 2 + 40;

        ctx.fillStyle = 'rgba(255, 215, 0, 0.3)';
        ctx.fillRect(btnX, btnY, btnW, btnH);
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 2;
        ctx.strokeRect(btnX, btnY, btnW, btnH);

        ctx.fillStyle = '#FFD700';
        ctx.font = '14px monospace';
        ctx.fillText('点击继续', this.W / 2, btnY + 23);
        ctx.textAlign = 'left';
    }

    /** 处理输入 */
    handleInput(input, now) {
        if (!this.active) return;

        // 点击模拟确认
        if (input.hasPendingClick()) {
            input.clearClick();
            // result 阶段点击 = 确认
            if (this.phase === 'result') {
                this.endBattle();
                return;
            }
            // 菜单阶段点击 = 确认当前选项
            if (this.phase === 'menu') {
                this.lastActionTime = now;
                switch (this.menuIndex) {
                    case 0: this.selectAttack(); break;
                    case 1: this.selectCatch(); break;
                    case 2: this.selectSwitch(); break;
                    case 3: this.selectRun(); break;
                }
                return;
            }
            // 技能选择阶段点击 = 确认当前技能
            if (this.phase === 'skillSelect') {
                this.lastActionTime = now;
                this.confirmSkill();
                return;
            }
        }

        if (this.phase === 'result') {
            if (input.isConfirmPressed(now)) {
                this.endBattle();
            }
            return;
        }

        if (this.phase === 'menu') {
            if (input.isJustPressed('ArrowUp') || input.isJustPressed('KeyW')) {
                this.menuIndex = this.menuIndex >= 2 ? this.menuIndex - 2 : this.menuIndex;
            }
            if (input.isJustPressed('ArrowDown') || input.isJustPressed('KeyS')) {
                this.menuIndex = this.menuIndex <= 1 ? this.menuIndex + 2 : this.menuIndex;
            }
            if (input.isJustPressed('ArrowLeft') || input.isJustPressed('KeyA')) {
                this.menuIndex = this.menuIndex % 2 === 1 ? this.menuIndex - 1 : this.menuIndex;
            }
            if (input.isJustPressed('ArrowRight') || input.isJustPressed('KeyD')) {
                this.menuIndex = this.menuIndex % 2 === 0 ? this.menuIndex + 1 : this.menuIndex;
            }
            if (input.isConfirmPressed(now)) {
                switch (this.menuIndex) {
                    case 0: this.selectAttack(); break;
                    case 1: this.selectCatch(); break;
                    case 2: this.selectSwitch(); break;
                    case 3: this.selectRun(); break;
                }
            }
        } else if (this.phase === 'skillSelect') {
            if (input.isJustPressed('ArrowUp') || input.isJustPressed('KeyW')) {
                this.skillIndex = this.skillIndex >= 2 ? this.skillIndex - 2 : this.skillIndex;
            }
            if (input.isJustPressed('ArrowDown') || input.isJustPressed('KeyS')) {
                this.skillIndex = this.skillIndex <= 1 ? this.skillIndex + 2 : this.skillIndex;
            }
            if (input.isJustPressed('ArrowLeft') || input.isJustPressed('KeyA')) {
                this.skillIndex = this.skillIndex % 2 === 1 ? this.skillIndex - 1 : this.skillIndex;
            }
            if (input.isJustPressed('ArrowRight') || input.isJustPressed('KeyD')) {
                this.skillIndex = this.skillIndex % 2 === 0 ? this.skillIndex + 1 : this.skillIndex;
            }
            if (input.isConfirmPressed(now)) {
                this.confirmSkill();
            }
            if (input.isCancelPressed()) {
                this.phase = 'menu';
            }
        }
    }

    /** 结束战斗 */
    endBattle() {
        this.active = false;
        this.phase = 'idle';
        if (this.resultCallback) {
            this.resultCallback(this.result);
            this.resultCallback = null;
        }
    }
}

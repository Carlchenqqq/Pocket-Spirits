/**
 * BattleManager - 战斗协调器（薄层）
 * 只负责：
 * 1. 协调 Engine（逻辑）→ 动画时序 → 回调链
 * 2. 管理动画状态（timer, shake, flash）
 * 3. 调用 Renderer 渲染
 * 4. 调用 InputHandler 处理输入
 *
 * 逻辑全在 BattleEngine
 * 渲染全在 BattleRenderer
 * 输入检测全在 BattleInputHandler
 */
class BattleManager {
    constructor(ctx, canvas, creaturesManager, uiManager) {
        this.ctx = ctx;
        this.canvas = canvas;
        this.W = canvas.width;
        this.H = canvas.height;
        this.cm = creaturesManager;
        this.ui = uiManager;

        // ─── 引擎层实例 ───
        this.engine = new BattleEngine(window.eventBus);
        this.renderer = new BattleRenderer(ctx, canvas);

        // ─── 协调器自身状态（纯 UI 时序状态） ───
        this.active = false;

        // 菜单选择索引（UI状态）
        this.menuIndex = 0;
        this.skillIndex = 0;

        // 动画系统（时序控制）
        this.animTimer = 0;
        this.animDuration = 0;
        this.animCallback = null;
        this.shakeOffset = { x: 0, y: 0 };
        this.shakeTarget = null; // 'player' | 'enemy' | null

        // 结果回调
        this.resultCallback = null;
        this.caughtCreatureId = 0;
    }

    // ════════════════════════════════════
    //   公开 API — 启动战斗
    // ════════════════════════════════════

    /** 开始野生精灵战斗 */
    startWildBattle(creature) {
        this.active = true;
        this._resetAnim();
        const playerCreature = this.cm.getFirstAlive();

        // 委托给 Engine 初始化
        this.engine.initWildBattle(playerCreature, creature);
        this.shakeTarget = null;
    }

    /** 开始训练师战斗 */
    startTrainerBattle(trainerNPC, trainerParty) {
        this.active = true;
        this._resetAnim();
        const playerCreature = this.cm.getFirstAlive();
        const enemyCreature = trainerParty.find(c => c.currentHP > 0);

        this.engine.initTrainerBattle(playerCreature, enemyCreature, trainerNPC, trainerParty);
        this.shakeTarget = null;
        this.trainerParty = trainerParty;
    }

    // ════════════════════════════════════
    //   公开 API — 玩家动作
    // ════════════════════════════════════

    selectAttack() {
        this.engine.setPhase('skillSelect');
        this.skillIndex = 0;
    }

    confirmSkill() {
        const skill = this.engine.state.playerCreature.skills[this.skillIndex];
        if (!skill || skill.currentPP <= 0) return;
        this._executeTurn(skill);
    }

    selectCatch() {
        const state = this.engine.state;
        if (state.battleType !== 'wild') {
            this.engine.addLog('训练师战斗中无法捕捉！');
            return;
        }

        // 查找精灵球
        let ballId = 1;
        if (this.cm.getItemCount(2) > 0) ballId = 2;
        if (this.cm.getItemCount(ballId) === 0) {
            this.engine.addLog('没有精灵球了！');
            return;
        }

        this.cm.useItem(ballId);
        const ballData = this.cm.getItemData(ballId);
        this.engine.addLog(`使用了${ballData.name}！`);

        this.engine.setPhase('animating');
        this.animDuration = 1500;
        this.animTimer = 0;
        this.animCallback = () => {
            if (this.engine.tryCatch(1, ballData)) {
                this.caughtCreatureId = state.enemyCreature.id;
                this.engine.addLog(`成功捕获了${state.enemyCreature.name}！`);
                this.engine.setResult('catch_success');
                this.cm.addToParty(state.enemyCreature);
                this.engine.setPhase('result');
            } else {
                this.engine.addLog(`${state.enemyCreature.name}挣脱了！`);
                this._enemyTurn();
            }
        };
    }

    selectSwitch() {
        const aliveCreatures = this.cm.party.filter(c => c.currentHP > 0 && c !== this.engine.state.playerCreature);
        if (aliveCreatures.length === 0) {
            this.engine.addLog('没有可以切换的精灵！');
            return;
        }

        this.ui.showCreatureSelect(aliveCreatures, (index) => {
            if (index >= 0) {
                this.ui.closeCreatureSelect();
                const newCreature = aliveCreatures[index];
                this.engine.state.playerCreature = newCreature;
                newCreature.statModifiers = { attack: 0, defense: 0, speed: 0 };
                this.engine.addLog(`上吧，${newCreature.name}！`);
                this._enemyTurn();
            } else {
                this.ui.closeCreatureSelect();
                this.engine.setPhase('menu');
            }
        });

        this.engine.setPhase('animating');
        this.animDuration = Infinity;
        this.animTimer = 0;
        this.animCallback = null;
    }

    selectRun() {
        const state = this.engine.state;
        if (state.battleType !== 'wild') {
            this.ui.showMessage('训练师战斗中无法逃跑！');
            this.engine.addLog('训练师战斗中无法逃跑！');
            return;
        }

        if (this.engine.tryRun()) {
            this.engine.addLog('成功逃跑了！');
            this.engine.setResult('run');
            this.engine.setPhase('result');
        } else {
            this.engine.addLog('逃跑失败！');
            this._enemyTurn();
        }
    }

    // ════════════════════════════════════
    //   内部 — 回合执行
    // ════════════════════════════════════

    _executeTurn(playerSkill) {
        this.engine.setPhase('animating');

        const playerFirst = this.engine.determineTurnOrder();

        if (playerFirst) {
            this._playerAttack(playerSkill, () => {
                if (this.engine.getResult()) return;
                this._enemyAttack(() => { this._checkBattleEnd(); });
            });
        } else {
            this._enemyAttack(() => {
                if (this.engine.getResult()) return;
                this._playerAttack(playerSkill, () => { this._checkBattleEnd(); });
            });
        }
    }

    _playerAttack(skill, callback) {
        const state = this.engine.state;
        const player = state.playerCreature;
        const enemy = state.enemyCreature;

        skill.currentPP--;
        this.engine.addLog(`${player.name}使用了${skill.name}！`);

        // 技能效果
        const effectMsg = this.engine.applySkillEffect(skill, player, enemy);
        if (effectMsg) {
            this.engine.addLog(effectMsg);
            this._startAnim(800, callback);
            return;
        }

        // V1: 伤害计算现在返回对象 {damage, isCritical, isMissed, typeEffectText}
        const dmgInfo = this.engine.calcDamage(player, skill, enemy);

        // 未命中处理
        if (dmgInfo.isMissed) {
            this.engine.addLog(`但是没有命中！`);
            this._startAnim(800, () => {
                this.shakeTarget = null;
                this._enemyTurn(); // 未命中敌人仍然反击
            });
            return;
        }

        this.engine.applyDamage(enemy, dmgInfo.damage);

        // 暴击提示（V1新增）
        if (dmgInfo.isCritical) {
            this.engine.addLog('【暴击】');
        }

        // 属性克制提示（V1：使用 engine 内部计算的文本）
        if (dmgInfo.typeEffectText) {
            this.engine.addLog(dmgInfo.typeEffectText);
        }

        // 吸血恢复
        if (skill.name === '吸血' && dmgInfo.damage > 0) {
            const healAmount = Math.floor(dmgInfo.damage / 2);
            player.currentHP = Math.min(player.maxHP, player.currentHP + healAmount);
            this.engine.addLog(`${player.name}恢复了${healAmount}HP！`);
        }

        this.engine.addLog(`造成了${dmgInfo.damage}点伤害！`);

        this.shakeTarget = 'enemy';
        this._startAnim(600, () => {
            this.shakeTarget = null;
            if (enemy.currentHP <= 0) {
                this.engine.addLog(`${enemy.name}倒下了！`);
                this._handleEnemyFainted(callback);
            } else {
                callback();
            }
        });
    }

    _enemyAttack(callback) {
        const state = this.engine.state;
        const enemy = state.enemyCreature;
        const player = state.playerCreature;

        const skill = this.engine.aiSelectSkill(enemy, player.type);
        if (!skill) { callback(); return; }

        skill.currentPP--;
        this.engine.addLog(`${enemy.name}使用了${skill.name}！`);

        const effectMsg = this.engine.applySkillEffect(skill, enemy, player);
        if (effectMsg) {
            this.engine.addLog(effectMsg);
            this._startAnim(800, callback);
            return;
        }

        // V1: 敌人攻击也使用新的对象返回格式
        const dmgInfo = this.engine.calcDamage(enemy, skill, player);

        // 敌人未命中
        if (dmgInfo.isMissed) {
            this.engine.addLog(`${skill.name}没有命中！`);
            this._startAnim(800, () => {
                callback();
            });
            return;
        }

        this.engine.applyDamage(player, dmgInfo.damage);

        // 属性克制提示
        if (dmgInfo.typeEffectText) {
            this.engine.addLog(dmgInfo.typeEffectText);
        }

        // 吸血恢复
        if (skill.name === '吸血' && dmgInfo.damage > 0) {
            const healAmount = Math.floor(dmgInfo.damage / 2);
            enemy.currentHP = Math.min(enemy.maxHP, enemy.currentHP + healAmount);
        }

        this.engine.addLog(`造成了${dmgInfo.damage}点伤害！`);

        this.shakeTarget = 'player';
        this._startAnim(600, () => {
            this.shakeTarget = null;
            if (player.currentHP <= 0) {
                this.engine.addLog(`${player.name}倒下了！`);
                this._handlePlayerFainted(callback);
            } else {
                callback();
            }
        });
    }

    _enemyTurn() {
        this._enemyAttack(() => { this._checkBattleEnd(); });
    }

    // ─── 倒下处理 ───

    _handleEnemyFainted(callback) {
        const state = this.engine.state;
        const rewards = this.engine.calcWinRewards();
        const leveledUp = this.cm.addExp(state.playerCreature, rewards.expGain);
        this.cm.gold += rewards.goldGain;

        this.engine.addLog(`获得${rewards.expGain}经验值和${rewards.goldGain}金币！`);
        if (leveledUp) {
            this.engine.addLog(`${state.playerCreature.name}升到了${state.playerCreature.level}级！`);
        }

        // 训练师后备精灵
        if (state.battleType === 'trainer') {
            const nextCreature = (this.trainerParty || []).find(c => c.currentHP > 0);
            if (nextCreature) {
                this.engine.addLog(`训练师派出了${nextCreature.name}！`);
                this._startAnim(1000, () => {
                    state.enemyCreature = nextCreature;
                    nextCreature.statModifiers = { attack: 0, defense: 0, speed: 0 };
                    this.engine.setPhase('menu');
                });
                return;
            }

            if (state.trainerNPC) {
                this.cm.gold += (state.trainerNPC.reward || 0);
                this.engine.addLog(`战胜了训练师${state.trainerNPC.name}！获得${state.trainerNPC.reward}金币！`);
            }
        }

        this.engine.setResult('win');
        this.engine.setPhase('result');
        if (callback) callback();
    }

    _handlePlayerFainted(callback) {
        const state = this.engine.state;
        const nextAlive = this.cm.party.find(c => c.currentHP > 0 && c !== state.playerCreature);

        if (nextAlive) {
            this.engine.addLog(`上吧，${nextAlive.name}！`);
            this._startAnim(1000, () => {
                state.playerCreature = nextAlive;
                nextAlive.statModifiers = { attack: 0, defense: 0, speed: 0 };
                this.engine.setPhase('menu');
            });
        } else {
            this.engine.setResult('lose');
            this.engine.setPhase('result');
            if (callback) callback();
        }
    }

    _checkBattleEnd() {
        if (this.engine.getResult()) return;
        const result = this.engine.checkBattleEnd();
        if (result) {
            this.engine.setPhase(result === 'win' || result === 'lose' ? 'result' : 'menu');
        } else {
            this.engine.setPhase('menu');
        }
    }

    // ════════════════════════════════════
    //   动画系统
    // ════════════════════════════════════

    _resetAnim() {
        this.animTimer = 0;
        this.animDuration = 0;
        this.animCallback = null;
        this.shakeOffset = { x: 0, y: 0 };
        this.shakeTarget = null;
        this.menuIndex = 0;
        this.skillIndex = 0;
    }

    _startAnim(duration, callback) {
        this.animDuration = duration;
        this.animTimer = 0;
        this.animCallback = callback;
    }

    update(deltaTime) {
        if (!this.active) return;

        if (this.engine.getPhase() === 'animating') {
            this.animTimer += deltaTime;

            // 抖动
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

    // ════════════════════════════════════
    //   渲染（委托给 BattleRenderer）
    // ════════════════════════════════════

    render() {
        if (!this.active) return;
        // 给 engine state 补充 UI 索引（渲染菜单高亮用）
        const s = this.engine.getState();
        if (s) {
            s.menuIndex = this.menuIndex;
            s.skillIndex = this.skillIndex;
            // 渲染用：附加抖动状态到渲染参数（不污染引擎逻辑）
            s._shakeOffset = this.shakeOffset;
            s._shakeTarget = this.shakeTarget;
        }
        this.renderer.render(s, this.ui, this.cm);
    }

    // ════════════════════════════════════
    //   输入处理（委托给 BattleInputHandler）
    // ════════════════════════════════════

    handleInput(input, now) {
        if (!this.active) return;

        const phase = this.engine.getPhase();
        const action = BattleInputHandler.handleMenuInput(
            input, phase,
            this.menuIndex, this.skillIndex, now
        );

        this._dispatchAction(action, now);
    }

    /** 将 InputHandler 返回的语义化动作分发到具体方法 */
    _dispatchAction(action, now) {
        if (!action) return;

        // 返回的是对象类型（移动光标等）
        if (typeof action === 'object') {
            switch (action.type) {
                case 'move_menu':
                    this.menuIndex = action.index;
                    this.lastActionTime = now;
                    break;
                case 'move_skill':
                    this.skillIndex = action.index;
                    this.lastActionTime = now;
                    break;
                case 'select_skill':
                    this.skillIndex = action.index;
                    this.lastActionTime = now;
                    this.confirmSkill();
                    break;
            }
            return;
        }

        // 返回的是字符串动作
        switch (action) {
            case 'attack':
                this.lastActionTime = now;
                this.selectAttack();
                break;
            case 'catch':
                this.lastActionTime = now;
                this.selectCatch();
                break;
            case 'switch':
                this.lastActionTime = now;
                this.selectSwitch();
                break;
            case 'run':
                this.lastActionTime = now;
                this.selectRun();
                break;
            case 'confirm_skill':
                this.confirmSkill();
                break;
            case 'back':
                this.engine.setPhase('menu');
                break;
            case 'confirm_result':
                this.endBattle();
                break;
        }
    }

    // ════════════════════════════════════
    //   结束
    // ════════════════════════════════════

    endBattle() {
        this.active = false;
        this.engine.endBattle();
        if (this.resultCallback) {
            const cb = this.resultCallback;
            this.resultCallback = null;
            cb(this.engine.getResult?.() || null); // 兼容：engine 已清空时取不到
        }
    }
}

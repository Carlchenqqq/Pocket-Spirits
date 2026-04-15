/**
 * NPC - NPC管理和对话系统
 * 处理NPC交互、对话触发、训练师对战
 */
class NPCManager {
    constructor() {
        this.npcs = [];
    }

    /** 加载当前地图的NPC */
    loadNPCs(npcData) {
        // 深拷贝NPC数据，避免修改原始地图数据
        this.npcs = npcData ? npcData.map(n => ({
            ...n,
            creatures: n.creatures ? n.creatures.map(c => ({ ...c })) : undefined,
            dialogs: n.dialogs ? [...n.dialogs] : undefined
        })) : [];
    }

    /** 获取所有NPC */
    getNPCs() {
        return this.npcs;
    }

    /** 检查指定位置是否有NPC */
    getNPCAt(tileX, tileY) {
        return this.npcs.find(n => n.x === tileX && n.y === tileY) || null;
    }

    /** 检查玩家面前是否有NPC */
    checkFacingNPC(facingTile) {
        return this.getNPCAt(facingTile.x, facingTile.y);
    }

    /** 交互NPC */
    interactNPC(npc, gameManager) {
        if (!npc) return;

        switch (npc.type) {
            case 'professor':
                this._handleProfessor(npc, gameManager);
                break;
            case 'dialog':
                this._handleDialog(npc, gameManager);
                break;
            case 'trainer':
                this._handleTrainer(npc, gameManager);
                break;
            case 'shop':
                this._handleShop(npc, gameManager);
                break;
            case 'healer':
                this._handleHealer(npc, gameManager);
                break;
            default:
                this._handleDialog(npc, gameManager);
        }
    }

    /** 处理精灵博士交互 */
    _handleProfessor(npc, gameManager) {
        gameManager.creaturesManager.recordNPCEncounter(npc.id, npc.name, npc.type);
        const cm = gameManager.creaturesManager;
        if (!cm.starterChosen) {
            // 显示初始精灵选择
            gameManager.ui.showStarterSelect(
                cm.getStarters(),
                cm,
                (index) => {
                    const starters = cm.getStarters();
                    if (index >= 0 && index < starters.length) {
                        const creature = cm.chooseStarter(starters[index].id);
                        if (creature) {
                            gameManager.ui.closeStarterSelect();
                            gameManager.ui.showDialog([
                                `你选择了${creature.name}！`,
                                '它将成为你的伙伴！',
                                '带上精灵球和伤药，出发冒险吧！',
                                '南边的草丛里有很多野生精灵。'
                            ]);
                            gameManager.setState('DIALOG');
                        }
                    }
                }
            );
            // 设置游戏状态为菜单（阻止移动）
            gameManager.setState('MENU');
        } else {
            gameManager.ui.showDialog([
                '好好照顾你的精灵伙伴！',
                '草丛里可以遇到各种精灵。'
            ]);
            gameManager.setState('DIALOG');
        }
    }

    /** 处理普通对话NPC */
    _handleDialog(npc, gameManager) {
        gameManager.creaturesManager.recordNPCEncounter(npc.id, npc.name, npc.type);
        gameManager.ui.showDialog(npc.dialogs || ['...']);
        gameManager.setState('DIALOG');
    }

    /** 处理训练师NPC */
    _handleTrainer(npc, gameManager) {
        if (npc.defeated) {
            gameManager.ui.showDialog(['我已经输了...再来挑战吧！']);
            gameManager.setState('DIALOG');
            return;
        }

        // 没有精灵不能战斗
        if (gameManager.creaturesManager.party.length === 0) {
            gameManager.ui.showDialog(['你还没有精灵，无法对战！', '请先去找精灵博士选择初始精灵。']);
            gameManager.setState('DIALOG');
            return;
        }

        gameManager.ui.showDialog(npc.dialogs, () => {
            const dialogScene = gameManager.sceneManager.scenes.get('dialog');
            if (dialogScene) dialogScene.markScenePushed();
            // 创建训练师的精灵队伍
            const trainerParty = (npc.creatures || []).map(c =>
                gameManager.creaturesManager.createCreature(c.creatureId, c.level)
            );

            if (trainerParty.length > 0) {
                gameManager.startTrainerBattle(npc, trainerParty);
            }
        });
        gameManager.setState('DIALOG');
    }

    /** 处理商店NPC */
    _handleShop(npc, gameManager) {
        gameManager.creaturesManager.recordNPCEncounter(npc.id, npc.name, npc.type);
        gameManager.ui.showDialog(npc.dialogs, () => {
            const dialogScene = gameManager.sceneManager.scenes.get('dialog');
            if (dialogScene) dialogScene.markScenePushed();
            gameManager.openShop();
        });
        gameManager.setState('DIALOG');
    }

    /** 处理治疗NPC */
    _handleHealer(npc, gameManager) {
        gameManager.creaturesManager.recordNPCEncounter(npc.id, npc.name, npc.type);
        gameManager.creaturesManager.healParty();
        const cm = gameManager.creaturesManager;
        const healedCount = cm.party.filter(c => c.currentHP === c.maxHP).length;
        gameManager.ui.showDialog([
            ...npc.dialogs,
            `已为${healedCount}只精灵恢复了体力！`
        ]);
        gameManager.setState('DIALOG');
    }

    /** 更新NPC（自动移动等） */
    update(deltaTime) {
        for (const npc of this.npcs) {
            if (!npc.movePattern || npc.movePattern === 'static') continue;
            
            npc._moveTimer = (npc._moveTimer || 0) + deltaTime;
            const moveInterval = npc.moveInterval || 2000;
            
            if (npc._moveTimer >= moveInterval) {
                npc._moveTimer = 0;
                // 简单的随机移动
                const dirs = ['up', 'down', 'left', 'right'];
                npc.direction = dirs[Math.floor(Math.random() * dirs.length)];
            }
        }
    }

    /** 标记训练师为已击败 */
    markTrainerDefeated(npcId) {
        const npc = this.npcs.find(n => n.id === npcId);
        if (npc) npc.defeated = true;
    }
}

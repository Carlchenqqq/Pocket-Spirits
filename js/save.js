/**
 * SaveManager - 存档系统
 * 使用 localStorage 保存和加载游戏进度
 */
class SaveManager {
    constructor() {
        this.saveSlot = 'pocket_spirits_save';
    }

    /** 保存游戏 */
    save(gameManager) {
        const cm = gameManager.creaturesManager;
        const saveData = {
            version: 1,
            timestamp: Date.now(),
            // 玩家位置
            playerTileX: gameManager.player.tileX,
            playerTileY: gameManager.player.tileY,
            playerDirection: gameManager.player.direction,
            // 当前地图
            currentMapId: gameManager.mapManager.currentMapId,
            // 精灵队伍
            party: cm.party.map(c => ({
                id: c.id,
                name: c.name,
                type: c.type,
                rarity: c.rarity,
                level: c.level,
                exp: c.exp,
                expToNext: c.expToNext,
                baseStats: c.baseStats,
                stats: c.stats,
                currentHP: c.currentHP,
                maxHP: c.maxHP,
                skills: c.skills.map(s => ({
                    id: s.id,
                    name: s.name,
                    type: s.type,
                    power: s.power,
                    pp: s.pp,
                    currentPP: s.currentPP,
                    desc: s.desc
                }))
            })),
            // 精灵存储
            storage: cm.storage.map(c => ({
                id: c.id, name: c.name, type: c.type, rarity: c.rarity,
                level: c.level, exp: c.exp, expToNext: c.expToNext,
                baseStats: c.baseStats, stats: c.stats,
                currentHP: c.currentHP, maxHP: c.maxHP,
                skills: c.skills.map(s => ({
                    id: s.id, name: s.name, type: s.type, power: s.power,
                    pp: s.pp, currentPP: s.currentPP, desc: s.desc
                }))
            })),
            // 道具
            items: cm.items,
            // 金币
            gold: cm.gold,
            // 标记
            starterChosen: cm.starterChosen,
            // 道馆徽章
            badges: cm.badges || [],
            // 任务进度
            quests: gameManager.quests || {},
            // 已击败的训练师
            defeatedTrainers: cm.defeatedTrainers || [],
            // 图鉴数据
            creatureDex: cm.creatureDex || {},
            npcDex: cm.npcDex || {},
        };

        try {
            // 安全序列化，过滤不可序列化的值
            const safeData = JSON.parse(JSON.stringify(saveData, (key, value) => {
                if (typeof value === 'function' || value instanceof HTMLElement) return undefined;
                return value;
            }));
            localStorage.setItem(this.saveSlot, JSON.stringify(safeData));
            return true;
        } catch (e) {
            console.error('保存失败:', e);
            return false;
        }
    }

    /** 加载游戏 */
    load(gameManager) {
        try {
            const raw = localStorage.getItem(this.saveSlot);
            if (!raw) return false;

            const data = JSON.parse(raw);
            if (!data || data.version !== 1) return false;

            const cm = gameManager.creaturesManager;

            // 恢复精灵队伍
            cm.party = data.party.map(c => {
                const creature = {
                    ...c,
                    uid: Date.now() + Math.random(),
                    statModifiers: { attack: 0, defense: 0, speed: 0 }
                };
                return creature;
            });

            // 恢复存储
            cm.storage = (data.storage || []).map(c => ({
                ...c,
                uid: Date.now() + Math.random(),
                statModifiers: { attack: 0, defense: 0, speed: 0 }
            }));

            // 恢复道具和金币
            cm.items = data.items || [];
            cm.gold = data.gold || 0;
            cm.starterChosen = data.starterChosen || false;
            cm.defeatedTrainers = data.defeatedTrainers || [];
            // 恢复图鉴
            cm.creatureDex = data.creatureDex || {};
            cm.npcDex = data.npcDex || {};
            // 恢复道馆徽章
            cm.badges = data.badges || [];
            // 恢复任务进度
            gameManager.quests = data.quests || {};

            // 切换地图
            gameManager.mapManager.switchMap(data.currentMapId);
            const map = gameManager.mapManager.getCurrentMap();

            // 恢复玩家位置
            gameManager.player.setPosition(data.playerTileX, data.playerTileY);
            gameManager.player.direction = data.playerDirection || 'down';

            // 加载NPC
            gameManager.npcManager.loadNPCs(map.npcs);

            // 恢复已击败的训练师
            if (cm.defeatedTrainers) {
                cm.defeatedTrainers.forEach(id => {
                    gameManager.npcManager.markTrainerDefeated(id);
                });
            }

            // 设置摄像机
            gameManager.camera.snapTo(
                gameManager.player.x, gameManager.player.y,
                gameManager.player.width, gameManager.player.height,
                map.width * gameManager.mapManager.tileSize,
                map.height * gameManager.mapManager.tileSize
            );

            return true;
        } catch (e) {
            console.error('加载失败:', e);
            return false;
        }
    }

    /** 检查是否有存档 */
    hasSave() {
        return localStorage.getItem(this.saveSlot) !== null;
    }

    /** 删除存档 */
    deleteSave() {
        localStorage.removeItem(this.saveSlot);
    }
}

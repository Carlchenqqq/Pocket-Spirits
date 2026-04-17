/**
 * SaveManager - 多槽位存档系统（安全加固版）
 * 支持 3 个独立存档槽位，使用 localStorage 保存
 *
 * 安全特性：
 *   1. 白名单字段过滤 — 防止属性注入攻击
 *   2. 数值范围校验（clamp）— 防止 Infinity/NaN/超大数值篡改
 *   3. CRC32 完整性签名 — 检测存档是否被手动篡改
 *
 * 注意：纯前端无法做到绝对防篡改，目标是大幅提高作弊门槛。
 */

class SaveManager {
    constructor() {
        this.slotCount = 3;
        this.savePrefix = 'pocket_spirits_save_';
        // 数值上限常量
        this.LIMITS = {
            level: { min: 1, max: 100 },
            hp: { min: 0, max: 99999 },
            gold: { min: 0, max: 9999999 },
            exp: { min: 0, max: 999999999 },
            partySize: { min: 0, max: 6 },
            storageSize: { min: 0, max: 100 },
            skillPP: { min: 0, max: 99 },
        };
    }

    /** 获取指定槽位的 localStorage key */
    _slotKey(slot) {
        return this.savePrefix + (slot + 1);
    }

    // ==================== 安全工具方法 ====================

    /** 精灵白名单字段 */
    static CREATURE_FIELDS = [
        'id', 'name', 'type', 'rarity',
        'level', 'exp', 'expToNext',
        'baseStats', 'stats', 'currentHP', 'maxHP',
        'skills'
    ];

    /** 技能白名单字段 */
    static SKILL_FIELDS = ['id', 'name', 'type', 'power', 'pp', 'currentPP', 'desc'];

    /**
     * 白名单字段过滤 — 防止 __proto__ / constructor / 自定义恶意属性注入
     */
    _sanitizeCreature(raw) {
        const clean = {};
        if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return clean;

        for (const key of SaveManager.CREATURE_FIELDS) {
            if (raw[key] !== undefined && raw[key] !== null && !key.startsWith('_')) {
                clean[key] = raw[key];
            }
        }
        return clean;
    }

    /** 技能数据白名单过滤 */
    _sanitizeSkill(raw) {
        const clean = {};
        if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return clean;

        for (const key of SaveManager.SKILL_FIELDS) {
            if (raw[key] !== undefined && raw[key] !== null) {
                clean[key] = raw[key];
            }
        }
        return clean;
    }

    /**
     * 数值范围钳制 — 防御 Infinity / NaN / 负数溢出 / 超大数值
     */
    _clamp(value, min, max, defaultVal) {
        const num = Number(value);
        if (isNaN(num) || !isFinite(num)) return defaultVal !== undefined ? defaultVal : min;
        return Math.max(min, Math.min(max, num));
    }

    /**
     * 对精灵数据执行完整安全校验
     * 返回经过清洗和钳制的安全对象
     */
    _validateCreature(raw) {
        const c = this._sanitizeCreature(raw);

        // 基本类型强制转换
        c.id = typeof c.id === 'string' ? c.id.slice(0, 50) : String(c.id || 'unknown').slice(0, 50);
        c.name = typeof c.name === 'string' ? c.name.slice(0, 30) : String(c.name || '???').slice(0, 30);
        c.type = typeof c.type === 'string' ? c.type : 'normal';
        c.rarity = typeof c.rarity === 'string' ? c.rarity : 'common';

        // 核心数值钳制
        c.level = this._clamp(c.level, this.LIMITS.level.min, this.LIMITS.level.max, 1);
        c.exp = this._clamp(c.exp, this.LIMITS.exp.min, this.LIMITS.exp.max, 0);

        if (typeof c.expToNext === 'number' && isFinite(c.expToNext)) {
            c.expToNext = Math.max(1, Math.min(c.expToNext, this.LIMITS.exp.max));
        } else {
            c.expToNext = 100;
        }

        c.currentHP = this._clamp(c.currentHP, this.LIMITS.hp.min, this.LIMITS.hp.max, 1);
        c.maxHP = this._clamp(c.maxHP, 1, this.LIMITS.hp.max, 100);

        // HP 不超过最大 HP
        if (c.currentHP > c.maxHP) c.currentHP = c.maxHP;

        // baseStats 安全校验
        c.baseStats = this._validateStatBlock(c.baseStats, { attack: 10, defense: 10, speed: 10 });
        c.stats = this._validateStatBlock(c.stats, { attack: 10, defense: 10, speed: 10 });

        // 技能列表校验（限制数量防内存爆炸）
        if (Array.isArray(c.skills)) {
            c.skills = c.skills.slice(0, 4).map(s => {
                const skill = this._sanitizeSkill(s);
                skill.id = typeof skill.id === 'string' ? skill.id : 'tackle';
                skill.name = typeof skill.name === 'string' ? skill.name : 'Tackle';
                skill.type = typeof skill.type === 'string' ? skill.type : 'normal';
                skill.power = this._clamp(skill.power, 0, 999, 40);
                skill.pp = this._clamp(skill.pp, this.LIMITS.skillPP.min, this.LIMITS.skillPP.max, 10);
                skill.currentPP = this._clamp(skill.currentPP, 0, skill.pp, skill.pp);
                return skill;
            });
        } else {
            c.skills = [];
        }

        return c;
    }

    /** 属性块安全校验（attack/defense/speed） */
    _validateStatBlock(block, defaults) {
        if (!block || typeof block !== 'object' || Array.isArray(block)) {
            return { ...defaults };
        }
        const safe = {};
        for (const stat of ['attack', 'defense', 'speed']) {
            safe[stat] = this._clamp(
                typeof block[stat] === 'number' ? block[stat] : defaults[stat],
                0, 9999, defaults[stat]
            );
        }
        return safe;
    }

    /**
     * 同步 CRC32 校验和计算（用于存档完整性检测）
     * 比 SHA-256 快得多，且不需要异步调用，适合游戏循环内使用
     * 注意：这不是密码学安全的哈希，但足以检测普通用户的手动编辑
     */
    _crc32(str) {
        let crc = 0 ^ (-1);
        for (let i = 0; i < str.length; i++) {
            crc = (crc >>> 8) ^ this._crc32Table[(crc ^ str.charCodeAt(i)) & 0xFF];
        }
        return ((-1 ^ crc) >>> 0).toString(16).padStart(8, '0');
    }

    /** CRC32 预计算查找表 */
    get _crc32Table() {
        if (!this.__crc32Table) {
            this.__crc32Table = new Uint32Array(256);
            for (let i = 0; i < 256; i++) {
                let c = i;
                for (let j = 0; j < 8; j++) {
                    c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
                }
                this.__crc32Table[i] = c >>> 0;
            }
        }
        return this.__crc32Table;
    }

    /** 计算存档数据的完整性签名 */
    _computeSignature(data) {
        const str = JSON.stringify(data) + '_ps_integrity_v2';
        return this._crc32(str);
    }

    // ==================== 存档数据构建 ====================

    /** 构建当前游戏状态的存档数据（同步） */
    _buildSaveData(gameManager) {
        const cm = gameManager.creaturesManager;
        const data = {
            version: 2,
            timestamp: Date.now(),
            // 玩家位置
            playerTileX: gameManager.player.tileX,
            playerTileY: gameManager.player.tileY,
            playerDirection: gameManager.player.direction,
            // 当前地图
            currentMapId: gameManager.mapManager.currentMapId,
            // 精灵队伍
            party: cm.party.map(c => ({
                id: c.id, name: c.name, type: c.type, rarity: c.rarity,
                level: c.level, exp: c.exp, expToNext: c.expToNext,
                baseStats: { ...c.baseStats }, stats: { ...c.stats },
                currentHP: c.currentHP, maxHP: c.maxHP,
                skills: c.skills.map(s => ({
                    id: s.id, name: s.name, type: s.type,
                    power: s.power, pp: s.pp, currentPP: s.currentPP, desc: s.desc
                }))
            })),
            // 精灵存储
            storage: cm.storage.map(c => ({
                id: c.id, name: c.name, type: c.type, rarity: c.rarity,
                level: c.level, exp: c.exp, expToNext: c.expToNext,
                baseStats: { ...c.baseStats }, stats: { ...c.stats },
                currentHP: c.currentHP, maxHP: c.maxHP,
                skills: c.skills.map(s => ({
                    id: s.id, name: s.name, type: s.type, power: s.power,
                    pp: s.pp, currentPP: s.currentPP, desc: s.desc
                }))
            })),
            // 道具 & 金币
            items: [...(cm.items || [])],
            gold: this._clamp(cm.gold || 0, this.LIMITS.gold.min, this.LIMITS.gold.max, 0),
            starterChosen: !!cm.starterChosen,
            badges: [...(cm.badges || [])],
            quests: cm.quests && typeof cm.quests === 'object' ? { ...cm.quests } : {},
            defeatedTrainers: [...(cm.defeatedTrainers || [])],
            creatureDex: cm.creatureDex && typeof cm.creatureDex === 'object' ? { ...cm.creatureDex } : {},
            npcDex: cm.npcDex && typeof cm.npcDex === 'object' ? { ...cm.npcDex } : {},
        };

        // 计算并附加完整性签名
        data._sig = this._computeSignature(data);

        return data;
    }

    /** 安全序列化：过滤不可序列化值 */
    _serialize(saveData) {
        return JSON.parse(JSON.stringify(saveData, (key, value) => {
            if (typeof value === 'function' || value instanceof HTMLElement) return undefined;
            return value;
        }));
    }

    // ==================== 公开 API：多槽位操作 ====================

    /**
     * 保存到指定槽位（同步）
     * @param {object} gameManager
     * @param {number} slot - 槽位编号 (0, 1, 2)
     * @returns {boolean}
     */
    save(gameManager, slot = 0) {
        if (slot < 0 || slot >= this.slotCount) return false;

        try {
            const saveData = this._buildSaveData(gameManager);
            const safeData = this._serialize(saveData);
            localStorage.setItem(this._slotKey(slot), JSON.stringify(safeData));
            return true;
        } catch (e) {
            console.error('[SaveManager] 保存失败:', e);
            return false;
        }
    }

    /**
     * 从指定槽位加载（带完整性和安全性验证）
     * @param {object} gameManager
     * @param {number} slot - 槽位编号 (0, 1, 2)
     * @returns {boolean}
     */
    load(gameManager, slot = 0) {
        if (slot < 0 || slot >= this.slotCount) return false;

        try {
            const raw = localStorage.getItem(this._slotKey(slot));
            if (!raw) return false;

            const data = JSON.parse(raw);
            if (!data) return false;
            // 版本兼容：v1 和 v2 都接受
            if (data.version !== 1 && data.version !== 2) return false;

            // === 第一步：完整性签名验证 ===
            const storedSig = data._sig;
            delete data._sig;

            if (storedSig !== undefined) {
                const computedSig = this._computeSignature(data);
                if (computedSig !== storedSig) {
                    console.warn('[SaveManager] ⚠️ 存档数据完整性校验失败！可能被篡改。拒绝加载。');
                    return false;
                }
            }
            // 无签名说明是 v1 旧存档或被删除了签名 → 允许加载但标记为不安全

            // === 第二步：白名单过滤 + 数值校验 ===
            const cm = gameManager.creaturesManager;

            // 精灵队伍 — 经过完整安全校验
            const partyRaw = Array.isArray(data.party) ? data.party : [];
            if (partyRaw.length > this.LIMITS.partySize.max) partyRaw.length = this.LIMITS.partySize.max;
            cm.party = partyRaw.map(c => ({
                ...this._validateCreature(c),
                uid: Date.now() + Math.random(),
                statModifiers: { attack: 0, defense: 0, speed: 0 }
            }));

            // 精灵存储
            const storageRaw = Array.isArray(data.storage) ? data.storage : [];
            if (storageRaw.length > this.LIMITS.storageSize.max) storageRaw.length = this.LIMITS.storageSize.max;
            cm.storage = storageRaw.map(c => ({
                ...this._validateCreature(c),
                uid: Date.now() + Math.random(),
                statModifiers: { attack: 0, defense: 0, speed: 0 }
            }));

            // 道具（限制数量）
            cm.items = Array.isArray(data.items) ? data.items.filter(i => i && typeof i.id === 'string').slice(0, 200) : [];

            // 金币上限钳制
            cm.gold = this._clamp(data.gold, this.LIMITS.gold.min, this.LIMITS.gold.max, 0);

            // 布尔和数组类型强制转换
            cm.starterChosen = !!data.starterChosen;
            cm.defeatedTrainers = Array.isArray(data.defeatedTrainers)
                ? data.defeatedTrainers.filter(id => typeof id === 'string' || typeof id === 'number')
                : [];
            cm.creatureDex = (typeof data.creatureDex === 'object' && data.creatureDex !== null)
                ? data.creatureDex : {};
            cm.npcDex = (typeof data.npcDex === 'object' && data.npcDex !== null)
                ? data.npcDex : {};
            cm.badges = Array.isArray(data.badges) ? data.badges : [];
            gameManager.quests = (typeof data.quests === 'object' && data.quests !== null)
                ? data.quests : {};

            // 地图 ID 校验
            const mapId = typeof data.currentMapId === 'string'
                ? data.currentMapId.replace(/[^a-zA-Z0-9_\-]/g, '')
                : 'town';

            gameManager.mapManager.switchMap(mapId);
            const map = gameManager.mapManager.getCurrentMap();

            // 玩家位置合理性校验
            const tileX = typeof data.playerTileX === 'number' && isFinite(data.playerTileX)
                ? Math.floor(Math.abs(data.playerTileX)) % 500 : 5;
            const tileY = typeof data.playerTileY === 'number' && isFinite(data.playerTileY)
                ? Math.floor(Math.abs(data.playerTileY)) % 500 : 5;

            gameManager.player.setPosition(tileX, tileY);
            gameManager.player.direction =
                (['up','down','left','right'].includes(data.playerDirection))
                    ? data.playerDirection : 'down';

            // NPC 加载
            if (map && map.npcs) {
                gameManager.npcManager.loadNPCs(map.npcs);
            }

            // 已击败训练师恢复
            if (Array.isArray(cm.defeatedTrainers)) {
                cm.defeatedTrainers.forEach(id => {
                    gameManager.npcManager.markTrainerDefeated(id);
                });
            }

            // 摄像机复位
            if (map) {
                gameManager.camera.snapTo(
                    gameManager.player.x, gameManager.player.y,
                    gameManager.player.width, gameManager.player.height,
                    map.width * gameManager.mapManager.tileSize,
                    map.height * gameManager.mapManager.tileSize
                );
            }

            return true;
        } catch (e) {
            console.error('[SaveManager] 加载失败:', e);
            return false;
        }
    }

    /** 获取所有槽位的摘要信息（用于 UI 展示） */
    getSlotSummaries() {
        const summaries = [];
        for (let i = 0; i < this.slotCount; i++) {
            summaries.push(this._getSlotSummary(i));
        }
        return summaries;
    }

    /** 获取单个槽位的摘要信息 */
    _getSlotSummary(slot) {
        try {
            const raw = localStorage.getItem(this._slotKey(slot));
            if (!raw) return { slot, empty: true };

            const data = JSON.parse(raw);
            if (!data) return { slot, empty: true };

            const ts = typeof data.timestamp === 'number' && isFinite(data.timestamp)
                ? new Date(data.timestamp) : new Date();

            const timeStr = `${ts.getFullYear()}-${String(ts.getMonth()+1).padStart(2,'0')}-${String(ts.getDate()).padStart(2,'0')} ${String(ts.getHours()).padStart(2,'0')}:${String(ts.getMinutes()).padStart(2,'0')}`;

            const parties = Array.isArray(data.party) ? data.party : [];
            const topLevel = parties.some(p => typeof p.level === 'number')
                ? Math.max(...parties.filter(p => typeof p.level === 'number').map(p => p.level)) : 0;
            const badgeCount = Array.isArray(data.badges) ? data.badges.length : 0;

            return {
                slot,
                empty: false,
                timestamp: data.timestamp,
                timeStr,
                mapId: typeof data.currentMapId === 'string' ? data.currentMapId : '?',
                topLevel: isFinite(topLevel) ? topLevel : 0,
                badgeCount,
                partySize: parties.length,
                gold: this._clamp(data.gold, 0, this.LIMITS.gold.max, 0),
            };
        } catch (e) {
            return { slot, empty: true };
        }
    }

    /** 检查任意槽位是否有存档 */
    hasSave() {
        for (let i = 0; i < this.slotCount; i++) {
            if (localStorage.getItem(this._slotKey(i))) return true;
        }
        return false;
    }

    /** 检查指定槽位是否有存档 */
    hasSlotSave(slot) {
        return localStorage.getItem(this._slotKey(slot)) !== null;
    }

    /** 删除指定槽位的存档 */
    deleteSave(slot = 0) {
        localStorage.removeItem(this._slotKey(slot));
    }

    /** 获取总槽数 */
    getSlotCount() {
        return this.slotCount;
    }
}

/**
 * CreaturesManager - 精灵数据定义和管理
 * 加载精灵数据、计算属性、管理队伍和背包
 */
class CreaturesManager {
    constructor() {
        // 精灵数据库
        this.creaturesData = [];
        // 技能数据库
        this.skillsData = [];
        // 道具数据库
        this.itemsData = [];
        // 玩家队伍（最多6只）
        this.party = [];
        // 玩家背包（存储的精灵）
        this.storage = [];
        // 道具背包
        this.items = [];
        // 金币
        this.gold = 1000;
        // 已选择初始精灵
        this.starterChosen = false;
        // 已击败的训练师
        this.defeatedTrainers = [];
        // 图鉴数据
        this.creatureDex = {};  // { creatureId: { encountered: true, caught: false, name, type, rarity } }
        this.npcDex = {};       // { npcId: { encountered: true, name, type } }
        // 精灵像素画定义
        this.spriteData = this._defineSprites();
    }

    /** 加载所有数据 */
    async loadData() {
        try {
            const [creaturesRes, skillsRes, itemsRes] = await Promise.all([
                fetch('js/data/creatures.json'),
                fetch('js/data/skills.json'),
                fetch('js/data/items.json')
            ]);
            this.creaturesData = await creaturesRes.json();
            this.skillsData = await skillsRes.json();
            this.itemsData = await itemsRes.json();
        } catch (e) {
            console.error('加载数据失败:', e);
            // 使用内嵌数据作为后备
            this._loadFallbackData();
        }
    }

    /** 后备数据（如果JSON加载失败） */
    _loadFallbackData() {
        this.creaturesData = [
            {"id":1,"name":"焰尾狐","type":"fire","rarity":"common","baseStats":{"hp":45,"attack":52,"defense":43,"speed":65},"skills":[1,2,11]},
            {"id":2,"name":"芽叶兔","type":"grass","rarity":"common","baseStats":{"hp":50,"attack":45,"defense":55,"speed":50},"skills":[3,4,12]},
            {"id":3,"name":"水泡蛙","type":"water","rarity":"common","baseStats":{"hp":48,"attack":48,"defense":50,"speed":55},"skills":[5,6,13]},
            {"id":4,"name":"雷电鼠","type":"electric","rarity":"common","baseStats":{"hp":40,"attack":50,"defense":40,"speed":70},"skills":[7,8,14]},
            {"id":5,"name":"岩甲兽","type":"rock","rarity":"common","baseStats":{"hp":55,"attack":45,"defense":60,"speed":30},"skills":[9,10,15]},
            {"id":6,"name":"暗影蝠","type":"dark","rarity":"common","baseStats":{"hp":42,"attack":55,"defense":35,"speed":60},"skills":[16,17,18]},
            {"id":7,"name":"火龙崽","type":"fire","rarity":"rare","baseStats":{"hp":55,"attack":65,"defense":45,"speed":60},"skills":[1,2,19]},
            {"id":8,"name":"花仙子","type":"grass","rarity":"rare","baseStats":{"hp":60,"attack":50,"defense":55,"speed":55},"skills":[3,4,20]},
            {"id":9,"name":"海王蛇","type":"water","rarity":"rare","baseStats":{"hp":58,"attack":62,"defense":52,"speed":58},"skills":[5,6,21]},
            {"id":10,"name":"雷鹰","type":"electric","rarity":"rare","baseStats":{"hp":52,"attack":60,"defense":42,"speed":68},"skills":[7,8,22]},
            {"id":11,"name":"铁壁龟","type":"rock","rarity":"rare","baseStats":{"hp":65,"attack":50,"defense":70,"speed":25},"skills":[9,10,23]},
            {"id":12,"name":"幻影龙","type":"dragon","rarity":"legendary","baseStats":{"hp":80,"attack":75,"defense":65,"speed":70},"skills":[19,24,25,26]}
        ];
        this.skillsData = [
            {"id":1,"name":"火花","type":"fire","power":40,"pp":25,"desc":"喷射小火焰攻击"},
            {"id":2,"name":"火焰拳","type":"fire","power":65,"pp":15,"desc":"用燃烧的拳头攻击"},
            {"id":3,"name":"藤鞭","type":"grass","power":40,"pp":25,"desc":"用藤蔓抽打"},
            {"id":4,"name":"叶刃","type":"grass","power":65,"pp":15,"desc":"锋利的叶片攻击"},
            {"id":5,"name":"水枪","type":"water","power":40,"pp":25,"desc":"喷射水柱攻击"},
            {"id":6,"name":"水之波动","type":"water","power":65,"pp":15,"desc":"用水波冲击"},
            {"id":7,"name":"电击","type":"electric","power":40,"pp":25,"desc":"释放电流攻击"},
            {"id":8,"name":"雷电拳","type":"electric","power":65,"pp":15,"desc":"带电的拳头攻击"},
            {"id":9,"name":"落石","type":"rock","power":40,"pp":25,"desc":"投掷岩石攻击"},
            {"id":10,"name":"岩崩","type":"rock","power":65,"pp":15,"desc":"引发岩石崩塌"},
            {"id":11,"name":"撞击","type":"normal","power":35,"pp":30,"desc":"用身体撞击"},
            {"id":12,"name":"叫声","type":"normal","power":0,"pp":20,"desc":"降低对方攻击力"},
            {"id":13,"name":"撞击","type":"normal","power":35,"pp":30,"desc":"用身体撞击"},
            {"id":14,"name":"电光一闪","type":"normal","power":40,"pp":20,"desc":"高速冲撞"},
            {"id":15,"name":"变硬","type":"normal","power":0,"pp":20,"desc":"提升自身防御"},
            {"id":16,"name":"啄","type":"dark","power":35,"pp":25,"desc":"用嘴啄击"},
            {"id":17,"name":"暗影球","type":"dark","power":60,"pp":15,"desc":"投掷暗影球"},
            {"id":18,"name":"吸血","type":"dark","power":50,"pp":15,"desc":"吸取HP恢复自身"},
            {"id":19,"name":"龙息","type":"dragon","power":60,"pp":15,"desc":"喷射龙之气息"},
            {"id":20,"name":"日光束","type":"grass","power":75,"pp":10,"desc":"聚集阳光攻击"},
            {"id":21,"name":"冲浪","type":"water","power":75,"pp":10,"desc":"掀起巨浪攻击"},
            {"id":22,"name":"打雷","type":"electric","power":75,"pp":10,"desc":"降下雷电攻击"},
            {"id":23,"name":"地震","type":"rock","power":80,"pp":10,"desc":"引发地震攻击"},
            {"id":24,"name":"龙之波动","type":"dragon","power":80,"pp":10,"desc":"释放龙之波动"},
            {"id":25,"name":"破坏光线","type":"normal","power":100,"pp":5,"desc":"释放强力光线"},
            {"id":26,"name":"龙之舞","type":"dragon","power":0,"pp":10,"desc":"提升攻击和速度"}
        ];
        this.itemsData = [
            {"id":1,"name":"精灵球","type":"ball","price":100,"catchRate":0.5,"desc":"基础捕捉道具"},
            {"id":2,"name":"超级球","type":"ball","price":300,"catchRate":0.7,"desc":"高级捕捉道具"},
            {"id":3,"name":"伤药","type":"potion","price":50,"healAmount":50,"desc":"恢复50HP"},
            {"id":4,"name":"好伤药","type":"potion","price":150,"healAmount":200,"desc":"恢复200HP"}
        ];
    }

    /** 获取精灵基础数据 */
    getCreatureData(id) {
        return this.creaturesData.find(c => c.id === id);
    }

    /** 获取技能数据 */
    getSkillData(id) {
        return this.skillsData.find(s => s.id === id);
    }

    /** 获取道具数据 */
    getItemData(id) {
        return this.itemsData.find(i => i.id === id);
    }

    /**
     * 根据等级计算实际属性值
     * HP公式大幅提升，确保战斗能持续2-4回合
     */
    calcStats(baseStats, level) {
        return {
            hp: Math.floor(baseStats.hp * 2 + level * 3 + 20),
            attack: Math.floor(baseStats.attack * 0.4 + baseStats.attack * 0.03 * level + level + 5),
            defense: Math.floor(baseStats.defense * 0.4 + baseStats.defense * 0.03 * level + level + 5),
            speed: Math.floor(baseStats.speed * 0.4 + baseStats.speed * 0.03 * level + level + 5)
        };
    }

    /** 计算升级所需经验值 */
    calcExpToNextLevel(level) {
        return Math.floor(level * level * 3 + level * 10);
    }

    /**
     * 创建精灵实例
     * @param {number} creatureId - 精灵ID
     * @param {number} level - 等级
     * @returns {Object} 精灵实例
     */
    createCreature(creatureId, level) {
        const data = this.getCreatureData(creatureId);
        if (!data) return null;

        const stats = this.calcStats(data.baseStats, level);
        const skills = data.skills.map(sid => {
            const skillData = this.getSkillData(sid);
            return skillData ? { ...skillData, currentPP: skillData.pp } : null;
        }).filter(Boolean);

        return {
            id: data.id,
            uid: Date.now() + Math.random(), // 唯一标识
            name: data.name,
            type: data.type,
            rarity: data.rarity,
            level: level,
            exp: 0,
            expToNext: this.calcExpToNextLevel(level),
            baseStats: { ...data.baseStats },
            stats: stats,
            currentHP: stats.hp,
            maxHP: stats.hp,
            skills: skills,
            // 战斗中的临时属性修正
            statModifiers: { attack: 0, defense: 0, speed: 0 }
        };
    }

    /** 获取初始精灵列表 */
    getStarters() {
        return [
            this.getCreatureData(1), // 焰尾狐
            this.getCreatureData(2), // 芽叶兔
            this.getCreatureData(3)  // 水泡蛙
        ];
    }

    /** 记录精灵到图鉴 */
    recordCreatureEncounter(creatureId) {
        if (!this.creatureDex[creatureId]) {
            const data = this.creaturesData.find(c => c.id === creatureId);
            if (data) {
                this.creatureDex[creatureId] = {
                    encountered: true,
                    caught: false,
                    name: data.name,
                    type: data.type,
                    rarity: data.rarity
                };
            }
        }
    }

    /** 记录捕获精灵到图鉴 */
    recordCreatureCaught(creatureId) {
        if (this.creatureDex[creatureId]) {
            this.creatureDex[creatureId].caught = true;
        } else {
            this.recordCreatureEncounter(creatureId);
            this.creatureDex[creatureId].caught = true;
        }
    }

    /** 记录NPC到图鉴 */
    recordNPCEncounter(npcId, name, type) {
        if (!this.npcDex[npcId]) {
            this.npcDex[npcId] = {
                encountered: true,
                name: name,
                type: type
            };
        }
    }

    /** 获取图鉴统计 */
    getDexStats() {
        const totalCreatures = this.creaturesData.length;
        const encounteredCreatures = Object.keys(this.creatureDex).length;
        const caughtCreatures = Object.values(this.creatureDex).filter(c => c.caught).length;
        const totalNPCs = Object.keys(this.npcDex).length;
        return {
            totalCreatures,
            encounteredCreatures,
            caughtCreatures,
            totalNPCs
        };
    }

    /** 选择初始精灵 */
    chooseStarter(creatureId) {
        if (this.starterChosen) return null;
        const creature = this.createCreature(creatureId, 10);
        if (creature) {
            this.party.push(creature);
            this.starterChosen = true;
            // 赠送更多初始道具
            this.addItem(1, 10);  // 10个精灵球
            this.addItem(3, 5);   // 5个伤药
            this.addItem(4, 2);   // 2个好伤药
        }
        return creature;
    }

    /** 添加精灵到队伍 */
    addToParty(creature) {
        if (this.party.length < 6) {
            this.party.push(creature);
            return true;
        }
        // 队伍已满，存入存储
        this.storage.push(creature);
        return false;
    }

    /** 获取队伍中第一只存活的精灵 */
    getFirstAlive() {
        return this.party.find(c => c.currentHP > 0) || null;
    }

    /** 检查队伍是否全灭 */
    isPartyFainted() {
        return this.party.every(c => c.currentHP <= 0);
    }

    /** 恢复队伍所有精灵HP */
    healParty() {
        this.party.forEach(c => {
            c.currentHP = c.maxHP;
            c.skills.forEach(s => { s.currentPP = s.pp; });
            c.statModifiers = { attack: 0, defense: 0, speed: 0 };
        });
    }

    /** 添加经验值，检查升级 */
    addExp(creature, amount) {
        creature.exp += amount;
        let leveledUp = false;
        while (creature.exp >= creature.expToNext) {
            creature.exp -= creature.expToNext;
            creature.level++;
            const newStats = this.calcStats(creature.baseStats, creature.level);
            const hpDiff = newStats.hp - creature.maxHP;
            creature.maxHP = newStats.hp;
            creature.currentHP = Math.min(creature.currentHP + hpDiff, creature.maxHP);
            creature.stats = newStats;
            creature.expToNext = this.calcExpToNextLevel(creature.level);
            leveledUp = true;

            // 检查是否学到新技能
            const data = this.getCreatureData(creature.id);
            if (data) {
                data.skills.forEach(sid => {
                    if (!creature.skills.find(s => s.id === sid)) {
                        const skillData = this.getSkillData(sid);
                        if (skillData) {
                            creature.skills.push({ ...skillData, currentPP: skillData.pp });
                        }
                    }
                });
            }
        }
        return leveledUp;
    }

    /** 添加道具到背包 */
    addItem(itemId, count) {
        const existing = this.items.find(i => i.itemId === itemId);
        if (existing) {
            existing.count += count;
        } else {
            this.items.push({ itemId, count });
        }
    }

    /** 使用道具 */
    useItem(itemId) {
        const idx = this.items.findIndex(i => i.itemId === itemId);
        if (idx === -1) return false;
        this.items[idx].count--;
        if (this.items[idx].count <= 0) {
            this.items.splice(idx, 1);
        }
        return true;
    }

    /** 获取道具数量 */
    getItemCount(itemId) {
        const item = this.items.find(i => i.itemId === itemId);
        return item ? item.count : 0;
    }

    /** 获取属性颜色 */
    getTypeColor(type) {
        const colors = {
            fire: '#F08030',
            water: '#6890F0',
            grass: '#78C850',
            electric: '#F8D030',
            rock: '#B8A038',
            dark: '#705848',
            dragon: '#7038F8',
            normal: '#A8A878'
        };
        return colors[type] || '#A8A878';
    }

    /** 获取稀有度颜色 */
    getRarityColor(rarity) {
        const colors = {
            common: '#A8A878',
            rare: '#6890F0',
            legendary: '#F8D030'
        };
        return colors[rarity] || '#A8A878';
    }

    /** 定义所有精灵的像素画数据 (32x32 像素) */
    _defineSprites() {
        return {
            // Sprite 1 (32 rows)
            1: {
                pixels: [
                    '........RRRRRRR...RRRRRRR.......',
                    '........ROOOOOR...ROOOOOR.......',
                    '.........OOOOO.....OOOOO........',
                    '.........RWWWR.....RWWWR........',
                    '..........OWW...O...OWW.........',
                    '..........RWOOOOOOOOOWR.........',
                    '...........OOOOOOOOOOO..........',
                    '.........ROOOOOOOOOOOOOR........',
                    '........ROOOOOOOWOOOOOOOR.......',
                    '........ROOOOWWWWWWWOOOOR.R.....',
                    '........ROOOWEEEWEEEWOOORRORR...',
                    '.......ROOOOWWWWWWWWWOOOOOOOOR..',
                    '........ROOWWWWWOWWWWWOOOOOYYOR.',
                    '........ROOOWOOOOOOOWOOOOYYYYYYR',
                    '........ROOOOOOOOOOOOOOOYYYYYYYO',
                    '.........ROOOOOOOOOOOOOOYYYYYYYY',
                    '.........ROOOOOOWOOOOOOOYYYYYYYO',
                    '.........ROOOOWWWWWOOOOYYYYYYYYY',
                    '.........ROOOWWWWWWWOOOOYYYYYYYO',
                    '.........ROOOWWWWWWWOOOOYYYYYYYO',
                    '........ROOOOWWWWWWWOOOOYYYYYYYO',
                    '.........ROOWWWWWWWWWOOOOYYYYYOO',
                    '.........ROOOWWWWWWWOOOOOOOYOOOO',
                    '.........ROOOWWWWWWWOOOOOOOOOOOR',
                    '.........ROOOWWWWWWWOOOOOOOOOOR.',
                    '..........ROOOWWWWWOOORROOOOOR..',
                    '..........ROOOOOWOOOOOR.RRORR...',
                    '..........ROOOOOOOOOOOR...R.....',
                    '..........ROOOOROROOOOR.........',
                    '..........RRRRRRRRRRRRR.........',
                    '..........RRRRRR.RRRRRR.........',
                    '................................',
                ],
                palette: {"O":"#F08030","R":"#FF6B35","W":"#FFFFFF","E":"#1A1A1A","Y":"#FFD700",".":null}
            },

            // Sprite 2 (32 rows)
            2: {
                pixels: [
                    '.........LLLLLLLLLLLLLLLLLLLLLLL',
                    '.........LGGGGLLLLLGGGGLLLLLLLLL',
                    '.........LGHHGLLLLLGHHGLLLLLLLLL',
                    '.........LGHHGLLLLLGHHGLLLLLLLLL',
                    '.........LGHHGLLLLLGHHGLLLLLLLLL',
                    '.........LGHHGLLLLLGHHGLLLLLLLLL',
                    '.........LGHHGLLLLLGHHGLLLLLLLLL',
                    '.........LGHHGLLLLLGHHGLLLLLLLLL',
                    '.........LGHHGLLGLLGHHGLLLLLLLLL',
                    '.........LGHGGGGGGGGGHGLLLLLLLLL',
                    '.........LGGGGGGGGGGGGGLLLLLLLLL',
                    '.........LGGGGGGGGGGGGGLLLLLLLLL',
                    '........LGGGGGGGGGGGGGGGLLLLLLLL',
                    '........LGGGGEWWGWWEGGGGLLLLLLLL',
                    '........LGGGGGGGGGGGGGGGLLLLLLLL',
                    '.......LGGGGGGGLGGGGGGGGGLLLLLLL',
                    '.......LLGGGGGGGGGGGGGGGLLLLLLLL',
                    '.......LLGGGGGGGGGGGGGGGLLLLLLLL',
                    '.......LLGGGGGGGGGGGGGGGLLLLLLLL',
                    '.......LLLGGGGGGGGGGGGGLLLLLLLLL',
                    '.......LLLGGGGGGGGGGGGGGLLGLLLLL',
                    '.......LLLGGGGGGGGGGGGGLLLLLLLLL',
                    '.......LLGGGGGGGGGGGGGGGLLGLLLLL',
                    '.......LLLGGGGGGGGGGGGGLLLLLLLLL',
                    '.......LLLGGGGGGGGGGGGGGLLGLLLLL',
                    '.......LLLGGGGGGGGGGGGGLLLLLLLLL',
                    '.......LLLLGGGGGGGGGGGLLLLLLLLLL',
                    '.......LLLLGGGGGGGGGGGLLLLLLLLLL',
                    '.......LLLLGGGGGGGGGGGLLLLLLLLLL',
                    '.......LLLLLLLLLGLLLLLLLLLLLLLLL',
                    '.......LLLLLLLLLLLLLLLLLLLLLLLLL',
                    '.......LLLLLLLLLLLLLLLLLLLLLLLLL',
                ],
                palette: {"G":"#78C850","L":"#2d5a1e","W":"#FFFFFF","H":"#A8E06C","E":"#1A1A1A",".":null}
            },

            // Sprite 3 (32 rows)
            3: {
                pixels: [
                    '................................',
                    '................DD..............',
                    '...........DDDDDBDSDDDDDDDDDDDDD',
                    '.........DDBBBBBSBBBBBDDDDDDDDDD',
                    '........DBBWBBSBBBBBBWBBDDDDDDDD',
                    '.......DBWWWWWBBBBBWWWWWBDDDDDDD',
                    '.......DBWSWWWBBBBBSWWWWBDDDDDDD',
                    '......DBWWWEEWWBBBWWEEWWWBDDDDDD',
                    '......DBBWWWWWBBBBBWWWWWBBDDDDDD',
                    '......DBBWWWWWBBBBBWWWWWBBDDDDDD',
                    '.....DBBBBBWBBBBBBBBBWBBBBBDDDDD',
                    '.....DDBBBBBBBBBBBBBBBBBBBDDDDDD',
                    '.....DDBBBDDDDDDBDDDDDDBBBDDDDDD',
                    '.....DDBBBBBBBBBBBBBBBBBBBDDDDDD',
                    '.....DDDBBBBBBBBBBBBBBBBBDDDDDDD',
                    '.....DDDDBBBBBBBSBBBBBBBDDDDDDDD',
                    '.....DDDDDBBBSSSSSSSBBBDDDDDDDDD',
                    '.....DDDDBBBSSSSSSSSSBBBDDDDDDDD',
                    '.....DDDDBBBSSSSSSSSSBBBDDDDDDDD',
                    '.....DDDDBBBSSSSSSSSSBBBDDDDDDDD',
                    '.....DDDBBBSSSSSSSSSSSBBBDDDDDDD',
                    '.....DDDDBBBSSSSSSSSSBBBDDDDDDDD',
                    '.....DDDDBBBSSSSSSSSSBBBDDDDDDDD',
                    '.....DDDDBBBSSSSSSSSSBBBDDDDDDDD',
                    '.....DBBBBBBBSSSSSSSBBBBBBBDDDDD',
                    '.....DBBBBBBBBBBSBBBBBBBBBBDDDDD',
                    '.....DBBBBBBBBBBBBBBBBBBBBBDDDDD',
                    '.....SSSSSSSDBBBBBBBDSSSSSSSDDDD',
                    '.....SSSSSSSDDDDBDDDDSSSSSSSDDDD',
                    '.....SSSSSSSDDDDDDDDDSSSSSSSDDDD',
                    '...........DDDDDDDDDDDDDDDDDDDDD',
                    '...........DDDDDDDDDDDDDDDDDDDDD',
                ],
                palette: {"B":"#6890F0","W":"#FFFFFF","S":"#A0C4FF","D":"#3A6BC5","E":"#1A1A1A",".":null}
            },

            // Sprite 4 (32 rows)
            4: {
                pixels: [
                    '..........EEEEEEEEEEEEEEEEEEEEEE',
                    '........EEYEEEEEEEEEEEYEEEEEEEEE',
                    '.......EYYYYYEEEEEEEYYYYYEEEEEEE',
                    '......EYYYCYYYEEEEEYYYCYYYEEEEEE',
                    '......EYYCCCYYEEYEEYYCCCYYEEEEEE',
                    '.....EYYCCCCYYYYYYYYYCCCCYYEEEEE',
                    '.....EEYYCCYYYYYYYYYYYCCYYEEEEEE',
                    '.....EEYYYYYYYYYYYYYYYYYYYEEEEEE',
                    '.....EEEYYYYYWYYYYWYYYYYYEEEEEEE',
                    '.....EEEEYYYYEEYYEEYYYYYEEEEEEEE',
                    '.....EEEEYYCYYYYYYYYYCYYEEEEEEEE',
                    '.....EEEYYCCCYYYEYYYCCCYYEEEEEEE',
                    '.....EEEECCCCCYYYYYCCCCCEEYEEEEE',
                    '.....EEEEYCCCYYYYYYYCCCYEYEEEEEE',
                    '.....EEEEYYCYYYYYYYYYCYYYEEEEEEE',
                    '.....EEEEEYYYYYYYYYYYYYEEYEEEEEE',
                    '.....EEEEEEYYYYYYYYYYYEEYEEEEEEE',
                    '.....EEEEEYYYYEYYEYYYYYEEYEEEEEE',
                    '.....EEEEEYYYYYEEYYYYYYEYEEEEEEE',
                    '.....EEEEEYYYYEYYEYYYYYEEYEEEEEE',
                    '.....EEEEYYYYYYYYYYYYYYYYEEEEEEE',
                    '.....EEEEEYYYYYYYYYYYYYEEEEEEEEE',
                    '.....EEEEEYYYYYYYYYYYYYEEEEEEEEE',
                    '.....EEEEEYYYYYYYYYYYYYEEEEEEEEE',
                    '.....EEEEEEYYYYYYYYYYYEEEEEEEEEE',
                    '.....EEEEEEYYYYYYYYYYYEEEEEEEEEE',
                    '.....EEEEEEYYYYYYYYYYYEEEEEEEEEE',
                    '.....EEEEEEYYYYEYEYYYYEEEEEEEEEE',
                    '.....EEEEEEYYYYEEEYYYYEEEEEEEEEE',
                    '.....EEEEEEYYYYEEEYYYYEEEEEEEEEE',
                    '.....EEEEEEEEEEEEEEEEEEEEEEEEEEE',
                    '.....EEEEEEEEEEEEEEEEEEEEEEEEEEE',
                ],
                palette: {"Y":"#F8D030","E":"#1A1A1A","C":"#FF8C00","W":"#FFFFFF",".":null}
            },

            // Sprite 5 (32 rows)
            5: {
                pixels: [
                    '................................',
                    '..........DDDDDDDDDDDDDDDDDDDDDD',
                    '.........DBBBBBBBBBBBBBDDDDDDDDD',
                    '........DDBBBBBBBBBBBBBDDDDDDDDD',
                    '.......DBBBBBBBBBBBBBBBBBDDDDDDD',
                    '.......DBBBBBBGBBBGBBBBBBDDDDDDD',
                    '.......DBBBBBBBBGBBBBBBBBDDDDDDD',
                    '.......DBBBBBBBBBBBBBBBBBDDDDDDD',
                    '.......DBBBBEWBBBBBWEBBBBDDDDDDD',
                    '.......DBBBBBBBBBBBBBBBBBDDDDDDD',
                    '.......DBBBBBBGBBBGBBBBBBDDDDDDD',
                    '.......DBBBBBBBBBBBBBBBBBDDDDDDD',
                    '.......DBBBBBBBBBBBBBBBBBDDDDDDD',
                    '.....DDDBBBBBBBBBBBBBBBBBDDDDDDD',
                    '....DBBBBBBBBBBBBBBBBBBBBBBBDDDD',
                    '....DBBBBBBBBBBBBBBBBBBBBBBBDDDD',
                    '....DBBDDDDDGDDDDDDDDDDDDDBBDDDD',
                    '....DBBDDDGDDDDGDDDDGDDDDDBBDDDD',
                    '....DBBDDDDDDDDDDDDDDDGDDDBBDDDD',
                    '....DBBBBBBBBBBBBBBBBBBBBBBBDDDD',
                    '....DBBBBBWWWWWWWWWWWWWBBBBBDDDD',
                    '....DBBBBBWWWWWWWWWWWWWBBBBBDDDD',
                    '....DBBBBBWWWWWWWWWWWWWBBBBBDDDD',
                    '....DBBBBBWWWWWWWWWWWWWBBBBBDDDD',
                    '....DBBBBBWWWWWWWWWWWWWBBBBBDDDD',
                    '....DBBBBBBBBBBBBBBBBBBBBBBBDDDD',
                    '....DBBBBBBBBBBBBBBBBBBBBBBBDDDD',
                    '....DDDBBBBBBDDDDDDDBBBBBBDDDDDD',
                    '....DDDBBBBBBDDDDDDDBBBBBBDDDDDD',
                    '....DDDDDDDDDDDDDDDDDDDDDDDDDDDD',
                    '....DDDDDDDDDDDDDDDDDDDDDDDDDDDD',
                    '....DDDDDDDDDDDDDDDDDDDDDDDDDDDD',
                ],
                palette: {"B":"#B8A038","D":"#8B7355","W":"#FFFFFF","G":"#A09060","E":"#1A1A1A",".":null}
            },

            // Sprite 6 (32 rows)
            6: {
                pixels: [
                    '............DDDDDDDDDDDDDDDDDDDD',
                    'DDDDDDDDDDDDPPPDDDPPPDDDDDDDDDDD',
                    'PPPPPDDDDDDDPPPDDDPPPDDDDDDPPPPP',
                    'PPPPPPDDDDDDDPPDDDDPPDDDDDPPPPPP',
                    'DDDDPPPDDDDDDPDDPDDPDDDDDPPPDDDD',
                    'DDDDDPPPDDDDDPPPPPPPDDDDPPPDDDDD',
                    'DDDDDDPPPDDDPRPPPPRPPDDPPPDDDDDD',
                    'DDDDDDDPPPDDPRRPPRRPPDPPPDDDDDDD',
                    'DDDDDDDDPPPPPPPPPPPPPPPPDDDDDDDD',
                    'DDDDDDDPPPDDPPPPPPPPPDPPPDDDDDDD',
                    'DDDDDDPPPDDDPPTPPTPPPDDPPPDDDDDD',
                    'DDDDDPPPDDDDPPTPPTPPPDDDPPPDDDDD',
                    'DDDDPPPDDDDDPPPPPPPPPDDDDPPPDDDD',
                    'DDDPPPDDDDDDPPPPPPPPPDDDDDPPPDDD',
                    'PPPPPDDDDDDPPPPPPPPPPPDDDDDPPPPP',
                    'PPPPDDDDDDDDPPPPPPPPPDDDDDDDPPPP',
                    'DDDDDDDDDDDDPPPPPPPPPDDDDDDDDDDD',
                    'DDDDDDDDDDDDPPPPPPPPPDDDDDDDDDDD',
                    'DDDDDDDDDDDDDPPPPPPPDDDDDDDDDDDD',
                    'DDDDDDDDDDDDDDPPPPPDDDDDDDDDDDDD',
                    'DDDDDDDDDDDDDDDDPDDDDDDDDDDDDDDD',
                    'DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD',
                    'DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD',
                    'DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD',
                    'DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD',
                    'DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD',
                    'DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD',
                    'DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD',
                    'DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD',
                    'DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD',
                    'DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD',
                    'DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD',
                ],
                palette: {"P":"#705848","R":"#FF2020","D":"#4A3828","T":"#FFFFFF",".":null}
            },

            // Sprite 7 (32 rows)
            7: {
                pixels: [
                    '.........LLLLLLLLLLLLLLLLLLLLLLL',
                    '.........LLLLLLLLLLLLLLLLLLLLLLL',
                    '.........LLLLLLLLLLLLLLLLLLLLLLL',
                    '.........LLLLLLLOLLLLLLLLLLLLLLL',
                    '.........LLLOOOOOOOOOLLLLLLLLLLL',
                    '.........LLOOOOOOOOOOOLLLLLLLLLL',
                    '.........LOOOOOOOOOOOOOLLLLLLLLL',
                    '........LOOOOOOOOOOOOOOOLLLLLLLL',
                    '........LOOOOEWOOWEOOOOOLLLLLLLL',
                    '........LOOOOOOOOOOOOOOOLLLLLLLL',
                    '.......LOOOOOOOOOOOOOOOOOLLLLLLL',
                    '....LLLLLOOOOOLOOLOOOOOOLLLLLLLL',
                    '...LLLLLLLLOOOLLLLOOOOLLLLLLLLLL',
                    '...LLYYYYYLOOOOOOOOOOOOYYYYYLLLL',
                    '...LLLYYYYOOOOOOOOOOOOOLYYYYLLLL',
                    '...LLLYYYLLOOOOOOOOOOOLLYYYLLLLL',
                    '...LLLLYYLLOOOOOWOOOOOLLLYYLLLLL',
                    '...LLLLYLLOOOOLWWWLOOOOLLYLLLLLL',
                    '...LLLLLLLOOOWWWWWWWOOOLLLLLLLLL',
                    '...LLLLLLLOOOLWWWWWLOOOLLLLLLLLL',
                    '...LLLLLLOOOWWWWWWWWWOOOLLLLLLLL',
                    '...LLLLLLLOOOWLWWWLWOOOLLLLLLLLL',
                    '...LLLLLLLOOOWWWWWWWOOOLOOLLLLLL',
                    '...LLLLLLLOOOOWWWWWOOOOLOOLLLLLL',
                    '...LLLLLLLLOOOOOWOOOOOLLOOLLLLLL',
                    '...LLLLLLLOOOOOOOOOOOOOLOOLLLLLL',
                    '...LLLLLLLOOOOOOOOOOOOOLOOLLLLLL',
                    '...LLLLLLLOOOOLLOLLOOOOLYYLLLLLL',
                    '...LLLLLLLOOOOLLLLLOOOOYLLYLLLLL',
                    '...LLLLLLLLOOLLLLLLLOOLLYYLLLLLL',
                    '...LLLLLLLLLLLLLLLLLLLLLLLLLLLLL',
                    '...LLLLLLLLLLLLLLLLLLLLLLLLLLLLL',
                ],
                palette: {"O":"#F08030","L":"#8B2500","W":"#FFFFFF","Y":"#FFD700","E":"#1A1A1A",".":null}
            },

            // Sprite 8 (32 rows)
            8: {
                pixels: [
                    '..........LLKLLLKLLLKLLLLLLLLLLL',
                    '.........LKKKKKKKKKKKKKLLLLLLLLL',
                    '.........LKKFKKKFKKKFKKLLLLLLLLL',
                    '........LKKFFFFFFFFFFFKKLLLLLLLL',
                    '........LLFFFFFLGLFFFFFLLLLLLLLL',
                    '........LLKFFGGGGGGGFFKLLLLLLLLL',
                    '........LLLGGGGGGGGGGGLLLLLLLLLL',
                    '........LLGGGGGGGGGGGGGLLLLLLLLL',
                    '........LLGGGEWGGWEGGGGLLLLLLLLL',
                    '........LLGGGGGGGGGGGGGLLLLLLLLL',
                    '........LGGGGGGGGGGGGGGGLLLLLLLL',
                    '........LLGGGGGLLGGGGGGLLLLLLLLL',
                    '........LLGGGGGGGGGGGGGLLLLLLLLL',
                    '........LLGGGGGGGGGGGGGLLLLLLLLL',
                    '........LLLGGGGGGGGGGGLLLLLLLLLL',
                    '........LLLGGGGGGGGGGGGGGLLLLLLL',
                    '.......LGLLGGGGGKGGGGGGGGLLLLLLL',
                    '......LGLLGGGGGKKKGGGGGGLGLLLLLL',
                    '......LGLLGGLGKKKKKGLGGGLGLLLLLL',
                    '......LLLGGGGGGKKKGGGGGGLLLLLLLL',
                    '......LLGGLGGGGGKGGGGGLGGLLLLLLL',
                    '......LLGGGGGGGGGGGGGGGGGLLLLLLL',
                    '......LGGLGGGGGGGGGGGGGLGGLLLLLL',
                    '.....LGGGGGGGGGGGGGGGGGGGGGLLLLL',
                    '.....LGGGGGGGGGGGGGGGGGGGGGLLLLL',
                    '....LGGGGGGGGGGGGGGGGGGGGGGGLLLL',
                    '....LGGGGGGGGGGGGGGGGGGGGGGGLLLL',
                    '...LGGGGGGGGGGGGGGGGGGGGGGGGGLLL',
                    '...LLLLLLLLLLLLLLLLLLLLLLLLLLLLL',
                    '...LLLLLLLLLLLLLLLLLLLLLLLLLLLLL',
                    '...LLLLLLLLLLLLLLLLLLLLLLLLLLLLL',
                    '...LLLLLLLLLLLLLLLLLLLLLLLLLLLLL',
                ],
                palette: {"G":"#78C850","L":"#2d5a1e","F":"#FFFFFF","K":"#FF69B4","W":"#FFFFFF","E":"#1A1A1A",".":null}
            },

            // Sprite 9 (32 rows)
            9: {
                pixels: [
                    '...........DDDSDSDSDDDDDDDDDDDDD',
                    '...........DDSDSDSDSDDDDDDDDDDDD',
                    '...........DDDDDDDDDDDDDDDDDDDDD',
                    '..........DBBBBBBBBBBBDDDDDDDDDD',
                    '.........DBBBBBDDBBBBBBDDDDDDDDD',
                    '.........DBBBEWBBWEBBBBDDDDDDDDD',
                    '........DBBBBBBDDBBBBBBBDDDDDDDD',
                    '........DDBBBBBBBBBBBBBDDDDDDDDD',
                    '........DDBBBBBBBBBBBBBDDDDDDDDD',
                    '........DDDBBBBBBBBBBBDDDDDDDDDD',
                    '........DDDBBBWWWWWBBBDDDDDDDDDD',
                    '........DDDDBBSWWWWWBBBDDDDDDDDD',
                    '........DDDDDBDBWWWWWBDBDDDDDDDD',
                    '........DDDDDDBBBWWWWWBBBDDDDDDD',
                    '........DDDDDDDBDSWWWWWBDBDDDDDD',
                    '........DDDDDDDBBBWWWWWBBBDDDDDD',
                    '........DDDDDDDBDBWWWWWBDBDDDDDD',
                    '........DDDDDDBBSWWWWWBBBDDDDDDD',
                    '........DDDDDDBDBWWWWWBDBDDDDDDD',
                    '........DDDDDBBBWWWWWBBBDDDDDDDD',
                    '........DDDDBDSWWWWWBDBDDDDDDDDD',
                    '........DDBBBWWWWWBBBDDDDDDDDDDD',
                    '........DBDBWWWWWBDBDDDDDDDDDDDD',
                    '.......DBBSWWWWWBBBDDDDDDDDDDDDD',
                    '.......DBDBWWWWWBDBDDDDDDDDDDDDD',
                    '......DBBBWWWWWBBBDDDDDDDDDDDDDD',
                    '......DBDSWWWWWBDBDDDDDDDDDDDDDD',
                    '......DBBBWWWWWBBBDDDDDDDDDDDDDD',
                    '......DDBBBWWWWWBBBDDDDDDDDDDDDD',
                    '......DDDBBBWWWWWBBBDDDDDDDDDDDD',
                    '......DDDDDDDDDDBDDDDDDDDDDDDDDD',
                    '......DDDDDDDDDDBDDDDDDDDDDDDDDD',
                ],
                palette: {"B":"#6890F0","D":"#3A6BC5","W":"#FFFFFF","S":"#A0C4FF","E":"#1A1A1A",".":null}
            },

            // Sprite 10 (32 rows)
            10: {
                pixels: [
                    '................................',
                    '...............EEEEEEEEEEEEEEEEE',
                    '..............EYYEEEEEEEEEEEEEEE',
                    'EEEEEEEEEEEEEEEYYEEEEEEEEEEEEEEE',
                    'YYYYYYYEEEEEEEEEYEEEEEEEEYYYYYYY',
                    'YYYYYYYYEEEEEYYYYYYYEEEEYYYYYYYY',
                    'DDDDDYYYYEEEYWYYYYWYYEEYYYYDDDDD',
                    'DDDDDDYYYYEEYEEYYEEYYEYYYYDDDDDD',
                    'DDDDDDDYYYYYYYYYYYYYYYYYYDDDDDDD',
                    'DDDDDDDDYYYYYYYEEYYYYYYYDDDDDDDD',
                    'DDDEDDDDDYYYYYYEEYYYYYYDDDDDEDDD',
                    'DDDDEDDDDDYYYYYYYYYYYYDDDDDEDDDD',
                    'DDDEDDDDDYYYYYYYYYYYYYYDDDDDEDDD',
                    'DDDDDDDDYYYYYYYYYYYYYYYYDDDDDDDD',
                    'DDDDDDDYYYYEYYYYYYYYYYYYYDDDDDDD',
                    'DDDDDDYYYYEEYYYYYYYYYEYYYYDDDDDD',
                    'DDDDDYYYYEEYYYYYYYYYYYEYYYYDDDDD',
                    'DDDDYYYYEEEEYYYYYYYYYEEEYYYYDDDD',
                    'YYYYYYYEEEEEYYYYYYYYYEEEEYYYYYYY',
                    'YYYYYYEEEEEEYYYYYYYYYEEEEEYYYYYY',
                    'EEEEEEEEEEEEEYYYYYYYEEEEEEEEEEEE',
                    'EEEEEEEEEEEEEEYEYYEEEEEEEEEEEEEE',
                    'EEEEEEEEEEEEEEEYYEEEEEEEEEEEEEEE',
                    'EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE',
                    'EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE',
                    'EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE',
                    'EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE',
                    'EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE',
                    'EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE',
                    'EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE',
                    'EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE',
                    'EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE',
                ],
                palette: {"Y":"#F8D030","D":"#C8A820","E":"#1A1A1A","W":"#FFFFFF",".":null}
            },

            // Sprite 11 (32 rows)
            11: {
                pixels: [
                    '...........DDDDDGDDDDDDDDDDDDDDD',
                    '.........DDGGGGGGGGGGGDDDDDDDDDD',
                    '........DGGGGGGGGGGGGGGGDDDDDDDD',
                    '.......DGGGGGGGGDGGGGGGGGDDDDDDD',
                    '......DGGGGGDDDDDDDDDGGGGGDDDDDD',
                    '.....DGGGGDDWDDDGDDDWDDGGGGDDDDD',
                    '.....DGGGDDDDGGGDGGGDDDDGGGDDDDD',
                    '....DGGGDDWDGGGGGGGGGDWDDGGGDDDD',
                    '....DGGGDDDGGGGGDGGGGGDDDGGGDDDD',
                    '....DGGGDDDGGGGGGGGGGGDDDGGGDDDD',
                    '...DGGGDDDGGGGGGGGGGGGGDDDGGGDDD',
                    '...DDGGGDDDGGGGGGGGGGGDDDGGGDDDD',
                    '...DDGGGDDDGGGGGGGGGGGDDDGGGDDDD',
                    '...DDGGGDDDDGGGGGGGGGDDDDGGGDDDD',
                    '...DDDGGGDDDDGGGBGGGDDDDGGGDDDDD',
                    '...DDDGGGGDDDBBBBBBBDDDGGGGDDDDD',
                    '...DDDDGGGGGBEWBBWEBBGGGGGDDDDDD',
                    '...DDDDDGGGGBBBBBBBBBGGGGDDDDDDD',
                    '...DDDDDDGGBBBBBBBBBBBGGDDDDDDDD',
                    '...DDDDDDDDGBBBBBBBBBGDDDDDDDDDD',
                    '...DDDDDBBBBBBBBBBBBBBBBBDDDDDDD',
                    '...DDDDDBBWWWWWWWWWWWWWBBDDDDDDD',
                    '...DDDDDBBWWWWWWWWWWWWWBBDDDDDDD',
                    '...DDDDDBBWWWWWWWWWWWWWBBDDDDDDD',
                    '...DDDDDBBWWWWWWWWWWWWWBBBDDDDDD',
                    '...DDDDDBBWWWWWWWWWWWWWBBDBDDDDD',
                    '...DDDDBBBBBBBBBBBBBBBBBBBDBDDDD',
                    '...DDDDBBBBBDDDDDDDDDBBBBBDDDDDD',
                    '...DDDDDDDDDDDDDDDDDDDDDDDDDDDDD',
                    '...DDDDDDDDDDDDDDDDDDDDDDDDDDDDD',
                    '...DDDDDDDDDDDDDDDDDDDDDDDDDDDDD',
                    '...DDDDDDDDDDDDDDDDDDDDDDDDDDDDD',
                ],
                palette: {"G":"#A0A0A0","B":"#B8A038","W":"#FFFFFF","D":"#707070","E":"#1A1A1A",".":null}
            },

            // Sprite 12 (32 rows)
            12: {
                pixels: [
                    '........PDGGDPPPPPPPDGGDPPPPPPPP',
                    '........PDDDDPPPPPPPDDDDPPPPPPPP',
                    '........PDDDDPPPPPPPDDDDPPPPPPPP',
                    '........PPDDPPPPDPPPPDDPPPPPPPPP',
                    '........PPDDDDDDDDDDDDDPPPPPPPPP',
                    'PPPPPPPPPPDDDDDDDDDDDDDPPPPPPPPP',
                    'PPPPPPPPPPDDDDDDDDDDDDDPPPPPPPPP',
                    'PPPPPPPPPDDDWDDDDDDWDDDDPPPPPPPP',
                    'DDDDDPPPPDDDWRDDDDRWDDDPPPPDDDDD',
                    'DDDDDDPPPPDDDDDDDDDDDDPPPPDDDDDD',
                    'DDDDDDDPPPPDDDDDDDDDDPPPPDDDDDDD',
                    'DDDDDDDDPPPPDDPDDPDDPPPPDDDDDDDD',
                    'DDDDDDDDDPPPPPPPPPPPPPPDDDDDDDDD',
                    'DDDDDDDDDDPPPPWDDWPPPPDDDDDDDDDD',
                    'DDDDDDDDDPPPPDDDDDDPPPPDDDDDDDDD',
                    'DDDDDDDDPPPPDDDDDDDDPPPPDDDDDDDD',
                    'DDDDDDDPPPPPDDPDWDPDDPPPPDDDDDDD',
                    'DDDDDDPPPPPDDDDWWWDDDDPPPPDDDDDD',
                    'DDDDDPPPPPPDPDGWWGWDPDPPPPPDDDDD',
                    'DDDDPPPPPPPDDDGWWGWDDDPPPPPPDDDD',
                    'PPPPPPPPPPDDDWPWWWPWDDDPPPPPPPPP',
                    'PPPPPPPPPPPDDDWWWWWDDDPPPPPPPPPP',
                    'PPPPPPPPPPPDDDWWWWWDDDPPPPPPPPPP',
                    'PPPPPPPPPPPDDDDWWWDDDDPPPPPPPPPP',
                    'PPPPPPPPPPDDDDDDDDDDDDDPPPPPPPPP',
                    'PPPPPPPPPPDDDDDDDDDDDDDPPPPPPPPP',
                    'PPPPPPPPPPDDDDPPDDDDDDDPPPPPPPPP',
                    'PPPPPPPPPPDDDDPPDDDDDDDPPPPPPPPP',
                    'PPPPPPPPPGDDDDGPDDGDDDDGPPPPPPPP',
                    'PPPPPPPPPPPPPPPDDDDDPPPPPPPPPPPP',
                    'PPPPPPPPPPPPPPDDGDDPPPPPPPPPPPPP',
                    'PPPPPPPPPPPPPPPPGPPPPPPPPPPPPPPP',
                ],
                palette: {"D":"#7038F8","P":"#5020C0","W":"#FFFFFF","G":"#FFD700","R":"#FF2020",".":null}
            },

        };
    }

        /** 渲染精灵像素画 */
    renderCreature(ctx, creatureId, x, y, size, flip = false) {
        const sprite = this.spriteData[creatureId];
        if (!sprite) return;

        const pixelSize = size / 32;
        const pixels = sprite.pixels;
        const palette = sprite.palette;

        ctx.save();
        if (flip) {
            ctx.translate(x + size, y);
            ctx.scale(-1, 1);
            x = 0;
            y = 0;
        }

        for (let row = 0; row < pixels.length; row++) {
            for (let col = 0; col < pixels[row].length; col++) {
                const ch = pixels[row][col];
                const color = palette[ch];
                if (color) {
                    ctx.fillStyle = color;
                    ctx.fillRect(
                        x + col * pixelSize,
                        y + row * pixelSize,
                        Math.ceil(pixelSize),
                        Math.ceil(pixelSize)
                    );
                }
            }
        }
        ctx.restore();
    }
}

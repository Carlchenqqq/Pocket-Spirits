/**
 * MapManager - 地图管理
 * 支持从 JSON 文件加载地图，失败时回退到代码生成
 * 瓦片大小：32x32
 */
class MapManager {
    constructor() {
        this.tileSize = 32;
        // 当前地图ID
        this.currentMapId = 'qingye_town';
        // 地图数据缓存
        this.maps = {};
        // 初始化标志
        this._initialized = false;
        // 初始化 Promise
        this._initPromise = this._initMaps();
        // 瓦片颜色定义
        this.colors = {
            grass: '#4a8c3f',       // 草地
            grassDark: '#3d7a34',   // 深草地
            path: '#c4a86b',        // 路径
            pathDark: '#b39860',    // 深路径
            water: '#3a7bd5',       // 水
            waterLight: '#5a9be5',  // 浅水
            tree: '#2d5a1e',        // 树木
            treeTop: '#3a7a28',     // 树冠
            house: '#8B6914',       // 房屋墙壁
            roof: '#c0392b',        // 屋顶
            door: '#5a3a0a',        // 门
            tallGrass1: '#5aac4f',  // 高草1
            tallGrass2: '#4a9c3f',  // 高草2
            fence: '#8B7355',       // 栅栏
            sign: '#D2B48C',        // 标志牌
            flower1: '#ff6b9d',     // 花1
            flower2: '#ffd93d',     // 花2
            // 新增：洞穴/沼泽/特殊地图
            caveWall: '#1a1a2a',    // 洞穴墙壁
            caveFloor: '#2a2a3a',   // 洞穴地板
            cavePath: '#3a3a5a',    // 洞穴路径
            caveCrystal: '#7b68ee', // 洞穴水晶
            caveStalagmite: '#2a2a3a', // 石笋
            caveStalactite: '#2a2a3a', // 钟乳石
            mud: '#6b4c2a',         // 泥地（沼泽）
            swamp: '#2a3a1a',       // 沼泽
            dirt: '#8b6432',        // 土路
            rock: '#5a4a3a',        // 岩石
            reef: '#4a6a8a',        // 礁石
            stoneWall: '#3a3a4a',   // 石墙（灵渊居）
            stoneFloor: '#4a4a6a',  // 石板地
            crystal: '#a078d8'      // 水晶（装饰）
        };
    }

    /** 
     * 等待地图初始化完成
     * @returns {Promise<void>}
     */
    async ready() {
        await this._initPromise;
    }

    /** 
     * 初始化地图 - 异步加载 JSON，失败则回退到代码生成
     */
    async _initMaps() {
        // V1完整地图列表：新地图ID + 旧地图文件（同时加载以兼容旧存档）
        const mapIds = [
            'qingye_town', 'route_001', 'bibo_forest', 'bibo_town',
            'mist_marsh', 'reef_route', 'redrock_path', 'lingyuan_chamber',
            'yanyang_city', 'abandoned_mine',
            // 旧ID兼容（文件已重命名，但旧存档可能引用它们）
            'town1', 'wild', 'town2', 'cave'
        ];
        
        for (const id of mapIds) {
            try {
                const mapData = await this.loadMap(id);
                if (mapData) {
                    this.maps[id] = mapData;
                    // Map loaded successfully
                    continue;
                }
            } catch (e) {
                console.warn(`Failed to load map ${id} from JSON, using generated:`, e.message);
            }
            // 回退到代码生成
            this.maps[id] = this._generateMap(id);
        }
        
        this._initialized = true;
    }

    /**
     * 从 JSON 文件加载地图
     * @param {string} mapId - 地图ID
     * @returns {Promise<Object|null>} 地图数据或 null
     */
    async loadMap(mapId) {
        const response = await fetch(`data/maps/${mapId}.json`);
        if (!response.ok) {
            return null;
        }
        const data = await response.json();
        
        // 将 layers.tiles 和 layers.collision 映射到顶层
        // 以保持与原有代码的兼容性
        if (data.layers) {
            return {
                id: data.id,
                name: data.name,
                width: data.width,
                height: data.height,
                tileSize: data.tileSize || 32,
                tiles: data.layers.tiles,
                collision: data.layers.collision,
                playerStart: data.playerStart,
                transfers: data.transfers,
                npcs: data.npcs,
                wildCreatures: data.wildCreatures || null
            };
        }
        
        return data;
    }

    /**
     * 代码生成地图（回退方案）
     * @param {string} mapId - 地图ID
     * @returns {Object} 地图数据
     */
    _generateMap(mapId) {
        switch (mapId) {
            case 'qingye_town':
            case 'town1':
                return this._generateTown1();
            case 'route_001':
            case 'wild':
                return this._generateWild();
            case 'bibo_town':
            case 'town2':
                return this._generateTown2();
            case 'abandoned_mine':
            case 'cave':
                return this._generateCave();
            // 新地图回退（JSON加载失败时用近似地图代替）
            case 'bibo_forest':
                return this._generateWild();       // 森林→野外近似
            case 'mist_marsh':
                return this._generateCave();       // 沼泽→洞穴近似
            case 'reef_route':
                return this._generateWild();       // 航道→野外近似
            case 'redrock_path':
                return this._generateWild();       // 古道→野外近似
            case 'lingyuan_chamber':
                return this._generateCave();       // 秘室→洞穴近似
            case 'yanyang_city':
                return this._generateTown2();      // 炎阳城→镇近似
            default:
                console.error(`Unknown map ID: ${mapId}, using town1 fallback`);
                return this._generateTown1();
        }
    }

    /** 生成所有地图（同步版本，用于回退） */
    _generateMaps() {
        // 同时注册新旧ID，确保切换时都能找到
        const town1 = this._generateTown1();
        this.maps['qingye_town'] = town1;
        this.maps['town1'] = town1;

        const wild = this._generateWild();
        this.maps['route_001'] = wild;
        this.maps['wild'] = wild;

        const town2 = this._generateTown2();
        this.maps['bibo_town'] = town2;
        this.maps['town2'] = town2;
    }

    /** 青叶镇 - 20x15 瓦片 */
    _generateTown1() {
        const W = 20, H = 15;
        const tiles = [];
        const collision = [];

        // 初始化全部为草地
        for (let y = 0; y < H; y++) {
            tiles[y] = [];
            collision[y] = [];
            for (let x = 0; x < W; x++) {
                tiles[y][x] = 'grass';
                collision[y][x] = 0;
            }
        }

        // 道路 - 十字形
        for (let x = 0; x < W; x++) {
            tiles[7][x] = 'path';
            tiles[8][x] = 'path';
        }
        for (let y = 0; y < H; y++) {
            tiles[y][10] = 'path';
            tiles[y][11] = 'path';
        }

        // 房屋1 (左上)
        this._placeHouse(tiles, collision, 2, 2, 4, 3);
        // 房屋2 (右上)
        this._placeHouse(tiles, collision, 14, 2, 4, 3);
        // 精灵研究所 (中间偏上)
        this._placeHouse(tiles, collision, 8, 1, 4, 4, true);

        // 树木围栏 - 上方
        for (let x = 0; x < W; x++) {
            if (tiles[0][x] === 'grass') {
                tiles[0][x] = 'tree';
                collision[0][x] = 1;
            }
        }
        // 树木围栏 - 下方
        for (let x = 0; x < W; x++) {
            if (tiles[H-1][x] === 'grass') {
                tiles[H-1][x] = 'tree';
                collision[H-1][x] = 1;
            }
        }
        // 树木围栏 - 左侧
        for (let y = 0; y < H; y++) {
            if (tiles[y][0] === 'grass') {
                tiles[y][0] = 'tree';
                collision[y][0] = 1;
            }
        }
        // 树木围栏 - 右侧
        for (let y = 0; y < H; y++) {
            if (tiles[y][W-1] === 'grass') {
                tiles[y][W-1] = 'tree';
                collision[y][W-1] = 1;
            }
        }

        // 花朵装饰
        tiles[5][3] = 'flower1';
        tiles[6][4] = 'flower2';
        tiles[5][15] = 'flower1';
        tiles[6][16] = 'flower2';

        // 传送点 - 南边出口到野外
        tiles[H-1][10] = 'path';
        tiles[H-1][11] = 'path';
        collision[H-1][10] = 3; // 传送点
        collision[H-1][11] = 3;

        // 标志牌
        tiles[6][10] = 'sign';
        collision[6][10] = 1;

        return {
            id: 'town1',
            name: '青叶镇',
            width: W,
            height: H,
            tiles,
            collision,
            playerStart: { x: 10, y: 9 },
            transfers: [
                { x: 10, y: H-1, targetMap: 'wild', targetX: 15, targetY: 1 },
                { x: 11, y: H-1, targetMap: 'wild', targetX: 16, targetY: 1 }
            ],
            npcs: [
                { id: 'professor', x: 10, y: 6, type: 'professor', name: '精灵博士',
                  dialogs: [
                      '欢迎来到精灵纪元的世界！',
                      '我是精灵博士，研究精灵的学者。',
                      '请选择你的初始精灵伙伴吧！'
                  ]
                },
                { id: 'town1_girl', x: 4, y: 10, type: 'dialog', name: '小镇女孩',
                  dialogs: ['南边的草丛里有很多精灵哦！', '小心别迷路了~']
                },
                { id: 'town1_boy', x: 16, y: 10, type: 'dialog', name: '小镇男孩',
                  dialogs: ['听说碧波镇有个很强的训练师！', '往南走就能到野外了。']
                }
            ]
        };
    }

    /** 野外草丛 - 30x20 瓦片 */
    _generateWild() {
        const W = 30, H = 20;
        const tiles = [];
        const collision = [];

        // 初始化全部为草地
        for (let y = 0; y < H; y++) {
            tiles[y] = [];
            collision[y] = [];
            for (let x = 0; x < W; x++) {
                tiles[y][x] = 'grass';
                collision[y][x] = 0;
            }
        }

        // 小路 - 从北到南
        for (let y = 0; y < H; y++) {
            tiles[y][15] = 'path';
            tiles[y][16] = 'path';
        }

        // 小路分支 - 向东
        for (let x = 15; x < W; x++) {
            tiles[10][x] = 'path';
            tiles[11][x] = 'path';
        }

        // 大量草丛区域
        const grassAreas = [
            {x1:2,y1:2,x2:8,y2:7},
            {x1:20,y1:2,x2:27,y2:7},
            {x1:2,y1:12,x2:8,y2:17},
            {x1:20,y1:12,x2:27,y2:17},
            {x1:10,y1:3,x2:13,y2:8},
            {x1:10,y1:12,x2:13,y2:17},
        ];

        grassAreas.forEach(area => {
            for (let y = area.y1; y <= area.y2; y++) {
                for (let x = area.x1; x <= area.x2; x++) {
                    if (x >= 0 && x < W && y >= 0 && y < H) {
                        tiles[y][x] = (x + y) % 2 === 0 ? 'tallGrass1' : 'tallGrass2';
                        collision[y][x] = 2; // 草丛标记
                    }
                }
            }
        });

        // 树木围栏
        for (let x = 0; x < W; x++) {
            tiles[0][x] = 'tree'; collision[0][x] = 1;
            tiles[H-1][x] = 'tree'; collision[H-1][x] = 1;
        }
        for (let y = 0; y < H; y++) {
            tiles[y][0] = 'tree'; collision[y][0] = 1;
            tiles[y][W-1] = 'tree'; collision[y][W-1] = 1;
        }

        // 水池
        for (let y = 8; y <= 9; y++) {
            for (let x = 22; x <= 26; x++) {
                tiles[y][x] = 'water';
                collision[y][x] = 1;
            }
        }

        // 传送点 - 北边回青叶镇
        tiles[0][15] = 'path'; collision[0][15] = 3;
        tiles[0][16] = 'path'; collision[0][16] = 3;
        // 传送点 - 东边到碧波镇
        tiles[10][W-1] = 'path'; collision[10][W-1] = 3;
        tiles[11][W-1] = 'path'; collision[11][W-1] = 3;

        return {
            id: 'wild',
            name: '野外草丛',
            width: W,
            height: H,
            tiles,
            collision,
            playerStart: { x: 15, y: 2 },
            transfers: [
                { x: 15, y: 0, targetMap: 'town1', targetX: 10, targetY: 13 },
                { x: 16, y: 0, targetMap: 'town1', targetX: 11, targetY: 13 },
                { x: W-1, y: 10, targetMap: 'bibo_forest', targetX: 1, targetY: 10 },
                { x: W-1, y: 11, targetMap: 'bibo_forest', targetX: 1, targetY: 11 }
            ],
            npcs: [
                { id: 'trainer1', x: 5, y: 10, type: 'trainer', name: '训练师小明',
                  dialogs: ['来对战吧！'],
                  creatures: [{ creatureId: 4, level: 3 }, { creatureId: 6, level: 3 }],
                  defeated: false, reward: 100
                },
                { id: 'trainer2', x: 24, y: 14, type: 'trainer', name: '训练师小红',
                  dialogs: ['我的精灵很强哦！'],
                  creatures: [{ creatureId: 2, level: 4 }, { creatureId: 1, level: 4 }],
                  defeated: false, reward: 150
                },
                { id: 'trainer3', x: 8, y: 4, type: 'trainer', name: '捕虫少年阿杰',
                  dialogs: ['我专门捕捉虫系精灵！', '来比比看谁的更强！'],
                  creatures: [{ creatureId: 16, level: 5 }, { creatureId: 15, level: 5 }],
                  defeated: false, reward: 120
                },
                { id: 'trainer4', x: 22, y: 4, type: 'trainer', name: '露营者大叔',
                  dialogs: ['在野外露营最棒了！', '顺便来场对战吧！'],
                  creatures: [{ creatureId: 13, level: 6 }, { creatureId: 7, level: 6 }],
                  defeated: false, reward: 180
                },
                { id: 'wild_hiker', x: 18, y: 5, type: 'dialog', name: '旅行者',
                  dialogs: ['这片草丛里什么精灵都有。', '往东走可以到碧波镇。']
                }
            ],
            // 野外可遇到的精灵（含新精灵）
            wildCreatures: [
                { id: 1, minLevel: 2, maxLevel: 4, weight: 15 },
                { id: 2, minLevel: 2, maxLevel: 4, weight: 15 },
                { id: 3, minLevel: 2, maxLevel: 4, weight: 15 },
                { id: 4, minLevel: 2, maxLevel: 4, weight: 12 },
                { id: 5, minLevel: 2, maxLevel: 3, weight: 8 },
                { id: 6, minLevel: 2, maxLevel: 4, weight: 12 },
                { id: 13, minLevel: 2, maxLevel: 3, weight: 8 },
                { id: 14, minLevel: 2, maxLevel: 3, weight: 6 },
                { id: 15, minLevel: 2, maxLevel: 3, weight: 6 },
                { id: 16, minLevel: 2, maxLevel: 4, weight: 8 }
            ]
        };
    }

    /** 碧波镇 - 20x15 瓦片 */
    _generateTown2() {
        const W = 20, H = 15;
        const tiles = [];
        const collision = [];

        for (let y = 0; y < H; y++) {
            tiles[y] = [];
            collision[y] = [];
            for (let x = 0; x < W; x++) {
                tiles[y][x] = 'grass';
                collision[y][x] = 0;
            }
        }

        // 道路
        for (let x = 0; x < W; x++) {
            tiles[7][x] = 'path';
            tiles[8][x] = 'path';
        }
        for (let y = 0; y < H; y++) {
            tiles[y][2] = 'path';
            tiles[y][3] = 'path';
        }

        // 商店 (左上)
        this._placeHouse(tiles, collision, 5, 2, 4, 3, false, true);
        // 道馆 (右上)
        this._placeHouse(tiles, collision, 12, 2, 5, 4, false, false, true);
        // 精灵中心 (下方)
        this._placeHouse(tiles, collision, 8, 10, 4, 3, false, false, false, true);

        // 树木围栏
        for (let x = 0; x < W; x++) {
            if (tiles[0][x] === 'grass') { tiles[0][x] = 'tree'; collision[0][x] = 1; }
            if (tiles[H-1][x] === 'grass') { tiles[H-1][x] = 'tree'; collision[H-1][x] = 1; }
        }
        for (let y = 0; y < H; y++) {
            if (tiles[y][0] === 'grass') { tiles[y][0] = 'tree'; collision[y][0] = 1; }
            if (tiles[y][W-1] === 'grass') { tiles[y][W-1] = 'tree'; collision[y][W-1] = 1; }
        }

        // 传送点 - 西边回野外
        tiles[7][0] = 'path'; collision[7][0] = 3;
        tiles[8][0] = 'path'; collision[8][0] = 3;

        // 水池装饰
        for (let y = 11; y <= 13; y++) {
            for (let x = 14; x <= 17; x++) {
                tiles[y][x] = 'water';
                collision[y][x] = 1;
            }
        }

        // 花
        tiles[5][6] = 'flower1';
        tiles[6][7] = 'flower2';
        tiles[5][14] = 'flower1';

        return {
            id: 'town2',
            name: '碧波镇',
            width: W,
            height: H,
            tiles,
            collision,
            playerStart: { x: 2, y: 7 },
            transfers: [
                { x: 0, y: 7, targetMap: 'bibo_forest', targetX: 28, targetY: 7 }
            ],
            npcs: [
                { id: 'shop_npc', x: 7, y: 6, type: 'shop', name: '商店店员',
                  dialogs: ['欢迎光临！需要什么道具吗？']
                },
                { id: 'heal_npc', x: 10, y: 13, type: 'healer', name: '精灵中心护士',
                  dialogs: ['你的精灵已经恢复健康了！', '随时欢迎回来~']
                },
                { id: 'town2_man', x: 15, y: 7, type: 'dialog', name: '镇民',
                  dialogs: ['碧波镇的道馆馆主非常厉害！', '建议先在野外多训练一下。']
                },
                { id: 'gym_leader_rock', x: 14, y: 4, type: 'gym_leader', name: '道馆馆主·岩铁',
                  dialogs: ['我是碧波道馆的馆主岩铁！', '我的岩石精灵坚不可摧！', '想挑战我的话，先击败3个训练师吧！'],
                  creatures: [{ creatureId: 11, level: 12 }, { creatureId: 5, level: 10 }, { creatureId: 21, level: 14 }],
                  defeated: false, reward: 500, badgeId: 'stone_badge'
                },
                { id: 'rival_town2', x: 5, y: 11, type: 'rival', name: '宿敌·阿雷',
                  dialogs: ['哈哈！你终于追上来了？', '我已经获得了岩石徽章！', '...开玩笑的，我也刚到。'],
                  creatures: [{ creatureId: 10, level: 8 }, { creatureId: 22, level: 9 }],
                  defeated: false, reward: 200
                }
            ]
        };
    }

    /** 幽暗洞穴 - 20x15 瓦片 */
    _generateCave() {
        const W = 20, H = 15;
        const tiles = [];
        const collision = [];

        for (let y = 0; y < H; y++) {
            tiles[y] = [];
            collision[y] = [];
            for (let x = 0; x < W; x++) {
                if (y === 0 || y === H-1 || x === 0 || x === W-1) {
                    tiles[y][x] = 'caveWall';
                    collision[y][x] = 1;
                } else {
                    tiles[y][x] = 'caveFloor';
                    collision[y][x] = 0;
                }
            }
        }

        // 中央通道
        for (let x = 1; x < W-1; x++) { tiles[7][x] = 'cavePath'; tiles[8][x] = 'cavePath'; }

        // 随机装饰
        const decoPositions = [[2,2],[5,3],[12,4],[7,10],[15,11],[17,6],[3,12]];
        decoPositions.forEach(([dx, dy]) => {
            if (dy > 0 && dy < H-1 && dx > 0 && dx < W-1) {
                tiles[dy][dx] = Math.random() > 0.5 ? 'caveCrystal' : 'caveStalagmite';
                collision[dy][dx] = 1;
            }
        });

        return {
            id: 'cave', name: '幽暗洞穴', width: W, height: H, tiles, collision,
            playerStart: { x: 2, y: 7 },
            transfers: [
                { x: W-1, y: 7, targetMap: 'wild', targetX: 10, targetY: 16 },
                { x: W-1, y: 8, targetMap: 'wild', targetX: 10, targetY: 17 }
            ],
            npcs: [
                { id: 'cave_miner', x: 5, y: 5, type: 'trainer', name: '矿工老李',
                  dialogs: ['我在这里挖矿好多年了！', '这里的矿石能进化某些精灵哦。'],
                  creatures: [{ creatureId: 5, level: 7 }, { creatureId: 21, level: 6 }],
                  defeated: false, reward: 200
                },
                { id: 'cave_hermit', x: 14, y: 11, type: 'dialog', name: '隐居者',
                  dialogs: ['洞穴深处藏着稀有的暗属性精灵...', '小心，它们很凶猛。']
                },
                { id: 'trainer_cave_boss', x: 9, y: 3, type: 'trainer', name: '洞穴探险家阿强',
                  dialogs: ['我是这个洞穴的守护者！', '想过去的话先击败我！'],
                  creatures: [{ creatureId: 11, level: 9 }, { creatureId: 22, level: 10 }, { creatureId: 12, level: 8 }],
                  defeated: false, reward: 350
                }
            ],
            wildCreatures: [
                { id: 5, minLevel: 4, maxLevel: 7, weight: 18 },
                { id: 6, minLevel: 3, maxLevel: 6, weight: 15 },
                { id: 11, minLevel: 4, maxLevel: 6, weight: 10 },
                { id: 21, minLevel: 5, maxLevel: 8, weight: 8 },
                { id: 22, minLevel: 4, maxLevel: 7, weight: 12 }
            ]
        };
    }

    /** 放置房屋 */
    _placeHouse(tiles, collision, sx, sy, w, h, isLab = false, isShop = false, isGym = false, isCenter = false) {
        for (let y = sy; y < sy + h; y++) {
            for (let x = sx; x < sx + w; x++) {
                if (y === sy) {
                    // 屋顶
                    tiles[y][x] = 'roof';
                    collision[y][x] = 1;
                } else if (y === sy + h - 1 && x === sx + Math.floor(w / 2)) {
                    // 门
                    tiles[y][x] = 'door';
                    collision[y][x] = 0;
                } else {
                    tiles[y][x] = 'house';
                    collision[y][x] = 1;
                }
            }
        }
    }

    /** 获取当前地图数据 */
    getCurrentMap() {
        return this.maps[this.currentMapId];
    }

    /** 切换地图 */
    switchMap(mapId) {
        if (this.maps[mapId]) {
            this.currentMapId = mapId;
            return true;
        }
        return false;
    }

    /** 获取指定位置的碰撞值 */
    getCollision(tileX, tileY) {
        const map = this.getCurrentMap();
        if (!map) return 1;
        if (tileY < 0 || tileY >= map.height || tileX < 0 || tileX >= map.width) return 1;
        return map.collision[tileY][tileX];
    }

    /** 检查是否是传送点 */
    checkTransfer(tileX, tileY) {
        const map = this.getCurrentMap();
        if (!map || !map.transfers) return null;
        return map.transfers.find(t => t.x === tileX && t.y === tileY) || null;
    }

    /** 检查是否是草丛 */
    isTallGrass(tileX, tileY) {
        return this.getCollision(tileX, tileY) === 2;
    }

    /** 渲染地图 */
    render(ctx, camera) {
        const map = this.getCurrentMap();
        if (!map) return;

        const ts = this.tileSize;
        const viewW = camera.canvasWidth;
        const viewH = camera.canvasHeight;
        // 计算可见范围
        const startX = Math.max(0, Math.floor(camera.x / ts));
        const startY = Math.max(0, Math.floor(camera.y / ts));
        const endX = Math.min(map.width, Math.ceil((camera.x + viewW) / ts) + 1);
        const endY = Math.min(map.height, Math.ceil((camera.y + viewH) / ts) + 1);

        for (let y = startY; y < endY; y++) {
            for (let x = startX; x < endX; x++) {
                this._renderTile(ctx, x, y, map.tiles[y][x]);
            }
        }
    }

    /** 渲染单个瓦片 */
    _renderTile(ctx, x, y, tileType) {
        const ts = this.tileSize;
        const px = x * ts;
        const py = y * ts;

        // 使用瓦片坐标作为伪随机种子，保证同一位置每次渲染一致
        const seed = (x * 7 + y * 13) % 17;

        switch (tileType) {
            case 'grass':
                // 基础绿色填充
                ctx.fillStyle = this.colors.grass;
                ctx.fillRect(px, py, ts, ts);
                // 4-5个随机位置的小草细节（2x3像素的深绿小草丛）
                ctx.fillStyle = this.colors.grassDark;
                const grassPositions1 = [
                    [4, 8], [16, 20], [24, 4], [10, 26], [28, 14]
                ];
                for (let gi = 0; gi < 4 + (seed % 2); gi++) {
                    const gp = grassPositions1[gi];
                    ctx.fillRect(px + gp[0], py + gp[1], 2, 3);
                }
                // 偶尔的浅绿高光点
                ctx.fillStyle = '#6ab85e';
                if (seed % 3 === 0) ctx.fillRect(px + 8, py + 12, 2, 2);
                if (seed % 5 === 0) ctx.fillRect(px + 20, py + 6, 2, 2);
                if (seed % 4 === 1) ctx.fillRect(px + 14, py + 22, 2, 2);
                break;

            case 'path':
                // 土黄色基础
                ctx.fillStyle = this.colors.path;
                ctx.fillRect(px, py, ts, ts);
                // 碎石纹理（多个2x2的深色点）
                ctx.fillStyle = this.colors.pathDark;
                ctx.fillRect(px + 6, py + 8, 2, 2);
                ctx.fillRect(px + 18, py + 12, 2, 2);
                ctx.fillRect(px + 10, py + 22, 2, 2);
                ctx.fillRect(px + 24, py + 6, 2, 2);
                ctx.fillRect(px + 14, py + 16, 2, 2);
                ctx.fillRect(px + 4, py + 26, 2, 2);
                // 路径边缘有轻微的草地过渡
                ctx.fillStyle = '#7a9c5f';
                ctx.fillRect(px, py, 2, 2);
                ctx.fillRect(px + ts - 2, py, 2, 2);
                ctx.fillRect(px, py + ts - 2, 2, 2);
                ctx.fillRect(px + ts - 2, py + ts - 2, 2, 2);
                break;

            case 'water':
                // 蓝色基础
                ctx.fillStyle = this.colors.water;
                ctx.fillRect(px, py, ts, ts);
                // 波纹效果（多条1px的浅蓝横线）
                ctx.fillStyle = this.colors.waterLight;
                ctx.fillRect(px + 2, py + 6, 28, 1);
                ctx.fillRect(px + 4, py + 14, 24, 1);
                ctx.fillRect(px + 1, py + 22, 30, 1);
                ctx.fillRect(px + 6, py + 28, 20, 1);
                // 白色高光点
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(px + 8, py + 4, 2, 1);
                ctx.fillRect(px + 20, py + 12, 2, 1);
                ctx.fillRect(px + 14, py + 24, 2, 1);
                break;

            case 'tree':
                // 树干（带纹理）
                ctx.fillStyle = '#5a3a1a';
                ctx.fillRect(px + 12, py + 20, 8, 12);
                // 树干纹理
                ctx.fillStyle = '#4a2a10';
                ctx.fillRect(px + 14, py + 22, 2, 2);
                ctx.fillRect(px + 16, py + 26, 2, 2);
                ctx.fillRect(px + 13, py + 28, 1, 3);
                // 树冠 - 深绿轮廓
                ctx.fillStyle = this.colors.tree;
                ctx.fillRect(px + 2, py + 0, 28, 22);
                // 树冠 - 中绿主体（圆形感）
                ctx.fillStyle = this.colors.treeTop;
                ctx.fillRect(px + 4, py + 2, 24, 18);
                ctx.fillRect(px + 6, py + 1, 20, 20);
                // 树冠 - 浅绿高光
                ctx.fillStyle = '#4a9a38';
                ctx.fillRect(px + 8, py + 4, 10, 8);
                ctx.fillRect(px + 10, py + 3, 6, 4);
                break;

            case 'house':
                // 墙壁基础
                ctx.fillStyle = this.colors.house;
                ctx.fillRect(px, py, ts, ts);
                // 砖缝线条
                ctx.fillStyle = '#7a5a10';
                ctx.fillRect(px, py + 8, ts, 1);
                ctx.fillRect(px, py + 16, ts, 1);
                ctx.fillRect(px, py + 24, ts, 1);
                ctx.fillRect(px + 10, py, 1, 8);
                ctx.fillRect(px + 22, py + 8, 1, 8);
                ctx.fillRect(px + 6, py + 16, 1, 8);
                ctx.fillRect(px + 18, py + 24, 1, 8);
                // 窗户
                ctx.fillStyle = '#87CEEB';
                ctx.fillRect(px + 3, py + 9, 8, 8);
                ctx.fillRect(px + 21, py + 9, 8, 8);
                // 窗户十字窗框
                ctx.fillStyle = '#5a3a0a';
                ctx.fillRect(px + 6, py + 9, 2, 8);
                ctx.fillRect(px + 3, py + 12, 8, 2);
                ctx.fillRect(px + 24, py + 9, 2, 8);
                ctx.fillRect(px + 21, py + 12, 8, 2);
                // 浅蓝玻璃反光
                ctx.fillStyle = '#a8dff0';
                ctx.fillRect(px + 4, py + 10, 3, 3);
                ctx.fillRect(px + 22, py + 10, 3, 3);
                // 烟囱
                ctx.fillStyle = '#8B4513';
                ctx.fillRect(px + 24, py - 4, 5, 8);
                ctx.fillStyle = '#6B3410';
                ctx.fillRect(px + 24, py - 4, 5, 2);
                break;

            case 'roof':
                // 屋顶基础
                ctx.fillStyle = this.colors.roof;
                ctx.fillRect(px, py, ts, ts);
                // 瓦片纹理（更多横线）
                ctx.fillStyle = '#a93226';
                ctx.fillRect(px + 2, py + 3, 28, 1);
                ctx.fillRect(px + 2, py + 7, 28, 1);
                ctx.fillRect(px + 2, py + 11, 28, 1);
                ctx.fillRect(px + 2, py + 15, 28, 1);
                ctx.fillRect(px + 2, py + 19, 28, 1);
                ctx.fillRect(px + 2, py + 23, 28, 1);
                ctx.fillRect(px + 2, py + 27, 28, 1);
                // 阴影渐变效果
                ctx.fillStyle = 'rgba(0,0,0,0.1)';
                ctx.fillRect(px, py + 20, ts, 12);
                ctx.fillStyle = 'rgba(0,0,0,0.05)';
                ctx.fillRect(px, py + 10, ts, 10);
                break;

            case 'door':
                // 门背景
                ctx.fillStyle = this.colors.house;
                ctx.fillRect(px, py, ts, ts);
                // 门板
                ctx.fillStyle = this.colors.door;
                ctx.fillRect(px + 8, py + 4, 16, 28);
                // 木纹
                ctx.fillStyle = '#4a2a08';
                ctx.fillRect(px + 10, py + 6, 1, 24);
                ctx.fillRect(px + 14, py + 6, 1, 24);
                ctx.fillRect(px + 18, py + 6, 1, 24);
                ctx.fillRect(px + 22, py + 6, 1, 24);
                // 遮雨棚
                ctx.fillStyle = '#c0392b';
                ctx.fillRect(px + 6, py + 2, 20, 4);
                ctx.fillStyle = '#a93226';
                ctx.fillRect(px + 6, py + 5, 20, 1);
                // 门把手更明显
                ctx.fillStyle = '#FFD700';
                ctx.fillRect(px + 20, py + 16, 3, 4);
                ctx.fillStyle = '#DAA520';
                ctx.fillRect(px + 21, py + 17, 1, 2);
                break;

            case 'tallGrass1':
                // 基础草地
                ctx.fillStyle = this.colors.grass;
                ctx.fillRect(px, py, ts, ts);
                // 高草 - 多层不同绿色
                // 第1层 - 最深绿
                ctx.fillStyle = this.colors.tallGrass1;
                ctx.fillRect(px + 2, py + 2, 12, 28);
                ctx.fillRect(px + 18, py + 6, 12, 24);
                // 第2层 - 中绿
                ctx.fillStyle = this.colors.tallGrass2;
                ctx.fillRect(px + 6, py + 4, 8, 20);
                ctx.fillRect(px + 22, py + 8, 8, 18);
                // 第3层 - 浅绿高光
                ctx.fillStyle = '#6ab85e';
                ctx.fillRect(px + 4, py + 3, 3, 14);
                ctx.fillRect(px + 20, py + 7, 3, 12);
                // 第4层 - 草叶尖端更细（1px宽）
                ctx.fillStyle = '#7cc86e';
                ctx.fillRect(px + 5, py + 1, 1, 4);
                ctx.fillRect(px + 9, py + 2, 1, 3);
                ctx.fillRect(px + 21, py + 5, 1, 4);
                ctx.fillRect(px + 25, py + 6, 1, 3);
                break;

            case 'tallGrass2':
                // 基础草地
                ctx.fillStyle = this.colors.grass;
                ctx.fillRect(px, py, ts, ts);
                // 高草 - 多层不同绿色
                ctx.fillStyle = this.colors.tallGrass2;
                ctx.fillRect(px + 4, py + 4, 10, 26);
                ctx.fillRect(px + 16, py + 2, 12, 28);
                // 第2层
                ctx.fillStyle = this.colors.tallGrass1;
                ctx.fillRect(px + 8, py + 6, 6, 18);
                ctx.fillRect(px + 20, py + 4, 8, 20);
                // 第3层 - 浅绿
                ctx.fillStyle = '#6ab85e';
                ctx.fillRect(px + 6, py + 5, 3, 12);
                ctx.fillRect(px + 18, py + 3, 3, 14);
                // 第4层 - 草叶尖端
                ctx.fillStyle = '#7cc86e';
                ctx.fillRect(px + 7, py + 3, 1, 4);
                ctx.fillRect(px + 11, py + 5, 1, 3);
                ctx.fillRect(px + 19, py + 1, 1, 4);
                ctx.fillRect(px + 23, py + 3, 1, 3);
                break;

            case 'sign':
                // 草地背景
                ctx.fillStyle = this.colors.grass;
                ctx.fillRect(px, py, ts, ts);
                // 标志杆（更精细木纹）
                ctx.fillStyle = '#8B7355';
                ctx.fillRect(px + 14, py + 12, 4, 20);
                ctx.fillStyle = '#7a6245';
                ctx.fillRect(px + 15, py + 14, 1, 16);
                ctx.fillRect(px + 17, py + 16, 1, 12);
                // 标志板
                ctx.fillStyle = this.colors.sign;
                ctx.fillRect(px + 4, py + 2, 24, 14);
                // 木纹
                ctx.fillStyle = '#c2a47c';
                ctx.fillRect(px + 4, py + 6, 24, 1);
                ctx.fillRect(px + 4, py + 10, 24, 1);
                // 顶部边框
                ctx.fillStyle = '#8B7355';
                ctx.fillRect(px + 4, py + 2, 24, 2);
                // 文字暗示（小横线模拟文字）
                ctx.fillStyle = '#6a5a3a';
                ctx.fillRect(px + 8, py + 7, 14, 1);
                ctx.fillRect(px + 10, py + 10, 10, 1);
                break;

            case 'flower1':
                // 草地背景
                ctx.fillStyle = this.colors.grass;
                ctx.fillRect(px, py, ts, ts);
                // 花茎
                ctx.fillStyle = '#2d5a1e';
                ctx.fillRect(px + 14, py + 16, 4, 16);
                // 叶子
                ctx.fillStyle = '#3a7a28';
                ctx.fillRect(px + 8, py + 20, 6, 3);
                ctx.fillRect(px + 18, py + 22, 6, 3);
                // 花瓣
                ctx.fillStyle = this.colors.flower1;
                ctx.fillRect(px + 8, py + 8, 16, 12);
                // 花蕊细节
                ctx.fillStyle = '#ff8fb1';
                ctx.fillRect(px + 12, py + 10, 8, 8);
                ctx.fillStyle = '#ffd93d';
                ctx.fillRect(px + 14, py + 12, 4, 4);
                break;

            case 'flower2':
                // 草地背景
                ctx.fillStyle = this.colors.grass;
                ctx.fillRect(px, py, ts, ts);
                // 花茎
                ctx.fillStyle = '#2d5a1e';
                ctx.fillRect(px + 14, py + 16, 4, 16);
                // 叶子
                ctx.fillStyle = '#3a7a28';
                ctx.fillRect(px + 8, py + 20, 6, 3);
                ctx.fillRect(px + 18, py + 22, 6, 3);
                // 花瓣
                ctx.fillStyle = this.colors.flower2;
                ctx.fillRect(px + 8, py + 8, 16, 12);
                // 花蕊细节
                ctx.fillStyle = '#ffe066';
                ctx.fillRect(px + 12, py + 10, 8, 8);
                ctx.fillStyle = '#ff9500';
                ctx.fillRect(px + 14, py + 12, 4, 4);
                break;

            // ===== 洞穴瓦片 =====
            case 'caveWall':
                ctx.fillStyle = '#3a3540';
                ctx.fillRect(px, py, ts, ts);
                // 墙壁纹理
                ctx.fillStyle = '#2d2833';
                ctx.fillRect(px + 0, py + 0, ts, 4);
                ctx.fillRect(px + 4, py + 6, 20, 3);
                ctx.fillRect(px + 2, py + 14, 24, 2);
                ctx.fillRect(px + 6, py + 22, 14, 3);
                ctx.fillRect(px + 0, py + 28, ts, 4);
                // 岩石凸起
                ctx.fillStyle = '#4a4550';
                ctx.fillRect(px + 4, py + 4, 10, 8);
                ctx.fillRect(px + 18, py + 18, 8, 8);
                // 高光
                ctx.fillStyle = '#5a5560';
                ctx.fillRect(px + 6, py + 5, 4, 2);
                ctx.fillRect(px + 20, py + 19, 3, 2);
                break;

            case 'caveFloor':
                ctx.fillStyle = '#2a2530';
                ctx.fillRect(px, py, ts, ts);
                // 地面碎石纹理
                ctx.fillStyle = '#35303d';
                ctx.fillRect(px + 4, py + 6, 4, 3);
                ctx.fillRect(px + 18, py + 12, 5, 4);
                ctx.fillRect(px + 8, py + 22, 6, 3);
                ctx.fillRect(px + 22, py + 26, 3, 3);
                // 细小裂缝
                ctx.fillStyle = '#1f1a25';
                ctx.fillRect(px + 10, py + 8, 1, 12);
                ctx.fillRect(px + 26, py + 4, 1, 18);
                break;

            case 'cavePath':
                ctx.fillStyle = '#3a3540';
                ctx.fillRect(px, py, ts, ts);
                // 平整地面
                ctx.fillStyle = '#43404a';
                ctx.fillRect(px + 2, py + 2, 28, 28);
                // 路面痕迹
                ctx.fillStyle = '#3a3540';
                ctx.fillRect(px + 6, py + 8, 8, 2);
                ctx.fillRect(px + 18, py + 18, 10, 2);
                ctx.fillRect(px + 10, py + 24, 6, 2);
                break;

            case 'caveCrystal':
                ctx.fillStyle = '#2a2530';
                ctx.fillRect(px, py, ts, ts);
                // 晶体底座
                ctx.fillStyle = '#5a4a6a';
                ctx.fillRect(px + 10, py + 20, 12, 10);
                // 主晶体 - 紫色发光
                const crystalGrad = ctx.createLinearGradient(px+12, py+2, px+20, py+22);
                crystalGrad.addColorStop(0, '#b088ff');
                crystalGrad.addColorStop(0.5, '#8855dd');
                crystalGrad.addColorStop(1, '#6633bb');
                ctx.fillStyle = crystalGrad;
                ctx.beginPath();
                ctx.moveTo(px + 16, py + 2);
                ctx.lineTo(px + 22, py + 14);
                ctx.lineTo(px + 19, py + 26);
                ctx.lineTo(px + 13, py + 26);
                ctx.lineTo(px + 10, py + 14);
                ctx.fill();
                // 高光
                ctx.fillStyle = 'rgba(255,255,255,0.4)';
                ctx.fillRect(px + 14, py + 6, 3, 8);
                // 发光效果
                ctx.fillStyle = 'rgba(176,136,255,0.15)';
                ctx.fillRect(px + 4, py + 0, 24, 30);
                break;

            case 'caveStalagmite':
                ctx.fillStyle = '#2a2530';
                ctx.fillRect(px, py, ts, ts);
                // 石笋底部
                ctx.fillStyle = '#4a4050';
                ctx.fillRect(px + 8, py + 18, 16, 12);
                ctx.fillStyle = '#5a5060';
                ctx.fillRect(px + 10, py + 10, 12, 10);
                ctx.fillStyle = '#6a6070';
                ctx.fillRect(px + 12, py + 4, 8, 8);
                // 尖顶
                ctx.fillStyle = '#7a7080';
                ctx.fillRect(px + 14, py + 0, 4, 6);
                // 阴影
                ctx.fillStyle = 'rgba(0,0,0,0.3)';
                ctx.fillRect(px + 22, py + 20, 6, 8);
                break;

            case 'caveStalactite':
                ctx.fillStyle = '#2a2530';
                ctx.fillRect(px, py, ts, ts);
                // 钟乳石顶部
                ctx.fillStyle = '#5a5060';
                ctx.fillRect(px + 12, py + 0, 8, 6);
                ctx.fillStyle = '#6a6070';
                ctx.fillRect(px + 10, py + 4, 12, 8);
                ctx.fillStyle = '#4a4050';
                ctx.fillRect(px + 8, py + 10, 16, 10);
                ctx.fillStyle = '#3a3040';
                ctx.fillRect(px + 6, py + 18, 20, 10);
                // 尖端滴水
                ctx.fillStyle = '#88aacc';
                ctx.fillRect(px + 15, py + 27, 2, 3);
                break;

            default:
                ctx.fillStyle = '#ff00ff';
                ctx.fillRect(px, py, ts, ts);
        }
    }

    /** 渲染NPC */
    renderNPCs(ctx, npcs) {
        if (!npcs) return;
        const ts = this.tileSize;
        npcs.forEach(npc => {
            const px = npc.x * ts;
            const py = npc.y * ts;

            // 黑色轮廓线让角色更清晰
            ctx.fillStyle = '#000';

            // NPC身体 - 不同类型不同外观
            let bodyColor, headColor = '#FFDAB9';
            switch (npc.type) {
                case 'professor':
                    bodyColor = '#e8e8e8'; // 白大褂
                    // 白大褂身体
                    ctx.fillRect(px + 7, py + 11, 18, 18);
                    ctx.fillStyle = bodyColor;
                    ctx.fillRect(px + 8, py + 12, 16, 16);
                    // 大褂边缘
                    ctx.fillStyle = '#ccc';
                    ctx.fillRect(px + 8, py + 12, 2, 16);
                    ctx.fillRect(px + 22, py + 12, 2, 16);
                    // 纽扣
                    ctx.fillStyle = '#333';
                    ctx.fillRect(px + 15, py + 14, 2, 2);
                    ctx.fillRect(px + 15, py + 18, 2, 2);
                    ctx.fillRect(px + 15, py + 22, 2, 2);
                    break;
                case 'trainer':
                    bodyColor = '#e74c3c'; // 红夹克
                    ctx.fillRect(px + 7, py + 11, 18, 18);
                    ctx.fillStyle = bodyColor;
                    ctx.fillRect(px + 8, py + 12, 16, 16);
                    // 夹克拉链
                    ctx.fillStyle = '#c0392b';
                    ctx.fillRect(px + 15, py + 12, 2, 16);
                    // 领口
                    ctx.fillStyle = '#fff';
                    ctx.fillRect(px + 12, py + 12, 8, 3);
                    break;
                case 'shop':
                    bodyColor = '#3498db'; // 蓝围裙
                    ctx.fillRect(px + 7, py + 11, 18, 18);
                    ctx.fillStyle = '#555';
                    ctx.fillRect(px + 8, py + 12, 16, 8); // 上衣
                    ctx.fillStyle = bodyColor;
                    ctx.fillRect(px + 8, py + 20, 16, 8); // 围裙
                    // 围裙带子
                    ctx.fillStyle = '#2980b9';
                    ctx.fillRect(px + 12, py + 20, 8, 1);
                    break;
                case 'healer':
                    bodyColor = '#ff69b4'; // 粉白护士服
                    ctx.fillRect(px + 7, py + 11, 18, 18);
                    ctx.fillStyle = '#fff';
                    ctx.fillRect(px + 8, py + 12, 16, 16); // 白色护士服
                    ctx.fillStyle = bodyColor;
                    ctx.fillRect(px + 8, py + 12, 2, 16); // 粉色条纹
                    ctx.fillRect(px + 22, py + 12, 2, 16);
                    ctx.fillRect(px + 8, py + 12, 16, 2); // 粉色领口
                    // 护士帽
                    ctx.fillStyle = '#fff';
                    ctx.fillRect(px + 10, py - 1, 12, 4);
                    ctx.fillStyle = '#ff69b4';
                    ctx.fillRect(px + 13, py, 6, 2);
                    break;
                default:
                    bodyColor = '#9b59b6';
                    ctx.fillRect(px + 7, py + 11, 18, 18);
                    ctx.fillStyle = bodyColor;
                    ctx.fillRect(px + 8, py + 12, 16, 16);
            }

            // NPC头（带轮廓）
            ctx.fillStyle = '#000';
            ctx.fillRect(px + 9, py + 1, 14, 14);
            ctx.fillStyle = headColor;
            ctx.fillRect(px + 10, py + 2, 12, 12);

            // 眼睛（更清晰）
            ctx.fillStyle = '#000';
            ctx.fillRect(px + 12, py + 6, 2, 3);
            ctx.fillRect(px + 18, py + 6, 2, 3);
            // 眼白高光
            ctx.fillStyle = '#fff';
            ctx.fillRect(px + 12, py + 6, 1, 1);
            ctx.fillRect(px + 18, py + 6, 1, 1);

            // 教授眼镜
            if (npc.type === 'professor') {
                ctx.fillStyle = '#333';
                ctx.fillRect(px + 10, py + 5, 5, 5);
                ctx.fillRect(px + 17, py + 5, 5, 5);
                ctx.fillRect(px + 15, py + 7, 2, 1);
            }

            // 训练师帽子
            if (npc.type === 'trainer') {
                ctx.fillStyle = '#e74c3c';
                ctx.fillRect(px + 8, py - 2, 16, 4);
                ctx.fillStyle = '#c0392b';
                ctx.fillRect(px + 8, py + 1, 16, 1);
            }

            // 名字标签背景（圆角矩形效果）
            if (npc.name) {
                ctx.fillStyle = 'rgba(0,0,0,0.7)';
                const nameWidth = npc.name.length * 10 + 12;
                const nameH = 14;
                const nameX = px + 16 - nameWidth / 2;
                const nameY = py - 12;
                // 用多个小矩形模拟圆角
                ctx.fillRect(nameX + 2, nameY, nameWidth - 4, nameH);
                ctx.fillRect(nameX, nameY + 2, nameWidth, nameH - 4);
                ctx.fillRect(nameX + 1, nameY + 1, nameWidth - 2, 1);
                ctx.fillRect(nameX + 1, nameY + nameH - 2, nameWidth - 2, 1);
                // 名字文字（10px）
                ctx.fillStyle = '#fff';
                ctx.font = '10px monospace';
                ctx.textAlign = 'center';
                ctx.fillText(npc.name, px + 16, py - 1);
                ctx.textAlign = 'left';
            }
            // 感叹号标记（训练师）
            if (npc.type === 'trainer' && !npc.defeated) {
                ctx.fillStyle = '#FFD700';
                ctx.font = 'bold 16px monospace';
                ctx.fillText('!', px + 14, py - 4);
            }
        });
    }
}

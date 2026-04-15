/**
 * GameManager - 游戏协调器
 * 负责初始化模块、注册场景、驱动主循环
 */
class GameManager {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.W = this.canvas.width;
        this.H = this.canvas.height;

        // 事件总线（必须在其他模块之前创建，因为 BattleEngine 等依赖它）
        this.eventBus = new EventBus();
        window.eventBus = this.eventBus;

        // 核心模块
        this.input = new InputManager(this.canvas);
        this.camera = new Camera(this.W, this.H);
        this.mapManager = new MapManager();
        this.creaturesManager = new CreaturesManager();
        this.ui = new UIManager(this.ctx, this.canvas);
        this.npcManager = new NPCManager();
        this.shopManager = new ShopManager();
        this.saveManager = new SaveManager();
        this.battleManager = new BattleManager(this.ctx, this.canvas, this.creaturesManager, this.ui);

        // 玩家
        this.player = new Player(this.mapManager);

        // 场景管理器
        this.sceneManager = new SceneManager(this);

        // 状态（供 NPC 等模块兼容使用）
        this.state = 'TITLE';
        this.prevState = 'TITLE';
        this.dataLoaded = false;
        this.loading = true;
        this.titleChoiceActive = false;

        // 时间
        this.lastTime = 0;
        this.deltaTime = 0;
    }

    /** 兼容旧代码的状态切换 */
    setState(newState, skipPrevState) {
        if (!skipPrevState) this.prevState = this.state;
        this.state = newState;
    }

    /** 初始化游戏 */
    async init() {
        await this.creaturesManager.loadData();
        await this.mapManager.ready();

        this.dataLoaded = true;
        this.loading = false;

        const startMap = this.mapManager.getCurrentMap();
        if (startMap && startMap.playerStart) {
            this.player.setPosition(startMap.playerStart.x, startMap.playerStart.y);
        }
        this.npcManager.loadNPCs(startMap.npcs);
        this.camera.snapTo(
            this.player.x, this.player.y,
            this.player.width, this.player.height,
            startMap.width * this.mapManager.tileSize,
            startMap.height * this.mapManager.tileSize
        );

        // NPC碰撞检测回调
        this.player.checkNPCCollision = (tileX, tileY) => {
            return this.npcManager.getNPCAt(tileX, tileY) !== null;
        };

        // 注册场景
        this.sceneManager.register('title', new TitleScene(this));
        this.sceneManager.register('explore', new ExploreScene(this));
        this.sceneManager.register('battle', new BattleScene(this));
        this.sceneManager.register('dialog', new DialogScene(this));
        this.sceneManager.register('menu', new MenuScene(this));
        this.sceneManager.register('shop', new ShopScene(this));

        // 切换到标题画面
        this.sceneManager.switchTo('title');

        // 启动游戏循环
        this.lastTime = performance.now();
        this.gameLoop(this.lastTime);
    }

    /** 游戏主循环 */
    gameLoop(timestamp) {
        this.deltaTime = Math.min(timestamp - this.lastTime, 50);
        this.lastTime = timestamp;

        this.update(this.deltaTime);
        this.render();

        this.input.update();
        requestAnimationFrame((t) => this.gameLoop(t));
    }

    /** 更新 */
    update(deltaTime) {
        this.sceneManager.update(deltaTime);
        this.ui.update(deltaTime);
    }

    /** 代理方法：供 NPC 模块调用 */
    startTrainerBattle(npc, trainerParty) {
        const exploreScene = this.sceneManager.scenes.get('explore');
        if (exploreScene) exploreScene.startTrainerBattle(npc, trainerParty);
    }

    openShop() {
        const exploreScene = this.sceneManager.scenes.get('explore');
        if (exploreScene) exploreScene.openShop();
    }

    /** 渲染 */
    render() {
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.W, this.H);
        this.sceneManager.render(ctx);
        this.ui.renderMessage();
    }
}

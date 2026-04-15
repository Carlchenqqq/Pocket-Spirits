/**
 * GameManager - 游戏主循环和状态管理
 * 管理游戏状态机、场景切换、模块协调
 */
class GameManager {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.W = this.canvas.width;
        this.H = this.canvas.height;

        // 游戏状态
        this.state = 'TITLE'; // TITLE, EXPLORE, BATTLE, DIALOG, MENU, SHOP
        this.prevState = 'TITLE';

        // 模块实例
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

        // 时间
        this.lastTime = 0;
        this.deltaTime = 0;

        // 标题画面
        this.titleAlpha = 0;
        this.titleBlink = 0;

        // 数据加载状态
        this.dataLoaded = false;
        this.loading = true;
        this.titleChoiceActive = false;

        // 游戏菜单
        this.gameMenuOpen = false;
        this.gameMenuIndex = 0;
        this.gameMenuItems = ['精灵', '背包', '图鉴', '保存', '读取', '关闭'];

        // 背包模式
        this.bagMode = false;

        // 图鉴模式
        this.dexMode = false;
        this.dexPage = 'creature';
        this.dexScrollIndex = 0;

        // 自动移动
        this.isAutoMoving = false;
        this.moveTarget = null;
    }

    /** 设置游戏状态 */
    setState(newState, skipPrevState) {
        if (!skipPrevState) {
            this.prevState = this.state;
        }
        this.state = newState;
    }

    /** 初始化游戏 */
    async init() {
        // 加载数据
        await this.creaturesManager.loadData();
        
        // 等待地图加载完成
        await this.mapManager.ready();
        
        this.dataLoaded = true;
        this.loading = false;

        // 设置初始玩家位置
        const startMap = this.mapManager.getCurrentMap();
        if (startMap && startMap.playerStart) {
            this.player.setPosition(startMap.playerStart.x, startMap.playerStart.y);
        }

        // 加载NPC
        this.npcManager.loadNPCs(startMap.npcs);

        // 设置摄像机
        this.camera.snapTo(
            this.player.x, this.player.y,
            this.player.width, this.player.height,
            startMap.width * this.mapManager.tileSize,
            startMap.height * this.mapManager.tileSize
        );

        // 设置战斗回调
        this.battleManager.resultCallback = (result) => this._onBattleEnd(result);

        // 设置NPC碰撞检测回调
        this.player.checkNPCCollision = (tileX, tileY) => {
            return this.npcManager.getNPCAt(tileX, tileY) !== null;
        };

        // 开始游戏循环
        this.lastTime = performance.now();
        this.gameLoop(this.lastTime);
    }

    /** 游戏主循环 */
    gameLoop(timestamp) {
        this.deltaTime = Math.min(timestamp - this.lastTime, 50); // 限制最大delta
        this.lastTime = timestamp;

        this.update(this.deltaTime);
        this.render();

        // 帧结束时更新输入状态（保存当前按键为上一帧状态，供下一帧 justPressed 检测）
        this.input.update();

        requestAnimationFrame((t) => this.gameLoop(t));
    }

    /** 更新游戏逻辑 */
    update(deltaTime) {
        const now = performance.now();

        switch (this.state) {
            case 'TITLE':
                this._updateTitle(deltaTime);
                break;
            case 'EXPLORE':
                this._updateExplore(deltaTime, now);
                break;
            case 'BATTLE':
                this.battleManager.update(deltaTime);
                this.battleManager.handleInput(this.input, now);
                break;
            case 'DIALOG':
                this.ui.update(deltaTime);
                // 点击也推进对话
                if (this.input.hasPendingClick()) {
                    this.input.clearClick();
                    // 直接调用 dialogConfirm，不通过键盘模拟
                    if (!this.ui.dialogConfirm()) {
                        // 标题画面存档选择
                        if (this.titleChoiceActive) {
                            this.titleChoiceActive = false;
                            if (this.saveManager.load(this)) {
                                this.ui.showMessage('读取存档成功！');
                            } else {
                                this.ui.showMessage('读取失败，开始新游戏');
                            }
                            this.setState('EXPLORE');
                            return;
                        }
                        if (this.state === 'DIALOG') {
                            this.setState(this.prevState, true);
                        }
                    }
                    return; // 点击已处理，跳过键盘逻辑
                }
                if (this.input.isConfirmPressed(now)) {
                    if (!this.ui.dialogConfirm()) {
                        if (this.titleChoiceActive) {
                            this.titleChoiceActive = false;
                            if (this.saveManager.load(this)) {
                                this.ui.showMessage('读取存档成功！');
                            } else {
                                this.ui.showMessage('读取失败，开始新游戏');
                            }
                            this.setState('EXPLORE');
                            return;
                        }
                        if (this.state === 'DIALOG') {
                            this.input.lastActionTime = now;
                            this.setState(this.prevState, true);
                        }
                    }
                }
                if (this.titleChoiceActive && this.input.isCancelPressed()) {
                    this.titleChoiceActive = false;
                    this.setState('EXPLORE');
                }
                break;
            case 'MENU':
                this._updateMenu(deltaTime, now);
                break;
            case 'SHOP':
                this.shopManager.update(deltaTime);
                this._updateShop(now);
                break;
        }

        // 全局UI更新
        this.ui.update(deltaTime);
    }

    /** 更新标题画面 */
    _updateTitle(deltaTime) {
        this.titleAlpha = Math.min(1, this.titleAlpha + deltaTime * 0.001);
        this.titleBlink += deltaTime;

        // 处理按钮弹框输入
        if (this.ui.buttonDialogActive) {
            this.ui.handleButtonDialogInput(this.input, performance.now());
            return;
        }

        if ((this.input.anyKeyPressed() || this.input.hasPendingClick()) && this.dataLoaded) {
            if (this.input.hasPendingClick()) this.input.clearClick();
            // 检查是否有存档，如果有则显示按钮弹框
            if (this.saveManager.hasSave()) {
                this.ui.showButtonDialog(
                    '检测到存档数据',
                    ['读取存档', '开始新游戏'],
                    (index) => {
                        if (index === 0) {
                            // 读取存档
                            if (this.saveManager.load(this)) {
                                this.ui.showMessage('读取存档成功！');
                            } else {
                                this.ui.showMessage('读取失败，开始新游戏');
                            }
                            this.setState('EXPLORE');
                        } else {
                            // 开始新游戏
                            this.setState('EXPLORE');
                        }
                    }
                );
            } else {
                this.setState('EXPLORE');
            }
        }
    }

    /** 更新探索状态 */
    _updateExplore(deltaTime, now) {
        // 检查游戏菜单
        if (this.gameMenuOpen) {
            this._updateGameMenu(now);
            return;
        }

        // 检查背包
        if (this.bagMode) {
            this._updateBag(now);
            return;
        }

        // 检查图鉴
        if (this.dexMode) {
            this._updateDex(now);
            return;
        }

        // ESC打开菜单
        if (this.input.isCancelPressed()) {
            this.gameMenuOpen = true;
            this.gameMenuIndex = 0;
            return;
        }

        // 点击菜单按钮（☰）- 右下角固定位置（必须在 getClick 之前检查）
        if (this.input.hasPendingClick()) {
            const pendingClick = this.input.peekClick();
            if (pendingClick) {
                const btnX = this.W - 50, btnY = this.H - 40, btnW = 40, btnH = 30;
                if (pendingClick.x >= btnX && pendingClick.x <= btnX + btnW &&
                    pendingClick.y >= btnY && pendingClick.y <= btnY + btnH) {
                    this.input.getClick(); // 消费点击
                    this.gameMenuOpen = true;
                    this.gameMenuIndex = 0;
                    return;
                }
            }
        }

        // 点击移动
        const click = this.input.getClick();
        if (click) {
            // 将点击坐标转换为地图坐标（考虑摄像机偏移）
            const map = this.mapManager.getCurrentMap();
            if (map) {
                const ts = this.mapManager.tileSize;
                const camX = this.camera.x;
                const camY = this.camera.y;
                const clickTileX = Math.floor((click.x + camX) / ts);
                const clickTileY = Math.floor((click.y + camY) / ts);

                // 检查是否点击了自身位置（忽略）
                const dx = clickTileX - this.player.tileX;
                const dy = clickTileY - this.player.tileY;
                const dist = Math.abs(dx) + Math.abs(dy);

                if (dist === 0) return; // 点击自身位置，忽略

                // 检查是否点击了NPC
                const npc = this.npcManager.getNPCAt(clickTileX, clickTileY);
                if (npc) {
                    if (dist === 1) {
                        // 相邻，直接交互
                        this.player.direction = this._getDirectionTo(clickTileX, clickTileY);
                        this._handleInteraction();
                        return;
                    } else if (dist > 1) {
                        // 不相邻，设置移动目标为NPC旁边的格子
                        this._moveTowardsTile(clickTileX, clickTileY);
                        return;
                    }
                }

                // 检查是否点击了相邻格子
                if (dist === 1) {
                    // 点击相邻格子，移动过去
                    const dir = this._getDirectionTo(clickTileX, clickTileY);
                    if (dir) {
                        const moveResult = this.player.tryMove(dir, this.mapManager, this.npcManager);
                        if (moveResult === 'wild_encounter') {
                            this._startWildBattle();
                            return;
                        }
                        if (moveResult === 'transfer') {
                            this._handleTransfer();
                            return;
                        }
                    }
                    return;
                } else if (dist > 1) {
                    // 点击远处，设置路径移动目标
                    this._moveTowardsTile(clickTileX, clickTileY);
                    return;
                }
            }
        }

        // 自动移动（点击远处格子后持续移动）
        if (this.isAutoMoving) {
            // 键盘输入取消自动移动
            const hasKeyInput = this.input.isPressed('ArrowUp') || this.input.isPressed('ArrowDown') ||
                                this.input.isPressed('ArrowLeft') || this.input.isPressed('ArrowRight') ||
                                this.input.isPressed('KeyW') || this.input.isPressed('KeyA') ||
                                this.input.isPressed('KeyS') || this.input.isPressed('KeyD');
            if (hasKeyInput) {
                this.isAutoMoving = false;
                this.moveTarget = null;
            } else {
                this._updateAutoMove();
                // 必须调用 player.update 推进移动动画，否则 moving 永远为 true 导致死循环
                const moveResult = this.player.update(deltaTime, null);
                if (moveResult === 'wild_encounter') {
                    this._startWildBattle();
                    return;
                }
                if (moveResult === 'transfer') {
                    this._handleTransfer();
                    return;
                }
                // 不要 return，让摄像机更新能执行
            }
        }

        // 玩家移动
        const direction = this.input.getDirection(now);
        const moveResult = this.player.update(deltaTime, direction);

        if (moveResult === 'wild_encounter') {
            this._startWildBattle();
            return;
        }

        if (moveResult === 'transfer') {
            this._handleTransfer();
            return;
        }

        // 交互键
        if (this.input.isConfirmPressed(now)) {
            this._handleInteraction();
            return;
        }

        // 更新NPC
        this.npcManager.update(deltaTime);

        // 更新摄像机
        const map = this.mapManager.getCurrentMap();
        if (map) {
            this.camera.follow(
                this.player.x, this.player.y,
                this.player.width, this.player.height,
                map.width * this.mapManager.tileSize,
                map.height * this.mapManager.tileSize
            );
        }
    }

    /** 更新游戏菜单 */
    _updateGameMenu(now) {
        // 点击菜单项
        if (this.input.hasPendingClick()) {
            const click = this.input.getClick();
            if (click) {
                const menuX = 10, menuY = 30;
                const itemStartY = menuY + 30;
                const itemH = 22;
                if (click.x >= menuX && click.x <= menuX + 120 && click.y >= itemStartY && click.y <= itemStartY + this.gameMenuItems.length * itemH) {
                    const clickedIndex = Math.floor((click.y - itemStartY) / itemH);
                    if (clickedIndex >= 0 && clickedIndex < this.gameMenuItems.length) {
                        this.gameMenuIndex = clickedIndex;
                        // 直接执行菜单项
                        switch (this.gameMenuIndex) {
                            case 0: this._openPartyMenu(); break;
                            case 1:
                                this.gameMenuOpen = false;
                                this.bagMode = true;
                                this.ui.bagSelectedIndex = 0;
                                this.ui.showBag(this.creaturesManager.items, this.creaturesManager, (idx) => {});
                                break;
                            case 2:
                                this.dexMode = true;
                                this.dexPage = 'creature';
                                this.dexScrollIndex = 0;
                                this.gameMenuOpen = false;
                                break;
                            case 3:
                                if (this.saveManager.save(this)) {
                                    this.ui.showMessage('游戏已保存！');
                                } else {
                                    this.ui.showMessage('保存失败！');
                                }
                                this.gameMenuOpen = false;
                                break;
                            case 4:
                                if (this.saveManager.hasSave()) {
                                    if (this.saveManager.load(this)) {
                                        this.ui.showMessage('读取存档成功！');
                                    } else {
                                        this.ui.showMessage('读取存档失败！');
                                    }
                                } else {
                                    this.ui.showMessage('没有找到存档');
                                }
                                this.gameMenuOpen = false;
                                break;
                            case 5:
                                this.gameMenuOpen = false;
                                break;
                        }
                        return;
                    }
                } else {
                    // 点击菜单外区域关闭菜单
                    this.gameMenuOpen = false;
                    return;
                }
            }
        }

        if (this.input.isJustPressed('ArrowUp') || this.input.isJustPressed('KeyW')) {
            this.gameMenuIndex = Math.max(0, this.gameMenuIndex - 1);
        }
        if (this.input.isJustPressed('ArrowDown') || this.input.isJustPressed('KeyS')) {
            this.gameMenuIndex = Math.min(this.gameMenuItems.length - 1, this.gameMenuIndex + 1);
        }
        if (this.input.isConfirmPressed(now)) {
            switch (this.gameMenuIndex) {
                case 0: // 精灵
                    this._openPartyMenu();
                    break;
                case 1: // 背包
                    this.gameMenuOpen = false;
                    this.bagMode = true;
                    this.ui.bagSelectedIndex = 0;
                    this.ui.showBag(this.creaturesManager.items, this.creaturesManager, (idx) => {});
                    break;
                case 2: // 图鉴
                    this.dexMode = true;
                    this.dexPage = 'creature'; // creature 或 npc
                    this.dexScrollIndex = 0;
                    this.gameMenuOpen = false;
                    break;
                case 3: // 保存
                    if (this.saveManager.save(this)) {
                        this.ui.showMessage('游戏已保存！');
                    } else {
                        this.ui.showMessage('保存失败！');
                    }
                    this.gameMenuOpen = false;
                    break;
                case 4: // 读取
                    if (this.saveManager.hasSave()) {
                        if (this.saveManager.load(this)) {
                            this.ui.showMessage('读取存档成功！');
                        } else {
                            this.ui.showMessage('读取存档失败！');
                        }
                    } else {
                        this.ui.showMessage('没有找到存档');
                    }
                    this.gameMenuOpen = false;
                    break;
                case 5: // 关闭
                    this.gameMenuOpen = false;
                    break;
            }
        }
        if (this.input.isCancelPressed()) {
            this.gameMenuOpen = false;
        }
    }

    /** 更新背包 */
    _updateBag(now) {
        const items = this.creaturesManager.items;
        // 确保 selectedIndex 不越界
        if (this.ui.bagSelectedIndex >= items.length) {
            this.ui.bagSelectedIndex = Math.max(0, items.length - 1);
        }

        // 二次确认弹框激活时，处理弹框输入
        if (this.ui.buttonDialogActive) {
            this.ui.handleButtonDialogInput(this.input, performance.now());
            return;
        }

        // 点击道具
        if (this.input.hasPendingClick()) {
            const click = this.input.getClick();
            if (click) {
                const boxX = 30, boxY = 20;
                const listStartY = boxY + 35;
                const itemH = 25;
                if (click.x >= boxX && click.x <= boxX + 580 && click.y >= listStartY && click.y <= listStartY + items.length * itemH) {
                    const clickedIndex = Math.floor((click.y - listStartY) / itemH);
                    if (clickedIndex >= 0 && clickedIndex < items.length) {
                        this.ui.bagSelectedIndex = clickedIndex;
                        this._requestUseItem(clickedIndex);
                        return;
                    }
                } else {
                    this.bagMode = false;
                    this.ui.closeBag();
                    return;
                }
            }
        }

        if (this.input.isJustPressed('ArrowUp') || this.input.isJustPressed('KeyW')) {
            this.ui.bagSelectedIndex = Math.max(0, this.ui.bagSelectedIndex - 1);
        }
        if (this.input.isJustPressed('ArrowDown') || this.input.isJustPressed('KeyS')) {
            this.ui.bagSelectedIndex = Math.min(items.length - 1, this.ui.bagSelectedIndex + 1);
        }
        if (this.input.isConfirmPressed(now)) {
            if (items.length > 0) {
                this._requestUseItem(this.ui.bagSelectedIndex);
            }
        }
        if (this.input.isCancelPressed()) {
            this.bagMode = false;
            this.ui.closeBag();
        }
    }

    /** 请求使用道具（弹出二次确认） */
    _requestUseItem(index) {
        const items = this.creaturesManager.items;
        if (index < 0 || index >= items.length) return;
        const item = items[index];
        const data = this.creaturesManager.getItemData(item.itemId);
        if (!data) return;

        if (data.type === 'potion') {
            const target = this.creaturesManager.getFirstAlive();
            if (!target) {
                this.ui.showMessage('没有存活的精灵');
                return;
            }
            if (target.currentHP >= target.maxHP) {
                this.ui.showMessage(`${target.name}已经满血了`);
                return;
            }
            this.ui.showButtonDialog(
                `对 ${target.name} 使用 ${data.name}？`,
                ['确认使用', '取消'],
                (btnIndex) => {
                    if (btnIndex === 0) {
                        this.creaturesManager.useItem(item.itemId);
                        target.currentHP = Math.min(target.maxHP, target.currentHP + data.healAmount);
                        this.ui.showMessage(`${target.name}恢复了${data.healAmount}HP！`);
                    }
                }
            );
        } else {
            this.ui.showMessage('这个道具无法在这里使用');
        }
    }

    /** 打开队伍菜单 */
    _openPartyMenu() {
        this.gameMenuOpen = false;
        this.ui.showCreatureSelect(this.creaturesManager.party, (index) => {
            this.ui.closeCreatureSelect();
            if (index >= 0) {
                const creature = this.creaturesManager.party[index];
                this.ui.showDialog([
                    `${creature.name} Lv.${creature.level}`,
                    `属性: ${creature.type}`,
                    `HP: ${creature.currentHP}/${creature.maxHP}`,
                    `攻击: ${creature.stats.attack} 防御: ${creature.stats.defense}`,
                    `速度: ${creature.stats.speed}`,
                    `经验: ${creature.exp}/${creature.expToNext}`
                ]);
                this.setState('DIALOG');
            }
        });
        this.setState('MENU');
    }

    /** 更新菜单状态（初始精灵选择等） */
    _updateMenu(deltaTime, now) {
        if (this.ui.starterSelectActive) {
            this._updateStarterSelect(now);
        } else if (this.ui.creatureSelectActive) {
            this._updateCreatureSelect(now);
        } else {
            // 没有活跃的子菜单，返回探索
            this.setState('EXPLORE');
        }
    }

    /** 更新初始精灵选择 */
    _updateStarterSelect(now) {
        // 点击选择精灵
        if (this.input.hasPendingClick()) {
            const click = this.input.getClick();
            if (click) {
                const spacing = 190;
                const startX = 45;
                const cardW = 170, cardH = 280;
                const cardY = 70;
                for (let i = 0; i < 3; i++) {
                    const cx = startX + i * spacing;
                    if (click.x >= cx && click.x <= cx + cardW && click.y >= cardY && click.y <= cardY + cardH) {
                        this.ui.starterSelectedIndex = i;
                        if (this.ui.starterCallback) {
                            this.ui.starterCallback(i);
                        }
                        return;
                    }
                }
            }
        }

        if (this.input.isJustPressed('ArrowLeft') || this.input.isJustPressed('KeyA')) {
            this.ui.starterSelectedIndex = Math.max(0, this.ui.starterSelectedIndex - 1);
        }
        if (this.input.isJustPressed('ArrowRight') || this.input.isJustPressed('KeyD')) {
            this.ui.starterSelectedIndex = Math.min(2, this.ui.starterSelectedIndex + 1);
        }
        if (this.input.isConfirmPressed(now)) {
            if (this.ui.starterCallback) {
                this.ui.starterCallback(this.ui.starterSelectedIndex);
            }
        }
    }

    /** 更新精灵选择 */
    _updateCreatureSelect(now) {
        const list = this.ui.creatureSelectList || [];
        
        // 点击选择精灵
        if (this.input.hasPendingClick()) {
            const click = this.input.getClick();
            if (click) {
                const boxX = 30, boxY = 20;
                const listStartY = boxY + 35;
                const itemH = 25;
                if (click.x >= boxX && click.x <= boxX + 580 && click.y >= listStartY && click.y <= listStartY + list.length * itemH) {
                    const clickedIndex = Math.floor((click.y - listStartY) / itemH);
                    if (clickedIndex >= 0 && clickedIndex < list.length) {
                        this.ui.creatureSelectIndex = clickedIndex;
                        if (this.ui.creatureSelectCallback) {
                            this.ui.creatureSelectCallback(clickedIndex);
                        }
                        return;
                    }
                } else {
                    // 点击列表外区域取消
                    if (this.ui.creatureSelectCallback) {
                        this.ui.creatureSelectCallback(-1);
                    }
                    return;
                }
            }
        }

        if (this.input.isJustPressed('ArrowUp') || this.input.isJustPressed('KeyW')) {
            this.ui.creatureSelectIndex = Math.max(0, this.ui.creatureSelectIndex - 1);
        }
        if (this.input.isJustPressed('ArrowDown') || this.input.isJustPressed('KeyS')) {
            this.ui.creatureSelectIndex = Math.min(list.length - 1, this.ui.creatureSelectIndex + 1);
        }
        if (this.input.isConfirmPressed(now)) {
            if (this.ui.creatureSelectCallback) {
                this.ui.creatureSelectCallback(this.ui.creatureSelectIndex);
            }
        }
        if (this.input.isCancelPressed()) {
            if (this.ui.creatureSelectCallback) {
                this.ui.creatureSelectCallback(-1);
            }
        }
    }

    /** 更新商店 */
    _updateShop(now) {
        if (this.input.hasPendingClick()) {
            const click = this.input.getClick();
            if (click) {
                // 如果有二次确认弹框，处理弹框点击
                if (this.shopManager.confirming) {
                    this.shopManager.handleClick(click.x, click.y, this.creaturesManager);
                    return;
                }
                // 检查是否点击了商品区域
                const W = 640, H = 480;
                const listTop = 87, listBottom = 95 + 4 * 50;
                if (click.x >= 20 && click.x <= W - 20 && click.y >= listTop && click.y <= listBottom) {
                    const clickedIndex = Math.floor((click.y - listTop) / 50);
                    if (clickedIndex >= 0 && clickedIndex < this.shopManager.shopItems.length) {
                        this.shopManager.requestBuy(clickedIndex);
                    }
                } else {
                    this.shopManager.close();
                    this.setState('EXPLORE');
                }
                return;
            }
        }

        // 键盘支持（可选）
        if (this.input.isCancelPressed()) {
            if (this.shopManager.confirming) {
                this.shopManager.cancelBuy();
            } else {
                this.shopManager.close();
                this.setState('EXPLORE');
            }
        }
    }

    /** 处理交互 */
    _handleInteraction() {
        const facing = this.player.getFacingTile();
        const npc = this.npcManager.checkFacingNPC(facing);
        if (npc) {
            this.npcManager.interactNPC(npc, this);
        }
    }

    /** 开始野生战斗 */
    _startWildBattle() {
        // 没有精灵时不能战斗
        if (this.creaturesManager.party.length === 0) {
            this.ui.showMessage('没有精灵，快去找精灵博士！');
            return;
        }
        if (this.creaturesManager.isPartyFainted()) {
            this.ui.showMessage('精灵都倒下了...');
            return;
        }

        const map = this.mapManager.getCurrentMap();
        if (!map || !map.wildCreatures) return;

        // 根据权重随机选择精灵
        const totalWeight = map.wildCreatures.reduce((sum, c) => sum + c.weight, 0);
        let rand = Math.random() * totalWeight;
        let selected = map.wildCreatures[0];
        for (const wc of map.wildCreatures) {
            rand -= wc.weight;
            if (rand <= 0) {
                selected = wc;
                break;
            }
        }

        // 随机等级
        const level = selected.minLevel + Math.floor(Math.random() * (selected.maxLevel - selected.minLevel + 1));
        const creature = this.creaturesManager.createCreature(selected.id, level);

        if (creature) {
            // 记录到图鉴
            this.creaturesManager.recordCreatureEncounter(creature.id);
            this.battleManager.startWildBattle(creature);
            this.setState('BATTLE');
        }
    }

    /** 开始训练师战斗 */
    startTrainerBattle(npc, trainerParty) {
        // 记录训练师到图鉴
        this.creaturesManager.recordNPCEncounter(npc.id, npc.name, npc.type);
        // 记录训练师的精灵到图鉴
        trainerParty.forEach(c => this.creaturesManager.recordCreatureEncounter(c.id));
        this.battleManager.startTrainerBattle(npc, trainerParty);
        this.setState('BATTLE');
    }

    /** 打开商店 */
    openShop() {
        this.shopManager.open();
        this.setState('SHOP');
    }

    /** 处理传送 */
    _handleTransfer() {
        const transfer = this.mapManager.checkTransfer(this.player.tileX, this.player.tileY);
        if (!transfer) return;

        // 没有精灵不能离开初始地图
        if (!this.creaturesManager.starterChosen || this.creaturesManager.party.length === 0) {
            this.ui.showDialog(['你还没有选择精灵伙伴！', '请先去找精灵博士。']);
            this.setState('DIALOG');
            // 把玩家推回安全位置
            const map = this.mapManager.getCurrentMap();
            if (map && map.playerStart) {
                this.player.setPosition(map.playerStart.x, map.playerStart.y);
            }
            return;
        }

        // 切换地图
        this.mapManager.switchMap(transfer.targetMap);
        const newMap = this.mapManager.getCurrentMap();

        // 设置玩家位置
        this.player.setPosition(transfer.targetX, transfer.targetY);

        // 加载新地图NPC
        this.npcManager.loadNPCs(newMap.npcs);

        // 立即设置摄像机
        this.camera.snapTo(
            this.player.x, this.player.y,
            this.player.width, this.player.height,
            newMap.width * this.mapManager.tileSize,
            newMap.height * this.mapManager.tileSize
        );

        this.ui.showMessage(`来到了${newMap.name}`);
        // 传送后自动保存
        this.saveManager.save(this);
    }

    /** 战斗结束回调 */
    _onBattleEnd(result) {
        try {
            if (result === 'lose') {
                this.mapManager.switchMap('town1');
                const map = this.mapManager.getCurrentMap();
                this.player.setPosition(map.playerStart.x, map.playerStart.y);
                this.npcManager.loadNPCs(map.npcs);
                this.creaturesManager.healParty();
                this.camera.snapTo(
                    this.player.x, this.player.y,
                    this.player.width, this.player.height,
                    map.width * this.mapManager.tileSize,
                    map.height * this.mapManager.tileSize
                );
                this.ui.showMessage('你的精灵已经恢复了...');
            }

            if (result === 'win' && this.battleManager.battleType === 'trainer' && this.battleManager.trainerNPC) {
                this.npcManager.markTrainerDefeated(this.battleManager.trainerNPC.id);
                if (!this.creaturesManager.defeatedTrainers) {
                    this.creaturesManager.defeatedTrainers = [];
                }
                if (!this.creaturesManager.defeatedTrainers.includes(this.battleManager.trainerNPC.id)) {
                    this.creaturesManager.defeatedTrainers.push(this.battleManager.trainerNPC.id);
                }
            }

            if (result === 'catch_success') {
                this.creaturesManager.recordCreatureCaught(this.battleManager.caughtCreatureId || 0);
            }

            try {
                this.saveManager.save(this);
            } catch (e) {
                console.error('自动保存失败:', e);
            }
        } catch (e) {
            console.error('战斗结束处理异常:', e);
        } finally {
            this.setState('EXPLORE');
        }
    }

    // ==================== 渲染 ====================

    /** 渲染 */
    render() {
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.W, this.H);

        switch (this.state) {
            case 'TITLE':
                this._renderTitle();
                break;
            case 'EXPLORE':
                this._renderExplore();
                this.ui.renderMessage();
                break;
            case 'BATTLE':
                this.battleManager.render();
                break;
            case 'DIALOG':
                this._renderExplore();
                this.ui.renderDialog();
                break;
            case 'MENU':
                this._renderExplore();
                this.ui.renderMenu();
                if (this.ui.starterSelectActive) {
                    this.ui.renderStarterSelect(this.creaturesManager);
                }
                if (this.ui.creatureSelectActive) {
                    this.ui.renderCreatureSelect(this.creaturesManager);
                }
                break;
            case 'SHOP':
                this.shopManager.render(ctx, this.creaturesManager);
                break;
        }

        // 全局UI
        this.ui.renderMessage();
    }

    /** 渲染标题画面 */
    _renderTitle() {
        const ctx = this.ctx;

        // 背景
        const gradient = ctx.createLinearGradient(0, 0, 0, this.H);
        gradient.addColorStop(0, '#1a1a2e');
        gradient.addColorStop(0.5, '#16213e');
        gradient.addColorStop(1, '#0f3460');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, this.W, this.H);

        // 装饰星星
        ctx.fillStyle = '#FFF';
        for (let i = 0; i < 30; i++) {
            const sx = (i * 137 + 50) % this.W;
            const sy = (i * 97 + 30) % this.H;
            const size = (i % 3) + 1;
            ctx.fillRect(sx, sy, size, size);
        }

        // 标题
        ctx.globalAlpha = this.titleAlpha;
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 28px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('精灵纪元', this.W / 2, this.H / 2 - 40);

        ctx.fillStyle = '#FFF';
        ctx.font = '12px monospace';
        ctx.fillText('Pocket Spirits', this.W / 2, this.H / 2 - 15);

        // 闪烁提示
        if (Math.floor(this.titleBlink / 600) % 2 === 0) {
            ctx.fillStyle = '#AAA';
            ctx.font = '11px monospace';
            ctx.fillText('按任意键开始', this.W / 2, this.H / 2 + 40);
        }

        // 版本信息
        ctx.fillStyle = '#666';
        ctx.font = '9px monospace';
        ctx.fillText('v1.0 Demo', this.W / 2, this.H - 15);

        ctx.globalAlpha = 1;
        ctx.textAlign = 'left';

        // 渲染按钮弹框
        this.ui.renderButtonDialog();
    }

    /** 渲染探索场景 */
    _renderExplore() {
        const ctx = this.ctx;
        const map = this.mapManager.getCurrentMap();
        if (!map) return;

        // 应用摄像机
        this.camera.applyTransform(ctx);

        // 渲染地图
        this.mapManager.render(ctx, this.camera);

        // 渲染NPC
        this.mapManager.renderNPCs(ctx, this.npcManager.getNPCs());

        // 渲染玩家
        this.player.render(ctx);

        // 恢复摄像机
        this.camera.restoreTransform(ctx);

        // 渲染HUD
        this.ui.renderHUD(this.creaturesManager, this.mapManager);

        // 渲染游戏菜单
        if (this.gameMenuOpen) {
            this._renderGameMenu();
        }

        // 渲染背包
        if (this.bagMode) {
            this.ui.renderBag(this.creaturesManager);
        }

        // 渲染图鉴
        if (this.dexMode) {
            this._renderDex();
        }
    }

    /** 渲染游戏菜单 */
    _renderGameMenu() {
        const ctx = this.ctx;
        const menuW = 120;
        const menuH = 30 + this.gameMenuItems.length * 22 + 10;
        const menuX = 10;
        const menuY = 30;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        ctx.fillRect(menuX, menuY, menuW, menuH);
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 2;
        ctx.strokeRect(menuX + 1, menuY + 1, menuW - 2, menuH - 2);

        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 11px monospace';
        ctx.fillText('菜单', menuX + 10, menuY + 18);

        ctx.font = '11px monospace';
        this.gameMenuItems.forEach((item, i) => {
            const iy = menuY + 30 + i * 22;
            if (i === this.gameMenuIndex) {
                ctx.fillStyle = 'rgba(255, 215, 0, 0.2)';
                ctx.fillRect(menuX + 4, iy - 10, menuW - 8, 20);
                ctx.fillStyle = '#FFD700';
                ctx.fillText('>', menuX + 8, iy + 2);
            }
            ctx.fillStyle = i === this.gameMenuIndex ? '#FFF' : '#AAA';
            ctx.fillText(item, menuX + 22, iy + 2);
        });
    }

    /** 更新图鉴浏览 */
    _updateDex(now) {
        const cm = this.creaturesManager;
        const dex = this.dexPage === 'creature' ? cm.creatureDex : cm.npcDex;
        const keys = Object.keys(dex);
        const startY = 90;
        const itemH = 55;
        const maxVisible = Math.floor((this.H - startY - 40) / itemH);

        // 点击选择或关闭
        if (this.input.hasPendingClick()) {
            const click = this.input.getClick();
            if (click) {
                // 点击顶部区域切换页面
                if (click.y < 80) {
                    this.dexPage = this.dexPage === 'creature' ? 'npc' : 'creature';
                    this.dexScrollIndex = 0;
                    return;
                }
                // 点击列表区域选择项目
                if (click.y >= startY && click.y < startY + maxVisible * itemH) {
                    const scrollStart = Math.max(0, Math.min(this.dexScrollIndex, keys.length - maxVisible));
                    const clickedIndex = scrollStart + Math.floor((click.y - startY) / itemH);
                    if (clickedIndex >= 0 && clickedIndex < keys.length) {
                        this.dexScrollIndex = clickedIndex;
                    }
                    return;
                }
                // 点击底部区域关闭图鉴
                if (click.y >= startY + maxVisible * itemH) {
                    this.dexMode = false;
                    return;
                }
            }
        }

        if (this.input.isJustPressed('ArrowUp') || this.input.isJustPressed('KeyW')) {
            this.dexScrollIndex = Math.max(0, this.dexScrollIndex - 1);
        }
        if (this.input.isJustPressed('ArrowDown') || this.input.isJustPressed('KeyS')) {
            this.dexScrollIndex = Math.min(keys.length - 1, this.dexScrollIndex + 1);
        }
        // Tab 切换页面
        if (this.input.isJustPressed('Tab') || this.input.isJustPressed('KeyQ')) {
            this.dexPage = this.dexPage === 'creature' ? 'npc' : 'creature';
            this.dexScrollIndex = 0;
        }
        if (this.input.isCancelPressed()) {
            this.dexMode = false;
        }
    }

    /** 渲染图鉴 */
    _renderDex() {
        const ctx = this.ctx;
        const W = this.W, H = this.H;
        const cm = this.creaturesManager;

        // 半透明背景
        ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        ctx.fillRect(0, 0, W, H);

        // 标题
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 20px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('图鉴', W / 2, 30);

        // 统计信息
        const stats = cm.getDexStats();
        ctx.font = '12px monospace';
        ctx.fillStyle = '#AAA';
        ctx.fillText(`精灵: ${stats.encounteredCreatures}/${stats.totalCreatures} 遭遇  ${stats.caughtCreatures} 捕获  |  NPC: ${stats.totalNPCs} 遭遇`, W / 2, 50);

        // Tab 切换提示
        ctx.fillStyle = this.dexPage === 'creature' ? '#FFD700' : '#888';
        ctx.fillText('[Q] 精灵图鉴', W / 4, 70);
        ctx.fillStyle = this.dexPage === 'npc' ? '#FFD700' : '#888';
        ctx.fillText('[Q] NPC图鉴', W * 3 / 4, 70);

        // 列表
        const dex = this.dexPage === 'creature' ? cm.creatureDex : cm.npcDex;
        const keys = Object.keys(dex);
        const startY = 90;
        const itemHeight = 55;
        const maxVisible = Math.floor((H - startY - 40) / itemHeight);

        // 确保滚动索引在可见范围内
        const scrollStart = Math.max(0, this.dexScrollIndex - maxVisible + 1);
        const scrollEnd = Math.min(keys.length, scrollStart + maxVisible);

        for (let i = scrollStart; i < scrollEnd; i++) {
            const entry = dex[keys[i]];
            const y = startY + (i - scrollStart) * itemHeight;
            const isSelected = i === this.dexScrollIndex;

            // 选中高亮
            if (isSelected) {
                ctx.fillStyle = 'rgba(255, 215, 0, 0.15)';
                ctx.fillRect(20, y - 5, W - 40, itemHeight - 5);
                ctx.strokeStyle = 'rgba(255, 215, 0, 0.5)';
                ctx.lineWidth = 1;
                ctx.strokeRect(20, y - 5, W - 40, itemHeight - 5);
            }

            if (this.dexPage === 'creature') {
                // 渲染精灵像素画（小尺寸）
                const creatureId = parseInt(keys[i]);
                if (cm.spriteData[creatureId]) {
                    cm.renderCreature(ctx, 30, y + 2, 40, creatureId);
                }

                // 名称和属性
                ctx.textAlign = 'left';
                ctx.font = 'bold 14px monospace';
                ctx.fillStyle = '#FFF';
                ctx.fillText(entry.name, 80, y + 12);

                // 属性标签
                const typeColors = {
                    fire: '#F44336', water: '#2196F3', grass: '#4CAF50',
                    electric: '#FFC107', rock: '#795548', dark: '#9C27B0',
                    dragon: '#E91E63', normal: '#9E9E9E'
                };
                ctx.fillStyle = typeColors[entry.type] || '#9E9E9E';
                ctx.font = '11px monospace';
                const typeNames = {
                    fire: '火', water: '水', grass: '草', electric: '电',
                    rock: '岩', dark: '暗', dragon: '龙', normal: '普通'
                };
                ctx.fillText(typeNames[entry.type] || entry.type, 80, y + 28);

                // 稀有度
                const rarityNames = { common: '普通', rare: '稀有', legendary: '传说' };
                const rarityColors = { common: '#AAA', rare: '#2196F3', legendary: '#FFD700' };
                ctx.fillStyle = rarityColors[entry.rarity] || '#AAA';
                ctx.fillText(rarityNames[entry.rarity] || entry.rarity, 130, y + 28);

                // 状态
                if (entry.caught) {
                    ctx.fillStyle = '#4CAF50';
                    ctx.font = '11px monospace';
                    ctx.fillText('已捕获', W - 90, y + 12);
                } else {
                    ctx.fillStyle = '#888';
                    ctx.font = '11px monospace';
                    ctx.fillText('已遭遇', W - 90, y + 12);
                }
            } else {
                // NPC 图鉴
                ctx.textAlign = 'left';
                ctx.font = 'bold 14px monospace';
                ctx.fillStyle = '#FFF';
                ctx.fillText(entry.name, 40, y + 15);

                const typeNames = {
                    professor: '教授', trainer: '训练师', shop: '商店', healer: '治疗', dialog: '路人'
                };
                const typeColors = {
                    professor: '#2196F3', trainer: '#F44336', shop: '#FFC107', healer: '#E91E63', dialog: '#9E9E9E'
                };
                ctx.fillStyle = typeColors[entry.type] || '#9E9E9E';
                ctx.font = '12px monospace';
                ctx.fillText(typeNames[entry.type] || entry.type, 40, y + 35);

                ctx.fillStyle = '#4CAF50';
                ctx.font = '11px monospace';
                ctx.fillText('已遭遇', W - 90, y + 20);
            }
        }

        // 空提示
        if (keys.length === 0) {
            ctx.textAlign = 'center';
            ctx.fillStyle = '#666';
            ctx.font = '14px monospace';
            ctx.fillText('还没有记录', W / 2, H / 2);
        }

        // 底部操作提示
        ctx.textAlign = 'center';
        ctx.fillStyle = '#888';
        ctx.font = '12px monospace';
        ctx.fillText('↑↓浏览  Q切换  ESC关闭', W / 2, H - 15);
        ctx.textAlign = 'left';
    }

    /** 获取从玩家到目标格子朝向 */
    _getDirectionTo(tileX, tileY) {
        const dx = tileX - this.player.tileX;
        const dy = tileY - this.player.tileY;
        if (Math.abs(dx) >= Math.abs(dy)) {
            return dx > 0 ? 'right' : 'left';
        } else {
            return dy > 0 ? 'down' : 'up';
        }
    }

    /** 向目标格子移动（简单路径：先水平后垂直） */
    _moveTowardsTile(targetTileX, targetTileY) {
        this.moveTarget = { x: targetTileX, y: targetTileY };
        this.isAutoMoving = true;
    }

    /** 更新自动移动 */
    _updateAutoMove() {
        if (!this.isAutoMoving || !this.moveTarget) return;
        if (this.player.moving) return; // 等待当前移动完成

        const dx = this.moveTarget.x - this.player.tileX;
        const dy = this.moveTarget.y - this.player.tileY;
        const dist = Math.abs(dx) + Math.abs(dy);

        if (dx === 0 && dy === 0) {
            // 到达目标
            this.isAutoMoving = false;
            this.moveTarget = null;
            return;
        }

        // 如果目标有NPC且已相邻，停止移动并交互
        if (dist === 1) {
            const targetNPC = this.npcManager.getNPCAt(this.moveTarget.x, this.moveTarget.y);
            if (targetNPC) {
                this.player.direction = this._getDirectionTo(this.moveTarget.x, this.moveTarget.y);
                this.isAutoMoving = false;
                this.moveTarget = null;
                this._handleInteraction();
                return;
            }
        }

        // 决定下一步方向
        let dir = null;
        if (Math.abs(dx) >= Math.abs(dy)) {
            dir = dx > 0 ? 'right' : 'left';
        } else {
            dir = dy > 0 ? 'down' : 'up';
        }

        // 尝试移动
        const moved = this.player.tryMove(dir, this.mapManager, this.npcManager);
        if (!moved) {
            // 被阻挡，尝试另一个方向
            let altDir = null;
            if (Math.abs(dx) >= Math.abs(dy)) {
                altDir = dy > 0 ? 'down' : (dy < 0 ? 'up' : null);
            } else {
                altDir = dx > 0 ? 'right' : (dx < 0 ? 'left' : null);
            }
            if (altDir) {
                const altMoved = this.player.tryMove(altDir, this.mapManager, this.npcManager);
                if (!altMoved) {
                    // 两个方向都被阻挡，取消自动移动
                    this.isAutoMoving = false;
                    this.moveTarget = null;
                }
            } else {
                // 没有备选方向，取消自动移动
                this.isAutoMoving = false;
                this.moveTarget = null;
            }
        }
    }
}

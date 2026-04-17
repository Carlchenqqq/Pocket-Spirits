/**
 * ExploreScene - 探索场景
 * 游戏核心场景：地图探索、NPC交互、菜单、背包、图鉴
 */
class ExploreScene extends Scene {
    constructor(game) {
        super(game);
        this.id = 'explore';

        // 游戏菜单
        this.gameMenuOpen = false;
        this.gameMenuIndex = 0;
        this.gameMenuItems = ['精灵', '背包', '图鉴', '徽章', '任务', '保存', '读取', '关闭'];

        // 背包模式
        this.bagMode = false;

        // 存档槽选择模式（游戏中保存/读取时选槽）
        this.slotPickerMode = false;   // true 时显示槽位选择面板
        this.slotPickerType = null;    // 'save' | 'load'
        this.slotPickerIndex = 0;      // 当前选中的槽
        this.slotPickerCardRects = []; // 槽位卡片点击区域

        // 图鉴模式
        this.dexMode = false;
        this.dexPage = 'creature';
        this.dexScrollIndex = 0;
        this.dexDetailMode = false; // 精灵详情页
        this.dexDetailId = null;

        // 徽章面板模式
        this.badgeMode = false;
        this.badgeScrollIndex = 0;

        // 任务面板模式
        this.questMode = false;
        this.questScrollIndex = 0;

        // 地图传送面板模式
        this.mapPanelMode = false;
        this.mapPanelIndex = 0;
        this._worldMapCache = null; // 世界地图缩略图缓存

        // 自动移动
        this.isAutoMoving = false;
        this.moveTarget = null;
    }

    onEnter(params) {
        const g = this.game;
        // 设置摄像机
        const map = g.mapManager.getCurrentMap();
        if (map) {
            g.camera.snapTo(
                g.player.x, g.player.y,
                g.player.width, g.player.height,
                map.width * g.mapManager.tileSize,
                map.height * g.mapManager.tileSize
            );
        }
    }

    onPause() {
        this.gameMenuOpen = false;
        this.bagMode = false;
        this.dexMode = false;
        this.badgeMode = false;
        this.questMode = false;
        this.mapPanelMode = false;
        this.isAutoMoving = false;
        this.moveTarget = null;
    }

    update(deltaTime) {
        const g = this.game;
        const now = performance.now();

        // 子面板优先处理
        if (this.gameMenuOpen) {
            this._updateGameMenu(now);
            return;
        }
        if (this.bagMode) {
            this._updateBag(now);
            return;
        }
        if (this.dexMode) {
            this._updateDex(now);
            return;
        }
        if (this.badgeMode) {
            this._updateBadgePanel(now);
            return;
        }
        if (this.questMode) {
            this._updateQuestPanel(now);
            return;
        }
        if (this.mapPanelMode) {
            this._updateMapPanel(now);
            return;
        }
        if (this.slotPickerMode) {
            this._updateSlotPicker(now);
            return;
        }

        // ESC或点击菜单按钮打开菜单
        if (g.input.isCancelPressed()) {
            this.gameMenuOpen = true;
            this.gameMenuIndex = 0;
            return;
        }
        if (g.input.hasPendingClick()) {
            const pendingClick = g.input.peekClick();
            if (pendingClick) {
                const btnX = g.W - 50, btnY = g.H - 40, btnW = 40, btnH = 30;
                if (pendingClick.x >= btnX && pendingClick.x <= btnX + btnW &&
                    pendingClick.y >= btnY && pendingClick.y <= btnY + btnH) {
                    g.input.getClick();
                    this.gameMenuOpen = true;
                    this.gameMenuIndex = 0;
                    return;
                }
                // 地图按钮（左下角）
                const mapBtnX = 8, mapBtnY = g.H - 40, mapBtnW = 40, mapBtnH = 30;
                if (pendingClick.x >= mapBtnX && pendingClick.x <= mapBtnX + mapBtnW &&
                    pendingClick.y >= mapBtnY && pendingClick.y <= mapBtnY + mapBtnH) {
                    g.input.getClick();
                    this.mapPanelMode = true;
                    this.mapPanelIndex = 0;
                    return;
                }
            }
        }

        // 点击移动（适配 camera zoom）
        const click = g.input.getClick();
        if (click) {
            const map = g.mapManager.getCurrentMap();
            if (map) {
                const ts = g.mapManager.tileSize;
                const zoom = g.camera.zoom;
                // 屏幕坐标 → 世界坐标（考虑 zoom 缩放）
                const worldClickX = click.x / zoom + g.camera.x;
                const worldClickY = click.y / zoom + g.camera.y;
                const clickTileX = Math.floor(worldClickX / ts);
                const clickTileY = Math.floor(worldClickY / ts);
                const dx = clickTileX - g.player.tileX;
                const dy = clickTileY - g.player.tileY;
                const dist = Math.abs(dx) + Math.abs(dy);

                if (dist === 0) return;

                // 点击NPC
                const npc = g.npcManager.getNPCAt(clickTileX, clickTileY);
                if (npc) {
                    if (dist === 1) {
                        g.player.direction = this._getDirectionTo(clickTileX, clickTileY);
                        this._handleInteraction();
                        return;
                    } else if (dist > 1) {
                        this._moveTowardsTile(clickTileX, clickTileY);
                        return;
                    }
                }

                if (dist === 1) {
                    const dir = this._getDirectionTo(clickTileX, clickTileY);
                    if (dir) {
                        const moveResult = g.player.tryMove(dir, g.mapManager, g.npcManager);
                        if (moveResult === 'wild_encounter') { this._startWildBattle(); return; }
                        if (moveResult === 'transfer') { this._handleTransfer(); return; }
                    }
                    return;
                } else if (dist > 1) {
                    this._moveTowardsTile(clickTileX, clickTileY);
                    return;
                }
            }
        }

        // 自动移动
        if (this.isAutoMoving) {
            const hasKeyInput = g.input.isPressed('ArrowUp') || g.input.isPressed('ArrowDown') ||
                                g.input.isPressed('ArrowLeft') || g.input.isPressed('ArrowRight') ||
                                g.input.isPressed('KeyW') || g.input.isPressed('KeyA') ||
                                g.input.isPressed('KeyS') || g.input.isPressed('KeyD');
            if (hasKeyInput) {
                this.isAutoMoving = false;
                this.moveTarget = null;
            } else {
                this._updateAutoMove();
                const moveResult = g.player.update(deltaTime, null);
                if (moveResult === 'wild_encounter') { this._startWildBattle(); return; }
                if (moveResult === 'transfer') { this._handleTransfer(); return; }
            }
        }

        // 玩家移动
        const direction = g.input.getDirection(now);
        const moveResult = g.player.update(deltaTime, direction);
        if (moveResult === 'wild_encounter') { this._startWildBattle(); return; }
        if (moveResult === 'transfer') { this._handleTransfer(); return; }

        // 交互键
        if (g.input.isConfirmPressed(now)) {
            this._handleInteraction();
            return;
        }

        // 更新NPC
        g.npcManager.update(deltaTime);

        // 更新摄像机
        const map = g.mapManager.getCurrentMap();
        if (map) {
            g.camera.follow(
                g.player.x, g.player.y,
                g.player.width, g.player.height,
                map.width * g.mapManager.tileSize,
                map.height * g.mapManager.tileSize
            );
        }
    }

    render(ctx) {
        const g = this.game;
        const map = g.mapManager.getCurrentMap();
        if (!map) return;

        // 自动缩放：让地图铺满画布（类似星露谷物语）
        const mapPxW = map.width * g.mapManager.tileSize;
        const mapPxH = map.height * g.mapManager.tileSize;
        g.camera.setAutoZoom(mapPxW, mapPxH);

        g.camera.applyTransform(ctx);
        g.mapManager.render(ctx, g.camera);
        g.mapManager.renderNPCs(ctx, g.npcManager.getNPCs());
        g.player.render(ctx);
        g.camera.restoreTransform(ctx);

        g.ui.renderHUD(g.creaturesManager, g.mapManager);

        if (this.gameMenuOpen) this._renderGameMenu();
        if (this.bagMode) { g.ui.renderBag(g.creaturesManager); g.ui.renderButtonDialog(); }
        if (this.dexMode) this._renderDex();
        if (this.badgeMode) this._renderBadgePanel();
        if (this.questMode) this._renderQuestPanel();
        if (this.mapPanelMode) this._renderMapPanel();
        if (this.slotPickerMode) this._renderSlotPicker();
    }

    // ========== 游戏菜单 ==========
    _updateGameMenu(now) {
        const g = this.game;

        // 共享常量：与 _renderGameMenu 保持一致！
        const MENU_X = 10, MENU_Y = 30;
        const ITEM_START_Y = MENU_Y + 30;  // 标题下方开始
        const ITEM_H = 22;                 // 与渲染 forEach 的 i * 22 一致

        // 先处理键盘导航（更新高亮）
        if (g.input.isJustPressed('ArrowUp') || g.input.isJustPressed('KeyW')) {
            this.gameMenuIndex = Math.max(0, this.gameMenuIndex - 1);
            g.input.lastActionTime = now;
        }
        if (g.input.isJustPressed('ArrowDown') || g.input.isJustPressed('KeyS')) {
            this.gameMenuIndex = Math.min(this.gameMenuItems.length - 1, this.gameMenuIndex + 1);
            g.input.lastActionTime = now;
        }

        // 再处理点击（用与渲染相同的坐标）
        if (g.input.hasPendingClick()) {
            const click = g.input.getClick();
            if (click) {
                // 检测区与渲染高亮条对齐（高亮条从 iy-10 到 iy+10）
                const DETECT_Y = ITEM_START_Y - 10;
                if (click.x >= MENU_X && click.x <= MENU_X + 120 &&
                    click.y >= DETECT_Y && click.y < DETECT_Y + this.gameMenuItems.length * ITEM_H) {
                    const idx = Math.floor((click.y - DETECT_Y) / ITEM_H);
                    if (idx >= 0 && idx < this.gameMenuItems.length) {
                        // 直接用点击位置确定的 idx，不用 gameMenuIndex
                        this._executeMenuItem(idx);
                        return;
                    }
                } else {
                    this.gameMenuOpen = false;
                    return;
                }
            }
        }
        
        if (g.input.isConfirmPressed(now)) this._executeMenuItem(this.gameMenuIndex);
        if (g.input.isCancelPressed()) this.gameMenuOpen = false;
    }

    _executeMenuItem(index) {
        const g = this.game;
        switch (index) {
            case 0:
                this._openPartyMenu();
                break;
            case 1:
                this.gameMenuOpen = false;
                this.bagMode = true;
                this.dexMode = false;
                g.ui.bagSelectedIndex = 0;
                g.ui.showBag(g.creaturesManager.items, g.creaturesManager, () => {});
                break;
            case 2:
                this.gameMenuOpen = false;
                this.bagMode = false;
                this.dexMode = true;
                this.dexPage = 'creature';
                this.dexScrollIndex = 0;
                break;
            case 3: // 徽章
                this.gameMenuOpen = false;
                this.badgeMode = true;
                this.badgeScrollIndex = 0;
                break;
            case 4: // 任务
                this.gameMenuOpen = false;
                this.questMode = true;
                this.questScrollIndex = 0;
                break;
            case 5: // 保存 → 打开槽选择面板
                this.slotPickerMode = true;
                this.slotPickerType = 'save';
                this.slotPickerIndex = 0;
                this.gameMenuOpen = false;
                break;
            case 6: // 读取 → 打开槽选择面板
                this.slotPickerMode = true;
                this.slotPickerType = 'load';
                this.slotPickerIndex = 0;
                this.gameMenuOpen = false;
                break;
            case 7: // 关闭
                this.gameMenuOpen = false;
                break;
        }
    }

    _renderGameMenu() {
        const ctx = this.game.ctx;
        // 与 _updateGameMenu 共享的常量
        const MENU_X = 10, MENU_Y = 30;
        const ITEM_START_Y = MENU_Y + 30, ITEM_H = 22;
        const menuW = 120, menuH = ITEM_START_Y + this.gameMenuItems.length * ITEM_H + 10 - MENU_Y;
        ctx.fillStyle = 'rgba(0,0,0,0.85)';
        ctx.fillRect(MENU_X, MENU_Y, menuW, menuH);
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 2;
        ctx.strokeRect(MENU_X + 1, MENU_Y + 1, menuW - 2, menuH - 2);
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 11px monospace';
        ctx.fillText('菜单', MENU_X + 10, MENU_Y + 18);
        ctx.font = '11px monospace';
        this.gameMenuItems.forEach((item, i) => {
            const iy = ITEM_START_Y + i * ITEM_H;
            if (i === this.gameMenuIndex) {
                ctx.fillStyle = 'rgba(255,215,0,0.2)';
                ctx.fillRect(MENU_X + 4, iy - 10, menuW - 8, 20);
                ctx.fillStyle = '#FFD700';
                ctx.fillText('>', MENU_X + 8, iy + 2);
            }
            ctx.fillStyle = i === this.gameMenuIndex ? '#FFF' : '#AAA';
            ctx.fillText(item, MENU_X + 22, iy + 2);
        });
    }

    // ========== 背包 ==========
    _updateBag(now) {
        const g = this.game;
        const items = g.creaturesManager.items;
        if (g.ui.bagSelectedIndex >= items.length) g.ui.bagSelectedIndex = Math.max(0, items.length - 1);

        if (g.ui.buttonDialogActive) { g.ui.handleButtonDialogInput(g.input, performance.now()); return; }

        if (g.input.hasPendingClick()) {
            const click = g.input.getClick();
            if (click) {
                // 返回按钮检测
                const boxX = 30, boxY = 20, boxW = g.W - 60;
                const backBtnW = 50, backBtnH = 22;
                const backBtnX = boxX + boxW - backBtnW - 8;
                const backBtnY = boxY + 6;
                if (click.x >= backBtnX && click.x <= backBtnX + backBtnW &&
                    click.y >= backBtnY && click.y <= backBtnY + backBtnH) {
                    this.bagMode = false; g.ui.closeBag(); return;
                }
                // 道具列表点击
                const listStartY = boxY + 35, itemH = 25;
                if (click.x >= boxX && click.x <= boxX + boxW && click.y >= listStartY && click.y <= listStartY + items.length * itemH) {
                    const idx = Math.floor((click.y - listStartY) / itemH);
                    if (idx >= 0 && idx < items.length) { g.ui.bagSelectedIndex = idx; this._requestUseItem(idx); return; }
                } else { this.bagMode = false; g.ui.closeBag(); return; }
            }
        }
        if (g.input.isJustPressed('ArrowUp') || g.input.isJustPressed('KeyW')) g.ui.bagSelectedIndex = Math.max(0, g.ui.bagSelectedIndex - 1);
        if (g.input.isJustPressed('ArrowDown') || g.input.isJustPressed('KeyS')) g.ui.bagSelectedIndex = Math.min(items.length - 1, g.ui.bagSelectedIndex);
        if (g.input.isConfirmPressed(now) && items.length > 0) this._requestUseItem(g.ui.bagSelectedIndex);
        if (g.input.isCancelPressed()) { this.bagMode = false; g.ui.closeBag(); }
    }

    _requestUseItem(index) {
        const g = this.game;
        const items = g.creaturesManager.items;
        if (index < 0 || index >= items.length) return;
        const item = items[index];
        const data = g.creaturesManager.getItemData(item.itemId);
        if (!data) { return; }

        // V1: 扩展物品使用逻辑，支持所有新类型
        switch (data.type || data.category) {
            case 'potion':
            case 'medicine': {
                // 回血类物品（含全回复药）
                const target = g.creaturesManager.getFirstAlive();
                if (!target) { g.ui.showMessage('没有存活的精灵'); return; }
                if (target.currentHP >= target.maxHP) { g.ui.showMessage(`${target.name}已经满血了`); return; }
                const healAmount = data.healAmount || 20;
                g.ui.showButtonDialog(`对 ${target.name} 使用 ${data.name}？`, ['确认使用', '取消'], (btnIndex) => {
                    if (btnIndex === 0) {
                        g.creaturesManager.useItem(item.itemId);
                        target.currentHP = Math.min(target.maxHP, target.currentHP + healAmount);
                        g.ui.showMessage(`${target.name}恢复了${healAmount}HP！`);
                    }
                });
                break;
            }

            case 'full_heal': {
                // 完全体力回复
                const target = g.creaturesManager.getFirstAlive();
                if (!target) { g.ui.showMessage('没有存活的精灵'); return; }
                g.ui.showButtonDialog(`对 ${target.name} 使用 ${data.name}？(完全恢复HP)`, ['确认使用', '取消'], (btnIndex) => {
                    if (btnIndex === 0) {
                        g.creaturesManager.useItem(item.itemId);
                        target.currentHP = target.maxHP;
                        g.ui.showMessage(`${target.name}完全恢复了体力！`);
                    }
                });
                break;
            }

            case 'status_cure': {
                // 状态恢复类（解毒/解麻痹/解烧伤等）
                const target = g.creaturesManager.getFirstAlive();
                if (!target) { g.ui.showMessage('没有存活的精灵'); return; }
                const statusName = { poison: '中毒', paralyze: '麻痹', burn: '烧伤', freeze: '冰冻', sleep: '睡眠' };
                const currentStatus = target.status;
                if (!currentStatus) { g.ui.showMessage(`${target.name}没有任何异常状态`); return; }
                g.ui.showButtonDialog(`用${data.name}解除${target.name}的${statusName[currentStatus]||currentStatus}？`, ['确认使用', '取消'], (btnIndex) => {
                    if (btnIndex === 0) {
                        g.creaturesManager.useItem(item.itemId);
                        target.status = null;
                        g.ui.showMessage(`${target.name}的${statusName[currentStatus]||currentStatus}被治愈了！`);
                    }
                });
                break;
            }

            case 'boost': {
                // 能力提升类（战斗中临时提升属性）
                const target = g.creaturesManager.getFirstAlive();
                if (!target) { g.ui.showMessage('没有存活的精灵'); return; }
                const boostType = data.boostType || 'attack';   // attack/defense/speed
                const boostLabel = { attack: '攻击力', defense: '防御力', speed: '速度' }[boostType] || boostType;
                g.ui.showButtonDialog(`给 ${target.name} 使用 ${data.name}？(+${boostLabel})`, ['确认使用', '取消'], (btnIndex) => {
                    if (btnIndex === 0) {
                        g.creaturesManager.useItem(item.itemId);
                        target.statModifiers[boostType] = Math.min(6, (target.statModifiers[boostType]||0) + (data.boostValue||1));
                        g.ui.showMessage(`${target.name}的${boostLabel}提升了！`);
                    }
                });
                break;
            }

            case 'ball':
            case 'key_item':
                g.ui.showMessage(`${data.name}无法在这里使用（战斗中使用）`);
                break;

            default:
                g.ui.showMessage('这个道具无法在这里使用');
        }
    }

    // ========== 图鉴 ==========
    _updateDex(now) {
        const g = this.game;
        const cm = g.creaturesManager;

        // 详情页模式
        if (this.dexDetailMode) {
            if (g.input.isCancelPressed() || g.input.isJustPressed('Escape')) {
                this.dexDetailMode = false;
                this.dexDetailId = null;
            }
            return;
        }

        // 精灵图鉴：展示全部精灵（含未发现的占位）
        const allKeys = this.dexPage === 'creature'
            ? cm.creaturesData.map(c => c.id)
            : Object.keys(cm.npcDex);
        const dex = this.dexPage === 'creature' ? cm.creatureDex : cm.npcDex;
        const keys = this.dexPage === 'creature' ? allKeys : Object.keys(dex);
        const startY = 90, itemH = 55;
        const maxVisible = Math.floor((g.H - startY - 40) / itemH);

        if (g.input.hasPendingClick()) {
            const click = g.input.getClick();
            if (click) {
                // 返回按钮
                const backBtnW = 50, backBtnH = 22;
                const backBtnX = g.W - backBtnW - 10, backBtnY = 8;
                if (click.x >= backBtnX && click.x <= backBtnX + backBtnW &&
                    click.y >= backBtnY && click.y <= backBtnY + backBtnH) { this.dexMode = false; return; }
                // Tab 切换页签
                if (click.y < 80) { this.dexPage = this.dexPage === 'creature' ? 'npc' : 'creature'; this.dexScrollIndex = 0; return; }
                // 列表项
                if (click.y >= startY && click.y < startY + maxVisible * itemH) {
                    const scrollStart = Math.max(0, Math.min(this.dexScrollIndex, keys.length - maxVisible));
                    const idx = scrollStart + Math.floor((click.y - startY) / itemH);
                    if (idx >= 0 && idx < keys.length) {
                        this.dexScrollIndex = idx;
                        // 双击或点击已发现精灵进入详情
                        if (this.dexPage === 'creature') {
                            const cId = keys[idx];
                            if (cm.creatureDex[cId] && cm.creatureDex[cId].encountered) {
                                this.dexDetailMode = true;
                                this.dexDetailId = cId;
                                return;
                            }
                        }
                    }
                    return;
                }
            }
        }
        if (g.input.isJustPressed('ArrowUp') || g.input.isJustPressed('KeyW')) this.dexScrollIndex = Math.max(0, this.dexScrollIndex - 1);
        if (g.input.isJustPressed('ArrowDown') || g.input.isJustPressed('KeyS')) this.dexScrollIndex = Math.min(keys.length - 1, this.dexScrollIndex + 1);
        // 确认键进入详情
        if (g.input.isConfirmPressed(now) && this.dexPage === 'creature') {
            const cId = keys[this.dexScrollIndex];
            if (cm.creatureDex[cId] && cm.creatureDex[cId].encountered) {
                this.dexDetailMode = true;
                this.dexDetailId = cId;
            }
        }
        if (g.input.isJustPressed('Tab') || g.input.isJustPressed('KeyQ')) { this.dexPage = this.dexPage === 'creature' ? 'npc' : 'creature'; this.dexScrollIndex = 0; }
        if (g.input.isCancelPressed()) this.dexMode = false;
    }

    _renderDex() {
        const ctx = this.game.ctx;
        const W = this.game.W, H = this.game.H;
        const cm = this.game.creaturesManager;

        // 详情页渲染
        if (this.dexDetailMode && this.dexDetailId != null) {
            this._renderDexDetail();
            return;
        }

        ctx.fillStyle = 'rgba(0,0,0,0.85)';
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 20px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('图鉴', W / 2, 30);

        // 返回按钮
        const backBtnW = 50, backBtnH = 22;
        const backBtnX = W - backBtnW - 10, backBtnY = 8;
        ctx.fillStyle = 'rgba(255, 215, 0, 0.15)';
        ctx.fillRect(backBtnX, backBtnY, backBtnW, backBtnH);
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 1;
        ctx.strokeRect(backBtnX, backBtnY, backBtnW, backBtnH);
        ctx.fillStyle = '#FFD700';
        ctx.font = '12px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('← 返回', backBtnX + backBtnW / 2, backBtnY + 15);
        ctx.textAlign = 'left';

        const stats = cm.getDexStats();
        ctx.font = '12px monospace';
        ctx.fillStyle = '#AAA';
        ctx.textAlign = 'center';
        ctx.fillText(`精灵: ${stats.encounteredCreatures}/${stats.totalCreatures} 遭遇  ${stats.caughtCreatures} 捕获  |  NPC: ${stats.totalNPCs} 遭遇`, W / 2, 50);

        ctx.fillStyle = this.dexPage === 'creature' ? '#FFD700' : '#888';
        ctx.fillText('[Q] 精灵图鉴', W / 4, 70);
        ctx.fillStyle = this.dexPage === 'npc' ? '#FFD700' : '#888';
        ctx.fillText('[Q] NPC图鉴', W * 3 / 4, 70);
        ctx.textAlign = 'left';

        // 精灵图鉴：展示全部精灵（未发现的显示 ??? 占位）
        const allCreatureIds = cm.creaturesData.map(c => c.id);
        const dex = this.dexPage === 'creature' ? cm.creatureDex : cm.npcDex;
        const keys = this.dexPage === 'creature' ? allCreatureIds : Object.keys(dex);
        const startY = 90, itemHeight = 55;
        const maxVisible = Math.floor((H - startY - 40) / itemHeight);
        const scrollStart = Math.max(0, Math.min(this.dexScrollIndex, keys.length - maxVisible));
        const scrollEnd = Math.min(keys.length, scrollStart + maxVisible);

        for (let i = scrollStart; i < scrollEnd; i++) {
            const y = startY + (i - scrollStart) * itemHeight;
            const isSelected = i === this.dexScrollIndex;
            if (isSelected) {
                ctx.fillStyle = 'rgba(255,215,0,0.15)';
                ctx.fillRect(20, y - 5, W - 40, itemHeight - 5);
                ctx.strokeStyle = 'rgba(255,215,0,0.5)';
                ctx.lineWidth = 1;
                ctx.strokeRect(20, y - 5, W - 40, itemHeight - 5);
            }
            if (this.dexPage === 'creature') {
                const cId = keys[i];
                const entry = cm.creatureDex[cId];
                if (entry && entry.encountered) {
                    // 已发现：正常显示
                    if (cm.spriteData[cId]) cm.renderCreature(ctx, 30, y + 2, 40, cId);
                    ctx.textAlign = 'left';
                    ctx.font = 'bold 14px monospace';
                    ctx.fillStyle = '#FFF';
                    ctx.fillText(`#${cId} ${entry.name}`, 80, y + 12);
                    const typeColors = { fire:'#F44336', water:'#2196F3', grass:'#4CAF50', electric:'#FFC107', rock:'#795548', dark:'#9C27B0', dragon:'#E91E63', normal:'#9E9E9E' };
                    const typeNames = { fire:'火', water:'水', grass:'草', electric:'电', rock:'岩', dark:'暗', dragon:'龙', normal:'普通' };
                    ctx.fillStyle = typeColors[entry.type] || '#9E9E9E';
                    ctx.font = '11px monospace';
                    ctx.fillText(typeNames[entry.type] || entry.type, 80, y + 28);
                    const rarityNames = { common:'普通', rare:'稀有', legendary:'传说' };
                    const rarityColors = { common:'#AAA', rare:'#2196F3', legendary:'#FFD700' };
                    ctx.fillStyle = rarityColors[entry.rarity] || '#AAA';
                    ctx.fillText(rarityNames[entry.rarity] || entry.rarity, 130, y + 28);
                    ctx.fillStyle = entry.caught ? '#4CAF50' : '#888';
                    ctx.font = '11px monospace';
                    ctx.fillText(entry.caught ? '已捕获' : '已遭遇', W - 90, y + 12);
                } else {
                    // 未发现：占位显示
                    ctx.textAlign = 'left';
                    ctx.font = 'bold 14px monospace';
                    ctx.fillStyle = '#444';
                    ctx.fillText(`#${cId} ???`, 80, y + 12);
                    ctx.font = '11px monospace';
                    ctx.fillStyle = '#333';
                    ctx.fillText('未发现', 80, y + 28);
                    // 占位图标
                    ctx.fillStyle = '#222';
                    ctx.fillRect(30, y + 2, 40, 40);
                    ctx.fillStyle = '#444';
                    ctx.font = '18px monospace';
                    ctx.textAlign = 'center';
                    ctx.fillText('?', 50, y + 30);
                    ctx.textAlign = 'left';
                }
            } else {
                const entry = dex[keys[i]];
                ctx.textAlign = 'left';
                ctx.font = 'bold 14px monospace';
                ctx.fillStyle = '#FFF';
                ctx.fillText(entry.name, 40, y + 15);
                const typeNames = { professor:'教授', trainer:'训练师', shop:'商店', healer:'治疗', dialog:'路人' };
                const typeColors = { professor:'#2196F3', trainer:'#F44336', shop:'#FFC107', healer:'#E91E63', dialog:'#9E9E9E' };
                ctx.fillStyle = typeColors[entry.type] || '#9E9E9E';
                ctx.font = '12px monospace';
                ctx.fillText(typeNames[entry.type] || entry.type, 40, y + 35);
                ctx.fillStyle = '#4CAF50';
                ctx.font = '11px monospace';
                ctx.fillText('已遭遇', W - 90, y + 20);
            }
        }
        if (keys.length === 0) { ctx.textAlign = 'center'; ctx.fillStyle = '#666'; ctx.font = '14px monospace'; ctx.fillText('还没有记录', W / 2, H / 2); }
        ctx.textAlign = 'center';
        ctx.fillStyle = '#888';
        ctx.font = '12px monospace';
        const hintText = this.dexPage === 'creature' ? '↑↓浏览  确认查看详情  Q切换  ESC关闭' : '↑↓浏览  Q切换  ESC关闭';
        ctx.fillText(hintText, W / 2, H - 15);
        ctx.textAlign = 'left';
    }

    _renderDexDetail() {
        const ctx = this.game.ctx;
        const W = this.game.W, H = this.game.H;
        const cm = this.game.creaturesManager;
        const entry = cm.creatureDex[this.dexDetailId];
        const cData = cm.creaturesData.find(c => c.id === this.dexDetailId);

        ctx.fillStyle = 'rgba(0,0,0,0.92)';
        ctx.fillRect(0, 0, W, H);

        if (!entry || !cData) {
            ctx.textAlign = 'center'; ctx.fillStyle = '#666'; ctx.font = '14px monospace';
            ctx.fillText('没有数据', W / 2, H / 2);
            ctx.fillStyle = '#888'; ctx.font = '12px monospace';
            ctx.fillText('ESC返回', W / 2, H / 2 + 30);
            ctx.textAlign = 'left';
            return;
        }

        // 返回提示
        ctx.fillStyle = '#888'; ctx.font = '11px monospace';
        ctx.fillText('ESC ← 返回', 15, 18);

        // 精灵大图
        if (cm.spriteData[this.dexDetailId]) {
            cm.renderCreature(ctx, W / 2 - 50, 40, 100, this.dexDetailId);
        }

        // 名称 + 编号
        ctx.textAlign = 'center';
        ctx.fillStyle = '#FFD700'; ctx.font = 'bold 18px monospace';
        ctx.fillText(`#${this.dexDetailId} ${entry.name}`, W / 2, 160);

        // 属性标签
        const typeColors = { fire:'#F44336', water:'#2196F3', grass:'#4CAF50', electric:'#FFC107', rock:'#795548', dark:'#9C27B0', dragon:'#E91E63', normal:'#9E9E9E' };
        const typeNames = { fire:'火', water:'水', grass:'草', electric:'电', rock:'岩', dark:'暗', dragon:'龙', normal:'普通' };
        const rarityNames = { common:'普通', rare:'稀有', legendary:'传说' };
        const rarityColors = { common:'#AAA', rare:'#2196F3', legendary:'#FFD700' };

        ctx.fillStyle = typeColors[entry.type] || '#9E9E9E'; ctx.font = '14px monospace';
        ctx.fillText(`属性: ${typeNames[entry.type] || entry.type}`, W / 2, 185);
        ctx.fillStyle = rarityColors[entry.rarity] || '#AAA';
        ctx.fillText(`稀有度: ${rarityNames[entry.rarity] || entry.rarity}`, W / 2, 205);
        ctx.fillStyle = entry.caught ? '#4CAF50' : '#888';
        ctx.fillText(entry.caught ? '已捕获' : '已遭遇', W / 2, 225);

        // 如果已捕获，显示种族值
        if (entry.caught && cData.baseStats) {
            ctx.textAlign = 'left';
            const bx = W / 2 - 80, by = 250;
            ctx.fillStyle = '#FFD700'; ctx.font = 'bold 13px monospace';
            ctx.fillText('种族值', bx, by);
            ctx.font = '12px monospace';
            const stats = cData.baseStats;
            const statLabels = { hp:'HP', attack:'攻击', defense:'防御', speed:'速度' };
            const statColors = { hp:'#4CAF50', attack:'#F44336', defense:'#2196F3', speed:'#FFC107' };
            let sy = by + 22;
            for (const [key, label] of Object.entries(statLabels)) {
                const val = stats[key] || 0;
                ctx.fillStyle = '#888';
                ctx.fillText(label, bx, sy);
                // 数值条
                ctx.fillStyle = '#333';
                ctx.fillRect(bx + 45, sy - 10, 120, 10);
                ctx.fillStyle = statColors[key] || '#9E9E9E';
                ctx.fillRect(bx + 45, sy - 10, Math.min(120, val * 0.8), 10);
                ctx.fillStyle = '#FFF';
                ctx.fillText(`${val}`, bx + 170, sy);
                sy += 20;
            }
            // 总计
            const total = Object.values(stats).reduce((s, v) => s + v, 0);
            ctx.fillStyle = '#FFD700'; ctx.font = 'bold 12px monospace';
            ctx.fillText(`总计: ${total}`, bx, sy + 5);
        }

        // 招式列表（仅已捕获显示）
        if (entry.caught && cData.skills) {
            ctx.textAlign = 'left';
            const sx = 15, sy2 = H - 80;
            ctx.fillStyle = '#FFD700'; ctx.font = 'bold 12px monospace';
            ctx.fillText('可学招式', sx, sy2);
            ctx.font = '11px monospace';
            // skills 是 ID 数组，需要从 skillsData 查名称
            const skillNames = cData.skills.slice(0, 4).map(sId => {
                const sd = cm.skillsData.find(s => s.id === sId);
                return sd ? sd.name : '?';
            });
            skillNames.forEach((name, i) => {
                ctx.fillStyle = '#CCC';
                ctx.fillText(`· ${name}`, sx + (i % 2 === 0 ? 0 : 140), sy2 + 18 + Math.floor(i / 2) * 16);
            });
        }

        ctx.textAlign = 'left';
    }

    // ========== 徽章面板 ==========
    _updateBadgePanel(now) {
        const g = this.game;
        if (g.input.hasPendingClick()) {
            const click = g.input.getClick();
            if (click) {
                // 返回按钮
                const backBtnW = 50, backBtnH = 22;
                const backBtnX = g.W - backBtnW - 10, backBtnY = 8;
                if (click.x >= backBtnX && click.x <= backBtnX + backBtnW &&
                    click.y >= backBtnY && click.y <= backBtnY + backBtnH) { this.badgeMode = false; return; }
            }
        }
        if (g.input.isCancelPressed()) this.badgeMode = false;
    }

    _renderBadgePanel() {
        const ctx = this.game.ctx;
        const W = this.game.W, H = this.game.H;
        const cm = this.game.creaturesManager;

        ctx.fillStyle = 'rgba(0,0,0,0.85)';
        ctx.fillRect(0, 0, W, H);

        // 标题
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 20px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('道馆徽章', W / 2, 30);

        // 返回按钮
        const backBtnW = 50, backBtnH = 22;
        const backBtnX = W - backBtnW - 10, backBtnY = 8;
        ctx.fillStyle = 'rgba(255, 215, 0, 0.15)';
        ctx.fillRect(backBtnX, backBtnY, backBtnW, backBtnH);
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 1;
        ctx.strokeRect(backBtnX, backBtnY, backBtnW, backBtnH);
        ctx.fillStyle = '#FFD700';
        ctx.font = '12px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('← 返回', backBtnX + backBtnW / 2, backBtnY + 15);
        ctx.textAlign = 'left';

        // 调用 CreaturesManager 内置的徽章面板渲染
        cm.renderBadgePanel(ctx, 30, 55, W - 60);
    }

    // ========== 任务面板 ==========
    _updateQuestPanel(now) {
        const g = this.game;
        const quests = g.quests || {};
        const questKeys = Object.keys(quests);
        const maxVisible = 8;

        if (g.input.hasPendingClick()) {
            const click = g.input.getClick();
            if (click) {
                // 返回按钮
                const backBtnW = 50, backBtnH = 22;
                const backBtnX = g.W - backBtnW - 10, backBtnY = 8;
                if (click.x >= backBtnX && click.x <= backBtnX + backBtnW &&
                    click.y >= backBtnY && click.y <= backBtnY + backBtnH) { this.questMode = false; return; }
            }
        }
        if (g.input.isJustPressed('ArrowUp') || g.input.isJustPressed('KeyW')) this.questScrollIndex = Math.max(0, this.questScrollIndex - 1);
        if (g.input.isJustPressed('ArrowDown') || g.input.isJustPressed('KeyS')) this.questScrollIndex = Math.min(questKeys.length - 1, this.questScrollIndex + 1);
        if (g.input.isCancelPressed()) this.questMode = false;
    }

    _renderQuestPanel() {
        const ctx = this.game.ctx;
        const W = this.game.W, H = this.game.H;
        const g = this.game;
        const quests = g.quests || {};
        const questKeys = Object.keys(quests);

        ctx.fillStyle = 'rgba(0,0,0,0.85)';
        ctx.fillRect(0, 0, W, H);

        // 标题
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 20px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('任务日志', W / 2, 30);

        // 返回按钮
        const backBtnW = 50, backBtnH = 22;
        const backBtnX = W - backBtnW - 10, backBtnY = 8;
        ctx.fillStyle = 'rgba(255, 215, 0, 0.15)';
        ctx.fillRect(backBtnX, backBtnY, backBtnW, backBtnH);
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 1;
        ctx.strokeRect(backBtnX, backBtnY, backBtnW, backBtnH);
        ctx.fillStyle = '#FFD700';
        ctx.font = '12px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('← 返回', backBtnX + backBtnW / 2, backBtnY + 15);
        ctx.textAlign = 'left';

        // 统计
        const active = questKeys.filter(k => quests[k] === 'active').length;
        const completed = questKeys.filter(k => quests[k] === 'completed').length;
        ctx.font = '12px monospace';
        ctx.fillStyle = '#AAA';
        ctx.textAlign = 'center';
        ctx.fillText(`进行中: ${active}  已完成: ${completed}`, W / 2, 52);
        ctx.textAlign = 'left';

        if (questKeys.length === 0) {
            ctx.textAlign = 'center';
            ctx.fillStyle = '#666';
            ctx.font = '14px monospace';
            ctx.fillText('暂无任务记录', W / 2, H / 2);
        } else {
            const startY = 70;
            const itemH = 40;
            const maxVisible = Math.floor((H - startY - 30) / itemH);
            const scrollStart = Math.max(0, Math.min(this.questScrollIndex, questKeys.length - maxVisible));
            const scrollEnd = Math.min(questKeys.length, scrollStart + maxVisible);

            for (let i = scrollStart; i < scrollEnd; i++) {
                const qId = questKeys[i];
                const status = quests[qId];
                const y = startY + (i - scrollStart) * itemH;
                const isSelected = i === this.questScrollIndex;

                if (isSelected) {
                    ctx.fillStyle = 'rgba(255,215,0,0.1)';
                    ctx.fillRect(20, y, W - 40, itemH - 4);
                    ctx.strokeStyle = 'rgba(255,215,0,0.4)';
                    ctx.lineWidth = 1;
                    ctx.strokeRect(20, y, W - 40, itemH - 4);
                }

                // 任务 ID（截短显示）
                ctx.font = 'bold 13px monospace';
                ctx.fillStyle = '#FFF';
                ctx.textAlign = 'left';
                ctx.fillText(qId.length > 20 ? qId.substring(0, 20) + '...' : qId, 35, y + 18);

                // 状态标签
                const isActive = status === 'active';
                const isCompleted = status === 'completed';
                ctx.font = '11px monospace';
                if (isCompleted) {
                    ctx.fillStyle = '#4CAF50';
                    ctx.fillText('已完成', W - 100, y + 18);
                } else if (isActive) {
                    ctx.fillStyle = '#FFC107';
                    ctx.fillText('进行中', W - 100, y + 18);
                }
            }
        }

        ctx.textAlign = 'center';
        ctx.fillStyle = '#888';
        ctx.font = '12px monospace';
        ctx.fillText('↑↓浏览  ESC关闭', W / 2, H - 12);
        ctx.textAlign = 'left';
    }

    // ========== 队伍菜单 ==========
    _openPartyMenu() {
        const g = this.game;
        this.gameMenuOpen = false;
        g.ui.showCreatureSelect(g.creaturesManager.party, (index) => {
            g.ui.closeCreatureSelect();
            if (index >= 0) {
                const creature = g.creaturesManager.party[index];
                g.ui.showDialog([
                    `${creature.name} Lv.${creature.level}`,
                    `属性: ${creature.type}`,
                    `HP: ${creature.currentHP}/${creature.maxHP}`,
                    `攻击: ${creature.stats.attack} 防御: ${creature.stats.defense}`,
                    `速度: ${creature.stats.speed}`,
                    `经验: ${creature.exp}/${creature.expToNext}`
                ]);
                g.sceneManager.push('dialog');
            }
        });
        g.sceneManager.push('menu');
    }

    // ========== 交互 ==========
    _handleInteraction() {
        const g = this.game;
        const facing = g.player.getFacingTile();
        const npc = g.npcManager.checkFacingNPC(facing);
        if (npc) {
            g.npcManager.interactNPC(npc, g);
            // NPC交互后根据UI状态push对应场景
            if (g.ui.starterSelectActive) {
                g.sceneManager.push('menu');
            } else if (g.ui.dialogActive) {
                g.sceneManager.push('dialog');
            }
        }
    }

    _startWildBattle() {
        const g = this.game;
        if (g.creaturesManager.party.length === 0) { g.ui.showMessage('没有精灵，快去找精灵博士！'); return; }
        if (g.creaturesManager.isPartyFainted()) { g.ui.showMessage('精灵都倒下了...'); return; }
        const map = g.mapManager.getCurrentMap();
        if (!map || !map.wildCreatures) return;
        const totalWeight = map.wildCreatures.reduce((sum, c) => sum + c.weight, 0);
        let rand = Math.random() * totalWeight;
        let selected = map.wildCreatures[0];
        for (const wc of map.wildCreatures) { rand -= wc.weight; if (rand <= 0) { selected = wc; break; } }
        const level = selected.minLevel + Math.floor(Math.random() * (selected.maxLevel - selected.minLevel + 1));
        const creature = g.creaturesManager.createCreature(selected.id, level);
        if (creature) {
            g.creaturesManager.recordCreatureEncounter(creature.id);
            g.battleManager.startWildBattle(creature);
            g.sceneManager.push('battle');
        }
    }

    startTrainerBattle(npc, trainerParty) {
        const g = this.game;
        g.creaturesManager.recordNPCEncounter(npc.id, npc.name, npc.type);
        trainerParty.forEach(c => g.creaturesManager.recordCreatureEncounter(c.id));
        g.battleManager.startTrainerBattle(npc, trainerParty);
        g.sceneManager.push('battle');
    }

    openShop() {
        this.game.shopManager.open();
        this.game.sceneManager.push('shop');
    }

    _handleTransfer() {
        const g = this.game;
        const transfer = g.mapManager.checkTransfer(g.player.tileX, g.player.tileY);
        if (!transfer) return;
        if (!g.creaturesManager.starterChosen || g.creaturesManager.party.length === 0) {
            g.ui.showDialog(['你还没有选择精灵伙伴！', '请先去找精灵博士。']);
            g.sceneManager.push('dialog');
            const map = g.mapManager.getCurrentMap();
            if (map && map.playerStart) g.player.setPosition(map.playerStart.x, map.playerStart.y);
            return;
        }
        g.mapManager.switchMap(transfer.targetMap);
        const newMap = g.mapManager.getCurrentMap();
        g.player.setPosition(transfer.targetX, transfer.targetY);
        g.npcManager.loadNPCs(newMap.npcs);
        g.camera.snapTo(g.player.x, g.player.y, g.player.width, g.player.height, newMap.width * g.mapManager.tileSize, newMap.height * g.mapManager.tileSize);
        g.ui.showMessage(`来到了${newMap.name}`);
        g.saveManager.save(g, 0);
    }

    _onBattleEnd(result) {
        const g = this.game;
        try {
            // 从 engine.state 读取战斗信息（BattleManager 不直接持有这些属性）
            const battleState = g.battleManager.engine?.state;
            const battleType = battleState?.battleType || 'wild';
            const trainerNPC = g.battleManager.trainerNPC || battleState?.trainerNPC || null;

            if (result === 'lose') {
                // 战败回青叶镇（优先新ID，兼容旧ID）
                const homeMap = g.mapManager.maps['qingye_town'] ? 'qingye_town' : 'town1';
                g.mapManager.switchMap(homeMap);
                const map = g.mapManager.getCurrentMap();
                g.player.setPosition(map.playerStart.x, map.playerStart.y);
                g.npcManager.loadNPCs(map.npcs);
                g.creaturesManager.healParty();
                g.camera.snapTo(g.player.x, g.player.y, g.player.width, g.player.height, map.width * g.mapManager.tileSize, map.height * g.mapManager.tileSize);
                g.ui.showMessage('你的精灵已经恢复了...');
            }
            if (result === 'win' && battleType === 'trainer' && trainerNPC) {
                g.npcManager.markTrainerDefeated(trainerNPC.id);
                if (!g.creaturesManager.defeatedTrainers) g.creaturesManager.defeatedTrainers = [];
                if (!g.creaturesManager.defeatedTrainers.includes(trainerNPC.id)) g.creaturesManager.defeatedTrainers.push(trainerNPC.id);

                // 道馆馆主胜利 → 颁发徽章
                if (g.currentBattleType === 'gym' && g.gymBadgeId) {
                    const awarded = g.creaturesManager.awardBadge(g.gymBadgeId);
                    if (awarded) {
                        const badgeDef = CreaturesManager.GYM_DEFINITIONS.find(b => b.id === g.gymBadgeId);
                        g.ui.showMessage(`🏆 获得了${badgeDef ? badgeDef.name : '徽章'}！`);
                    }
                    g.currentBattleType = null;
                    g.gymLeaderId = null;
                    g.gymBadgeId = null;
                }
            }
            if (result === 'catch_success') g.creaturesManager.recordCreatureCaught(g.battleManager.caughtCreatureId || 0);
            try { g.saveManager.save(g, 0); } catch (e) { console.error('自动保存失败:', e); }
        } catch (e) { console.error('战斗结束处理异常:', e); }
    }

    // ========== 自动移动 ==========
    _getDirectionTo(tileX, tileY) {
        const g = this.game;
        const dx = tileX - g.player.tileX, dy = tileY - g.player.tileY;
        return Math.abs(dx) >= Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
    }

    _moveTowardsTile(targetTileX, targetTileY) {
        this.moveTarget = { x: targetTileX, y: targetTileY };
        this.isAutoMoving = true;
    }

    _updateAutoMove() {
        if (!this.isAutoMoving || !this.moveTarget) return;
        const g = this.game;
        if (g.player.moving) return;
        const dx = this.moveTarget.x - g.player.tileX, dy = this.moveTarget.y - g.player.tileY;
        if (dx === 0 && dy === 0) { this.isAutoMoving = false; this.moveTarget = null; return; }
        const dist = Math.abs(dx) + Math.abs(dy);
        if (dist === 1) {
            const targetNPC = g.npcManager.getNPCAt(this.moveTarget.x, this.moveTarget.y);
            if (targetNPC) {
                g.player.direction = this._getDirectionTo(this.moveTarget.x, this.moveTarget.y);
                this.isAutoMoving = false; this.moveTarget = null;
                this._handleInteraction();
                return;
            }
        }
        let dir = Math.abs(dx) >= Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
        const moved = g.player.tryMove(dir, g.mapManager, g.npcManager);
        if (!moved) {
            let altDir = Math.abs(dx) >= Math.abs(dy) ? (dy > 0 ? 'down' : (dy < 0 ? 'up' : null)) : (dx > 0 ? 'right' : (dx < 0 ? 'left' : null));
            if (altDir) {
                if (!g.player.tryMove(altDir, g.mapManager, g.npcManager)) { this.isAutoMoving = false; this.moveTarget = null; }
            } else { this.isAutoMoving = false; this.moveTarget = null; }
        }
    }

    // ========== 地图传送面板（世界总览图） ==========
    /**
     * 世界地图布局定义 - V4 精确物理方向版
     *
     * ⚠️ 核心原则：卡片相对位置必须 = 游戏内实际行走方向！
     *
     *   ↑ 屏幕上方 = 北 (North)   = 游戏中向上走
     *   ↓ 屏幕下方 = 南 (South)   = 游戏中向下走
     *   → 屏幕右方 = 东 (East)    = 游戏中向右走
     *   ← 屏幕左方 = 西 (West)    = 游戏中向左走
     *
     * 实际传送数据（从地图JSON transfers提取，100%准确）：
     *
     *   青叶镇(y=13出口) ↓南 → 野外草丛(x=0,y=9-10入口)
     *   野外草丛(x=29出口) →东 → 碧波森林(x=0,y=10-11入口)
     *   碧波森林(x=29出口) →东 → 碧波镇(x=0,y=7-8入口)
     *   碧波镇(x=0出口) ←西 ← 碧波森林
     *   碧波镇(y=0出口) ↓南 → 迷雾沼泽(y=18入口)
     *   碧波镇(y=14出口) ↓南 → 礁石航道(y=8-9入口)
     *   碧波镇(x=19出口) →东 → 赤岩古道(x=1,y=8-9入口)
     *
     * 物理拓扑（严格按行走方向）：
     *
     *           [青叶镇]                  ← 最北
     *              ↓ 南
     * [野外草丛] ——→ [碧波森林] ——→ [碧波镇] ——→ [赤岩古道]
     *                                    ↙          ↓
     *                             [迷雾沼泽]    [炎阳城] → [废弃矿坑]
     *                              (西南)          ↓ 南      (最南)
     *                           [礁石航道]    [灵渊秘室]
     *                            (正南)        (东南)
     */
    _getWorldMapLayout() {
        return {
            mapIds: [
                'qingye_town', 'route_001', 'bibo_forest', 'bibo_town',
                'mist_marsh', 'reef_route', 'redrock_path', 'lingyuan_chamber',
                'yanyang_city', 'abandoned_mine'
            ],
            nodes: null,
            cardW: 170,
            cardH: 64,
            // 连接边（基于实际 transfers 方向）
            edges: [
                { from: 'qingye_town', to: 'route_001' },        // ↓ 南
                { from: 'route_001', to: 'bibo_forest' },        // → 东
                { from: 'bibo_forest', to: 'bibo_town' },        // → 东
                { from: 'bibo_town', to: 'mist_marsh' },         // ↙ 西南 (北口出)
                { from: 'bibo_town', to: 'reef_route' },         // ↓ 南 (南口出)
                { from: 'bibo_town', to: 'redrock_path' },       // → 东 (东口出)
                { from: 'bibo_town', to: 'lingyuan_chamber' },   // 秘室（特殊入口）
                { from: 'redrock_path', to: 'yanyang_city' },    // ↓ 南
                { from: 'yanyang_city', to: 'abandoned_mine' }   // ↓ 南
            ]
        };
    }

    /**
     * 计算卡片坐标（V4 精确物理版）
     *
     * row=南北轴（越大越靠南↓），col=东西轴（越大越靠东→）
     * 每个位置的 row/col 差值 = 实际行走方向
     */
    _buildWorldMapCardLayout() {
        const layout = this._getWorldMapLayout();
        if (layout.nodes) return layout;

        const CW = layout.cardW, CH = layout.cardH;
        const GAP_X = 24, GAP_Y = 18;

        // ===== V4: 100% 匹配物理行走方向的坐标 =====
        const positions = {
            // 第一条主线：青叶镇 → 野外 → 森林 → 镇 → 古道（纯向东延伸）
            'qingye_town':      { row: 0, col: 0 },
            'route_001':        { row: 1, col: 0 },       // 青叶镇的正南方
            'bibo_forest':      { row: 1, col: 1 },       // 野外的正东方
            'bibo_town':        { row: 1, col: 2 },       // 森林的正东方 ★关键修正
            'redrock_path':     { row: 1, col: 3 },       // 镇的正东方

            // 碧波镇的分支（从中心枢纽向三个方向发散）
            'mist_marsh':       { row: 2, col: 1 },       // 镇的西南方
            'reef_route':       { row: 2, col: 2 },       // 镇的正南方
            'lingyuan_chamber': { row: 2, col: 3 },       // 古道的东南方

            // 南部纵深
            'yanyang_city':     { row: 3, col: 3 },       // 古道的正南方
            'abandoned_mine':   { row: 4, col: 3 }        // 城的正南方（最远端）
        };

        let maxRow = 0, maxCol = 0;
        for (const pos of Object.values(positions)) {
            maxRow = Math.max(maxRow, pos.row);
            maxCol = Math.max(maxCol, pos.col);
        }

        const MARGIN = 40;
        const nodes = {};
        for (const [id, pos] of Object.entries(positions)) {
            nodes[id] = {
                x: MARGIN + pos.col * (CW + GAP_X),
                y: MARGIN + pos.row * (CH + GAP_Y)
            };
        }

        layout.nodes = nodes;
        layout.canvasW = MARGIN * 2 + maxCol * (CW + GAP_X) + CW;
        layout.canvasH = MARGIN * 2 + maxRow * (CH + GAP_Y) + CH;
        return layout;
    }

    /** 道馆传送点定义（只有这些城镇可点击传送） */
    _getTeleportPoints() {
        return [
            { id: 'bibo_town',    name: '碧波镇',  badgeId: null,           badgeName: '（起始可达）',  leaderName: '澜汐' },
            { id: 'yanyang_city', name: '炎阳城',  badgeId: 'bibo_badge',   badgeName: '碧波徽章',     leaderName: '炎烈' }
        ];
    }

    /** 地图类型配置（颜色+标签） */
    _getMapTypeConfig(type) {
        const configs = {
            town:    { label: '城镇', color: '#FFD700', bg: 'rgba(255,215,0,0.12)', border: 'rgba(255,215,0,0.5)' },
            route:   { label: '道路', color: '#81C784', bg: 'rgba(129,199,132,0.10)', border: 'rgba(129,199,132,0.4)' },
            dungeon: { label: '副本', color: '#E57373', bg: 'rgba(229,115,115,0.10)', border: 'rgba(229,115,115,0.4)' },
            special: { label: '秘境', color: '#CE93D8', bg: 'rgba(206,147,216,0.10)', border: 'rgba(206,147,216,0.4)' }
        };
        return configs[type] || configs.route;
    }

    /**
     * V6 直绘版：计算世界地图在屏幕上的最终显示布局（无离屏canvas）
     * 返回每个卡片的最终屏幕坐标和尺寸，所有文字直接以最终像素绘制
     */
    _getWorldMapDisplayLayout() {
        const g = this.game;
        const W = g.W, H = g.H;
        const layout = this._buildWorldMapCardLayout();
        if (!layout.nodes) return null;

        const TOP_MARGIN = 70, BOTTOM_MARGIN = 50, SIDE_MARGIN = 20;
        const availW = W - SIDE_MARGIN * 2;
        const availH = H - TOP_MARGIN - BOTTOM_MARGIN;

        // 计算缩放比例，让地图区域填满可用空间
        const scale = Math.min(availW / layout.canvasW, availH / layout.canvasH, 2.0);

        // 整体居中偏移
        const displayW = layout.canvasW * scale;
        const displayH = layout.canvasH * scale;
        const offsetX = Math.floor((W - displayW) / 2);
        const offsetY = Math.floor(TOP_MARGIN + (availH - displayH) / 2);

        // 每张卡片的最终屏幕位置
        const cardRegions = {};
        const CW = layout.cardW * scale;
        const CH = layout.cardH * scale;
        for (const [mapId, node] of Object.entries(layout.nodes)) {
            cardRegions[mapId] = {
                x: offsetX + node.x * scale,
                y: offsetY + node.y * scale,
                w: CW, h: CH
            };
        }

        // 连接线端点（从卡片中心出发，缩短到边缘）
        const connLines = [];
        for (const edge of layout.edges) {
            const rFrom = cardRegions[edge.from];
            const rTo = cardRegions[edge.to];
            if (!rFrom || !rTo) continue;
            connLines.push({ from: edge.from, to: edge.to, rFrom, rTo });
        }

        return {
            offsetX, offsetY, scale,
            layout, cardRegions, connLines,
            areaX: offsetX, areaY: offsetY,
            areaW: displayW, areaH: displayH
        };
    }

    /** 辅助：绘制圆角矩形路径 */
    _roundRect(ctx, x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
    }

    /** 获取地图之间的传送点连接线数据（保留兼容） */
    _getMapConnections() {
        const g = this.game;
        const mm = g.mapManager;
        const conns = [];
        const seen = new Set();

        const allMapIds = [
            'qingye_town', 'route_001', 'bibo_forest', 'bibo_town',
            'mist_marsh', 'reef_route', 'redrock_path', 'lingyuan_chamber',
            'yanyang_city', 'abandoned_mine',
            'town1', 'wild', 'town2', 'cave'
        ];
        for (const id of allMapIds) {
            const map = mm.maps[id];
            if (!map || !map.transfers) continue;
            for (const t of map.transfers) {
                const key = [id, t.targetMap, t.x, t.y, t.targetX, t.targetY].join(',');
                if (!seen.has(key)) {
                    seen.add(key);
                    conns.push({
                        from: id, to: t.targetMap,
                        fx: t.x, fy: t.y,
                        tx: t.targetX, ty: t.targetY
                    });
                }
            }
        }
        return conns;
    }

    /** 获取世界地图显示参数（V6 直绘版） */
    _getWorldMapDisplayParams() {
        return this._getWorldMapDisplayLayout();
    }

    _updateMapPanel(now) {
        const g = this.game;

        // ESC关闭
        if (g.input.isCancelPressed()) { this.mapPanelMode = false; return; }

        // 点击检测
        if (g.input.hasPendingClick()) {
            const click = g.input.getClick();
            if (click) {
                // 返回按钮（与渲染一致）
                const backBtnW = 70, backBtnH = 28;
                const backBtnX = g.W - backBtnW - 15, backBtnY = 18;
                if (click.x >= backBtnX && click.x <= backBtnX + backBtnW &&
                    click.y >= backBtnY && click.y <= backBtnY + backBtnH) { this.mapPanelMode = false; return; }

                // 检测点击了哪张地图卡片（V6 直绘版：cardRegions 已是屏幕坐标）
                const params = this._getWorldMapDisplayParams();
                if (params) {
                    for (const [mapId, region] of Object.entries(params.cardRegions)) {
                        if (click.x >= region.x && click.x <= region.x + region.w &&
                            click.y >= region.y && click.y <= region.y + region.h) {
                            const tp = this._getTeleportPoints().find(p => p.id === mapId);
                            const canTeleport = tp && (tp.badgeId === null || g.creaturesManager.hasBadge(tp.badgeId));
                            if (canTeleport && mapId !== g.mapManager.currentMapId) {
                                this._teleportToMap(tp);
                            }
                            return;
                        }
                    }
                }
                // 点击空白区域关闭
                this.mapPanelMode = false;
            }
        }
    }

    _renderMapPanel() {
        const ctx = this.game.ctx;
        const W = this.game.W, H = this.game.H;
        const g = this.game;
        const currentMapId = g.mapManager.currentMapId;
        const teleportPoints = this._getTeleportPoints();

        // 全屏遮罩
        ctx.fillStyle = 'rgba(8,10,18,0.95)';
        ctx.fillRect(0, 0, W, H);

        // 标题栏背景（更宽）
        ctx.fillStyle = 'rgba(255,215,0,0.06)';
        ctx.fillRect(0, 0, W, 62);

        // 标题
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 26px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('世界地图', W / 2, 28);

        // 当前位置提示
        const currentMap = g.mapManager.getCurrentMap();
        ctx.font = '14px monospace';
        ctx.fillStyle = '#999';
        ctx.fillText(`当前位置: ${currentMap ? currentMap.name : '未知'}  |  击败道馆馆主解锁传送`, W / 2, 50);

        // 返回按钮
        const backBtnW = 70, backBtnH = 28;
        const backBtnX = W - backBtnW - 15, backBtnY = 18;
        ctx.fillStyle = 'rgba(255, 215, 0, 0.12)';
        this._roundRect(ctx, backBtnX, backBtnY, backBtnW, backBtnH, 5);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,215,0,0.5)';
        ctx.lineWidth = 1.5;
        this._roundRect(ctx, backBtnX, backBtnY, backBtnW, backBtnH, 5);
        ctx.stroke();
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 14px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('← 返回', backBtnX + backBtnW / 2, backBtnY + 19);

        // ===== V6 直绘：获取布局 =====
        const params = this._getWorldMapDisplayParams();
        if (!params) return;

        const now = performance.now();

        // ---- 1) 背景区域 ----
        ctx.fillStyle = '#0c0e18';
        this._roundRect(ctx, params.areaX, params.areaY, params.areaW, params.areaH, 10);
        ctx.fill();

        // 网格线
        ctx.strokeStyle = 'rgba(255,255,255,0.03)';
        ctx.lineWidth = 1;
        for (let x = params.areaX; x <= params.areaX + params.areaW; x += 30) { ctx.beginPath(); ctx.moveTo(x, params.areaY); ctx.lineTo(x, params.areaY + params.areaH); ctx.stroke(); }
        for (let y = params.areaY; y <= params.areaY + params.areaH; y += 30) { ctx.beginPath(); ctx.moveTo(params.areaX, y); ctx.lineTo(params.areaX + params.areaW, y); ctx.stroke(); }

        // ---- 2) 连接线（直接以屏幕坐标绘制）----
        ctx.lineWidth = 3; ctx.setLineDash([10, 6]);
        for (const conn of params.connLines) {
            const rf = conn.rFrom, rt = conn.rTo;
            const fx = rf.x + rf.w/2, fy = rf.y+rf.h/2, tx=rt.x+rt.w/2, ty=rt.y+rt.h/2;
            const dx=tx-fx, dy=ty-fy; if(Math.abs(dx)<1&&Math.abs(dy)<1) continue;
            const sfx=Math.abs(dx)>0.1?rf.w/2/Math.abs(dx):9999, sfy=Math.abs(dy)>0.1?rf.h/2/Math.abs(dy):9999, sf=Math.min(sfx,sfy);
            const sx=fx+dx*sf, sy=fy+dy*sf, ex=tx-dx*sf, ey=ty-dy*sf;
            const grad=ctx.createLinearGradient(sx,sy,ex,ey);
            grad.addColorStop(0,'rgba(100,180,255,0.7)');grad.addColorStop(0.5,'rgba(80,150,220,0.4)');grad.addColorStop(1,'rgba(100,180,255,0.7)');
            ctx.strokeStyle=grad; ctx.beginPath();ctx.moveTo(sx,sy);ctx.lineTo(ex,ey);ctx.stroke();
            const mx=(sx+ex)/2,my=(sy+ey)/2; ctx.setLineDash([]);
            ctx.fillStyle='rgba(120,170,240,0.65)';ctx.save();ctx.translate(mx,my);ctx.rotate(Math.atan2(dy,dx));
            ctx.beginPath();ctx.moveTo(8,0);ctx.lineTo(-4,-5);ctx.lineTo(-4,5);ctx.closePath();ctx.fill();ctx.restore();
            ctx.setLineDash([10,6]);
        }
        ctx.setLineDash([]);

        // ---- 3) 绘制每张卡片（V6 直绘：最终尺寸，文字清晰）----
        for (const mapId of params.layout.mapIds) {
            const reg = params.cardRegions[mapId]; if(!reg)continue;
            const map=g.mapManager.maps[mapId]; if(!map)continue;
            const x=reg.x,y=reg.y,cw=reg.w,ch=reg.h;
            const typeConf=this._getMapTypeConfig(map.type);

            // 阴影
            ctx.fillStyle='rgba(0,0,0,0.35)';
            this._roundRect(ctx,x+3,y+3,cw,ch,10);ctx.fill();
            // 卡片主体
            ctx.fillStyle='rgba(16,20,36,0.95)';
            this._roundRect(ctx,x,y,cw,ch,10);ctx.fill();
            // 边框
            ctx.strokeStyle=typeConf.border;ctx.lineWidth=2;
            this._roundRect(ctx,x,y,cw,ch,10);ctx.stroke();
            // 色条
            ctx.fillStyle=typeConf.color;
            this._roundRect(ctx,x+1,y+1,cw-2,6*params.scale,4);ctx.fill();
            // 类型标签
            const labelW=38*params.scale,labelH=18*params.scale,labelFont=Math.max(11,Math.round(12*params.scale));
            ctx.fillStyle=typeConf.bg;
            this._roundRect(ctx,x+8*params.scale,y+12*params.scale,labelW,labelH,4);ctx.fill();
            ctx.fillStyle=typeConf.color;ctx.font=`bold ${labelFont}px monospace`;ctx.textAlign='center';
            ctx.fillText(typeConf.label,x+8*params.scale+labelW/2,y+12*params.scale+labelH*0.68);
            // 地图名称（核心！直接用屏幕像素大小绘制）
            const nameFont=Math.max(15,Math.round(17*params.scale));
            ctx.fillStyle='#E8E8E8';ctx.font=`bold ${nameFont}px monospace`;ctx.textAlign='center';
            ctx.fillText(map.name,x+cw/2,y+ch/2+nameFont*0.38);
            // 底部装饰线
            ctx.strokeStyle=typeConf.border;ctx.globalAlpha=0.25;ctx.lineWidth=1;
            ctx.beginPath();ctx.moveTo(x+15*params.scale,y+ch-10*params.scale);ctx.lineTo(x+cw-15*params.scale,y+ch-10*params.scale);ctx.stroke();
            ctx.globalAlpha=1;
        }
        ctx.textAlign='left';

        // ---- 4) 当前位置高亮（使用 cardRegions 最终坐标）----
        const region=params.cardRegions[currentMapId];
        if(region){
            const rx=region.x,ry=region.y,rw=region.w,rh=region.h;
            const pulse1=0.25+0.2*Math.sin(now/300),pulse2=0.3+0.35*Math.sin(now/450),glowSize=6+3*Math.sin(now/400);
            ctx.strokeStyle=`rgba(76,175,80,${(pulse2*0.4).toFixed(2)})`;ctx.lineWidth=3;
            this._roundRect(ctx,rx-8-glowSize,ry-8-glowSize,rw+16+glowSize*2,rh+16+glowSize*2,14);ctx.stroke();
            ctx.strokeStyle=`rgba(76,175,80,${pulse2.toFixed(2)})`;ctx.lineWidth=2.5;
            this._roundRect(ctx,rx-6,ry-6,rw+12,rh+12,12);ctx.stroke();
            ctx.fillStyle=`rgba(76,175,80,${pulse1.toFixed(2)})`;
            this._roundRect(ctx,rx-3,ry-3,rw+6,rh+6,10);ctx.fill();
            ctx.strokeStyle='#4CAF50';ctx.lineWidth=3;
            this._roundRect(ctx,rx-2,ry-2,rw+4,rh+4,9);ctx.stroke();
            // 四角角标
            const cL=12,cO=4;ctx.strokeStyle='#69F0AE';ctx.lineWidth=2.5;
            [[rx-cO,ry-cO,1,1],[rx+rw+cO,ry-cO,-1,1],[rx-cO,ry+rh+cO,1,-1],[rx+rw+cO,ry+rh+cO,-1,-1]].forEach(([cx,cy,dx,dy])=>{
                ctx.beginPath();ctx.moveTo(cx,cy+dy*cL);ctx.lineTo(cx,cy);ctx.lineTo(cx+dx*cL,cy);ctx.stroke();
            });
            // 📍 标签
            const tagText='📍 当前位置',tagFont=Math.max(13,Math.round(14*params.scale));
            ctx.font=`bold ${tagFont}px monospace`;const tagW=ctx.measureText(tagText).width+20,tagX=rx+rw/2,tagY=ry-20;
            ctx.fillStyle='rgba(76,175,80,0.92)';this._roundRect(ctx,tagX-tagW/2,tagY-14,tagW,24,6);ctx.fill();
            ctx.strokeStyle='#69F0AE';ctx.lineWidth=1.5;this._roundRect(ctx,tagX-tagW/2,tagY-14,tagW,24,6);ctx.stroke();
            ctx.fillStyle='#FFF';ctx.font=`bold ${tagFont}px monospace`;ctx.textAlign='center';ctx.fillText(tagText,tagX,tagY+4);
            ctx.fillStyle='#4CAF50';ctx.beginPath();ctx.moveTo(tagX,tagY+10);ctx.lineTo(tagX-6,tagY+16);ctx.lineTo(tagX+6,tagY+16);ctx.closePath();ctx.fill();
        }

        // ---- 5) 状态标签（当前地图始终显示）----
        for(const [mapId,reg] of Object.entries(params.cardRegions)){
            const map=g.mapManager.maps[mapId];if(!map)continue;
            const isCurrent=mapId===currentMapId;

            // 当前位置：无条件显示
            if(isCurrent){
                const statusText='当前位置',statusColor='#4CAF50';
                const statusFont=Math.max(11,Math.round(13*params.scale));
                ctx.font=`bold ${statusFont}px monospace`;ctx.textAlign='center';
                const stW=ctx.measureText(statusText).width+14,stX=reg.x+reg.w/2,stY=reg.y+reg.h+14*params.scale;
                ctx.fillStyle='rgba(76,175,80,0.18)';
                this._roundRect(ctx,stX-stW/2,stY-10*params.scale,stW,18*params.scale,4);ctx.fill();
                ctx.fillStyle=statusColor;ctx.fillText(statusText,stX,stY+3*params.scale);
                continue;
            }

            // 非当前地图：仅在传送点列表中才显示
            const tp=teleportPoints.find(p=>p.id===mapId);if(!tp)continue;
            const hasBadge=tp.badgeId===null||g.creaturesManager.hasBadge(tp.badgeId);
            const statusText=hasBadge?'可传送':`${tp.leaderName}（锁定）`;
            const statusColor=hasBadge?'#FFD700':'#F44336';
            const statusFont=Math.max(11,Math.round(13*params.scale));
            ctx.font=`bold ${statusFont}px monospace`;ctx.textAlign='center';
            const stW=ctx.measureText(statusText).width+14,stX=reg.x+reg.w/2,stY=reg.y+reg.h+14*params.scale;
            ctx.fillStyle=hasBadge?'rgba(255,215,0,0.15)':'rgba(244,67,54,0.15)';
            this._roundRect(ctx,stX-stW/2,stY-10*params.scale,stW,18*params.scale,4);ctx.fill();
            ctx.fillStyle=statusColor;ctx.fillText(statusText,stX,stY+3*params.scale);
        }

        // 图例
        ctx.textAlign = 'left';
        const legendY = H - 35;
        const legends = [
            { label: '城镇', color: '#FFD700' },
            { label: '道路', color: '#81C784' },
            { label: '副本', color: '#E57373' },
            { label: '秘境', color: '#CE93D8' }
        ];
        let legendX = 20;
        ctx.font = '12px monospace';
        for (const leg of legends) {
            ctx.fillStyle = leg.color;
            ctx.fillRect(legendX, legendY - 5, 8, 8);
            ctx.fillStyle = '#888';
            ctx.fillText(leg.label, legendX + 11, legendY + 3);
            legendX += ctx.measureText(leg.label).width + 22;
        }

        // 底部提示
        ctx.textAlign = 'center';
        ctx.fillStyle = '#555';
        ctx.font = '13px monospace';
        ctx.fillText('点击可传送的城镇传送  ESC关闭', W / 2, H - 12);
        ctx.textAlign = 'left';
    }

    /** 传送到指定地图的 playerStart 位置 */
    _teleportToMap(teleportPoint) {
        const g = this.game;
        const targetId = teleportPoint.id;

        if (!g.mapManager.maps[targetId]) {
            g.ui.showMessage('该地图尚未开放！');
            this.mapPanelMode = false;
            return;
        }

        g.mapManager.switchMap(targetId);
        const newMap = g.mapManager.getCurrentMap();
        g.player.setPosition(newMap.playerStart.x, newMap.playerStart.y);
        g.npcManager.loadNPCs(newMap.npcs);
        g.camera.snapTo(g.player.x, g.player.y, g.player.width, g.player.height, newMap.width * g.mapManager.tileSize, newMap.height * g.mapManager.tileSize);

        this.mapPanelMode = false;
        g.ui.showMessage(`传送到了${newMap.name}`);
        try { g.saveManager.save(g, 0); } catch (e) { console.error('传送后保存失败:', e); }
    }

    // ========== 存档槽位选择器（游戏中保存/读取） ==========

    /** 计算存档选择器卡片位置 */
    _getSlotPickerCardRects(W, H) {
        const panelW = Math.min(340, W - 40);
        const panelH = 150;
        const px = (W - panelW) / 2;
        const py = (H - panelH) / 2 + 20;
        const cardW = (panelW - 25) / 3;
        const cardH = panelH - 50;
        const cardY = py + 32;
        const rects = [];
        for (let i = 0; i < 3; i++) {
            const cx = px + 8 + i * (cardW + 3);
            rects.push({ x: cx, y: cardY, w: cardW, h: cardH });
        }
        return rects;
    }

    _updateSlotPicker(now) {
        const g = this.game;
        const slotCount = g.saveManager.getSlotCount();

        // 方向键切换槽位（使用 isJustPressed 检测按键）
        if (g.input.isJustPressed('ArrowLeft') || g.input.isJustPressed('KeyA')) {
            this.slotPickerIndex = (this.slotPickerIndex - 1 + slotCount) % slotCount;
            g.input.lastActionTime = now;
        } else if (g.input.isJustPressed('ArrowRight') || g.input.isJustPressed('KeyD')) {
            this.slotPickerIndex = (this.slotPickerIndex + 1) % slotCount;
            g.input.lastActionTime = now;
        }

        // 鼠标点击检测
        if (g.input.hasPendingClick()) {
            const click = g.input.getClick();
            if (!click) return;

            // 实时计算卡片位置（避免依赖渲染时填充的 slotPickerCardRects）
            const cardRects = this._getSlotPickerCardRects(g.canvas.width, g.canvas.height);

            // 检查是否点击了某个槽位卡片
            for (let i = 0; i < cardRects.length; i++) {
                const rect = cardRects[i];
                if (click.x >= rect.x && click.x <= rect.x + rect.w &&
                    click.y >= rect.y && click.y <= rect.y + rect.h) {
                    this.slotPickerIndex = i;
                    // 点击后直接执行保存/读取
                    this._confirmSlotPickerAction(now);
                    return;
                }
            }
        }

        // 确认
        if (g.input.isConfirmPressed(now)) {
            this._confirmSlotPickerAction(now);
        }

        // 取消
        if (g.input.isCancelPressed(now)) {
            g.input.lastActionTime = now;
            this.slotPickerMode = false;
        }
    }

    /** 确认槽位选择并执行保存/读取 */
    _confirmSlotPickerAction(now) {
        const g = this.game;
        g.input.lastActionTime = now;
        const slot = this.slotPickerIndex;

        if (this.slotPickerType === 'save') {
            if (g.saveManager.save(g, slot)) {
                g.ui.showMessage(`已保存到存档 ${slot + 1}！`);
            } else {
                g.ui.showMessage('保存失败！');
            }
        } else if (this.slotPickerType === 'load') {
            if (g.saveManager.hasSlotSave(slot)) {
                if (g.saveManager.load(g, slot)) {
                    g.ui.showMessage(`已从存档 ${slot + 1} 读取！`);
                } else {
                    g.ui.showMessage('读取失败！');
                }
            } else {
                g.ui.showMessage(`存档 ${slot + 1} 为空`);
            }
        }
        this.slotPickerMode = false;
    }

    _renderSlotPicker() {
        const ctx = this.game.ctx;
        const W = this.game.W, H = this.game.H;
        const g = this.game;

        const panelW = Math.min(360, W - 40);
        const panelH = 150;
        const px = (W - panelW) / 2;
        const py = (H - panelH) / 2 + 10;

        // 半透明背景遮罩
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, W, H);

        // 面板背景
        ctx.fillStyle = 'rgba(10, 15, 35, 0.95)';
        ctx.strokeStyle = this.slotPickerType === 'save' ? 'rgba(76, 175, 80, 0.6)' : 'rgba(100, 150, 255, 0.6)';
        ctx.lineWidth = 2;
        this._roundRect(ctx, px, py, panelW, panelH, 10);
        ctx.fill();
        ctx.stroke();

        // 标题
        const titleText = this.slotPickerType === 'save' ? '— 保存游戏 —' : '— 读取存档 —';
        ctx.fillStyle = this.slotPickerType === 'save' ? '#81C784' : '#6ab7ff';
        ctx.font = 'bold 14px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(titleText, W / 2, py + 22);

        // 3个槽位卡片
        const cardW = (panelW - 25) / 3;
        const cardH = panelH - 50;
        const cardY = py + 32;
        const summaries = g.saveManager.getSlotSummaries();

        // 清空并重新记录点击区域
        this.slotPickerCardRects = [];

        for (let i = 0; i < 3; i++) {
            const cx = px + 8 + i * (cardW + 3);
            const summary = summaries[i];
            const selected = i === this.slotPickerIndex;

            // 记录点击区域
            this.slotPickerCardRects.push({ x: cx, y: cardY, w: cardW, h: cardH });

            if (selected) {
                ctx.fillStyle = 'rgba(80, 140, 255, 0.2)';
                ctx.strokeStyle = '#6ab7ff';
                ctx.lineWidth = 2;
            } else {
                ctx.fillStyle = summary.empty ? 'rgba(30, 35, 60, 0.8)' : 'rgba(30, 45, 80, 0.65)';
                ctx.strokeStyle = 'rgba(80, 110, 180, 0.3)';
                ctx.lineWidth = 1;
            }
            this._roundRect(ctx, cx, cardY, cardW, cardH, 6);
            ctx.fill();
            ctx.stroke();

            // 鼠标悬停效果
            if (g.input.mouseX >= cx && g.input.mouseX <= cx + cardW &&
                g.input.mouseY >= cardY && g.input.mouseY <= cardY + cardH) {
                ctx.fillStyle = 'rgba(100, 160, 255, 0.15)';
                this._roundRect(ctx, cx, cardY, cardW, cardH, 6);
                ctx.fill();
            }

            ctx.fillStyle = selected ? '#6ab7ff' : '#8899bb';
            ctx.font = 'bold 11px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(`存档 ${i + 1}`, cx + cardW / 2, cardY + 16);

            if (summary.empty) {
                ctx.fillStyle = '#556';
                ctx.font = '10px monospace';
                ctx.fillText('— 空 —', cx + cardW / 2, cardY + cardH / 2 + 4);
            } else {
                ctx.textAlign = 'center';
                ctx.fillStyle = '#aabbdd';
                ctx.font = '8px monospace';
                ctx.fillText(summary.timeStr, cx + cardW / 2, cardY + 32);

                const mapNames = {
                    qingye_town: '青叶镇', town1: '青叶镇', route1: '一号道路',
                    forest_1: '迷雾森林', cave_1: '岩石洞穴', city_gym: '道馆城',
                    port_town: '港口镇', mountain_path: '山间小径',
                    volcanic_cave: '火山洞窟', ice_cave: '冰之洞窟',
                    desert_ruins: '沙漠遗迹', sky_tower: '天空塔',
                };
                ctx.fillStyle = '#99bbee';
                ctx.fillText(mapNames[summary.mapId] || summary.mapId || '?', cx + cardW / 2, cardY + 46);

                ctx.fillStyle = '#88aacc';
                ctx.font = '8px monospace';
                ctx.fillText(`Lv.${summary.topLevel} 🏅${summary.badgeCount} 💰${summary.gold}`, cx + cardW / 2, cardY + 60);
            }

            if (selected) {
                ctx.fillStyle = '#FFD700';
                ctx.font = 'bold 12px monospace';
                ctx.fillText('▼', cx + cardW / 2, cardY + cardH + 12);
            }
        }

        // 底部提示
        ctx.fillStyle = '#7799BB';
        ctx.font = '10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('← → 选择 / 点击卡片   确认 执行   取消 返回', W / 2, py + panelH + 16);
        ctx.textAlign = 'left';
    }
}

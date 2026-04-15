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
            }
        }

        // 点击移动
        const click = g.input.getClick();
        if (click) {
            const map = g.mapManager.getCurrentMap();
            if (map) {
                const ts = g.mapManager.tileSize;
                const clickTileX = Math.floor((click.x + g.camera.x) / ts);
                const clickTileY = Math.floor((click.y + g.camera.y) / ts);
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

        g.camera.applyTransform(ctx);
        g.mapManager.render(ctx, g.camera);
        g.mapManager.renderNPCs(ctx, g.npcManager.getNPCs());
        g.player.render(ctx);
        g.camera.restoreTransform(ctx);

        g.ui.renderHUD(g.creaturesManager, g.mapManager);

        if (this.gameMenuOpen) this._renderGameMenu();
        if (this.bagMode) { g.ui.renderBag(g.creaturesManager); g.ui.renderButtonDialog(); }
        if (this.dexMode) this._renderDex();
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
                if (click.x >= MENU_X && click.x <= MENU_X + 120 &&
                    click.y >= ITEM_START_Y && click.y < ITEM_START_Y + this.gameMenuItems.length * ITEM_H) {
                    const idx = Math.floor((click.y - ITEM_START_Y) / ITEM_H);
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
            case 3:
                if (g.saveManager.save(g)) g.ui.showMessage('游戏已保存！');
                else g.ui.showMessage('保存失败！');
                this.gameMenuOpen = false;
                break;
            case 4:
                if (g.saveManager.hasSave()) {
                    if (g.saveManager.load(g)) g.ui.showMessage('读取存档成功！');
                    else g.ui.showMessage('读取存档失败！');
                } else g.ui.showMessage('没有找到存档');
                this.gameMenuOpen = false;
                break;
            case 5:
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
        if (data.type === 'potion') {
            const target = g.creaturesManager.getFirstAlive();
            if (!target) { g.ui.showMessage('没有存活的精灵'); return; }
            if (target.currentHP >= target.maxHP) { g.ui.showMessage(`${target.name}已经满血了`); return; }
            g.ui.showButtonDialog(`对 ${target.name} 使用 ${data.name}？`, ['确认使用', '取消'], (btnIndex) => {
                if (btnIndex === 0) {
                    g.creaturesManager.useItem(item.itemId);
                    target.currentHP = Math.min(target.maxHP, target.currentHP + data.healAmount);
                    g.ui.showMessage(`${target.name}恢复了${data.healAmount}HP！`);
                }
            });
        } else g.ui.showMessage('这个道具无法在这里使用');
    }

    // ========== 图鉴 ==========
    _updateDex(now) {
        const g = this.game;
        const cm = g.creaturesManager;
        const dex = this.dexPage === 'creature' ? cm.creatureDex : cm.npcDex;
        const keys = Object.keys(dex);
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
                    if (idx >= 0 && idx < keys.length) this.dexScrollIndex = idx;
                    return;
                }
            }
        }
        if (g.input.isJustPressed('ArrowUp') || g.input.isJustPressed('KeyW')) this.dexScrollIndex = Math.max(0, this.dexScrollIndex - 1);
        if (g.input.isJustPressed('ArrowDown') || g.input.isJustPressed('KeyS')) this.dexScrollIndex = Math.min(keys.length - 1, this.dexScrollIndex + 1);
        if (g.input.isJustPressed('Tab') || g.input.isJustPressed('KeyQ')) { this.dexPage = this.dexPage === 'creature' ? 'npc' : 'creature'; this.dexScrollIndex = 0; }
        if (g.input.isCancelPressed()) this.dexMode = false;
    }

    _renderDex() {
        const ctx = this.game.ctx;
        const W = this.game.W, H = this.game.H;
        const cm = this.game.creaturesManager;

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
        ctx.font = '12px monospace';
        ctx.fillStyle = '#AAA';
        ctx.fillText(`精灵: ${stats.encounteredCreatures}/${stats.totalCreatures} 遭遇  ${stats.caughtCreatures} 捕获  |  NPC: ${stats.totalNPCs} 遭遇`, W / 2, 50);

        ctx.fillStyle = this.dexPage === 'creature' ? '#FFD700' : '#888';
        ctx.fillText('[Q] 精灵图鉴', W / 4, 70);
        ctx.fillStyle = this.dexPage === 'npc' ? '#FFD700' : '#888';
        ctx.fillText('[Q] NPC图鉴', W * 3 / 4, 70);

        const dex = this.dexPage === 'creature' ? cm.creatureDex : cm.npcDex;
        const keys = Object.keys(dex);
        const startY = 90, itemHeight = 55;
        const maxVisible = Math.floor((H - startY - 40) / itemHeight);
        const scrollStart = Math.max(0, this.dexScrollIndex - maxVisible + 1);
        const scrollEnd = Math.min(keys.length, scrollStart + maxVisible);

        for (let i = scrollStart; i < scrollEnd; i++) {
            const entry = dex[keys[i]];
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
                const creatureId = parseInt(keys[i]);
                if (cm.spriteData[creatureId]) cm.renderCreature(ctx, 30, y + 2, 40, creatureId);
                ctx.textAlign = 'left';
                ctx.font = 'bold 14px monospace';
                ctx.fillStyle = '#FFF';
                ctx.fillText(entry.name, 80, y + 12);
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
        ctx.fillText('↑↓浏览  Q切换  ESC关闭', W / 2, H - 15);
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
        g.saveManager.save(g);
    }

    _onBattleEnd(result) {
        const g = this.game;
        try {
            if (result === 'lose') {
                g.mapManager.switchMap('town1');
                const map = g.mapManager.getCurrentMap();
                g.player.setPosition(map.playerStart.x, map.playerStart.y);
                g.npcManager.loadNPCs(map.npcs);
                g.creaturesManager.healParty();
                g.camera.snapTo(g.player.x, g.player.y, g.player.width, g.player.height, map.width * g.mapManager.tileSize, map.height * g.mapManager.tileSize);
                g.ui.showMessage('你的精灵已经恢复了...');
            }
            if (result === 'win' && g.battleManager.battleType === 'trainer' && g.battleManager.trainerNPC) {
                g.npcManager.markTrainerDefeated(g.battleManager.trainerNPC.id);
                if (!g.creaturesManager.defeatedTrainers) g.creaturesManager.defeatedTrainers = [];
                if (!g.creaturesManager.defeatedTrainers.includes(g.battleManager.trainerNPC.id)) g.creaturesManager.defeatedTrainers.push(g.battleManager.trainerNPC.id);
            }
            if (result === 'catch_success') g.creaturesManager.recordCreatureCaught(g.battleManager.caughtCreatureId || 0);
            try { g.saveManager.save(g); } catch (e) { console.error('自动保存失败:', e); }
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
}

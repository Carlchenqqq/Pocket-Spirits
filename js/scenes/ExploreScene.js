/**
 * ExploreScene - 探索场景
 * 游戏核心场景：地图探索、NPC交互、战斗触发、传送
 * 子面板逻辑已拆分到 js/panels/ 目录下的独立类中
 */
class ExploreScene extends Scene {
    constructor(game) {
        super(game);
        this.id = 'explore';

        // 自动移动
        this.isAutoMoving = false;
        this.moveTarget = null;

        // 创建所有面板实例
        this.gameMenu = new GameMenuPanel(game);
        this.bagPanel = new BagPanel(game);
        this.dexPanel = new DexPanel(game);
        this.badgePanel = new BadgePanel(game);
        this.questPanel = new QuestPanel(game);
        this.worldMapPanel = new WorldMapPanel(game);
        this.slotPicker = new SlotPickerPanel(game);

        // 注入面板回调
        this._setupPanelCallbacks();
    }

    _setupPanelCallbacks() {
        // GameMenuPanel 回调
        this.gameMenu.onOpenParty = () => this._openPartyMenu();
        this.gameMenu.onOpenBag = () => {
            this.gameMenu.closeMenu();
            this.bagPanel.openBag();
        };
        this.gameMenu.onOpenDex = () => {
            this.gameMenu.closeMenu();
            this.dexPanel.openDex();
        };
        this.gameMenu.onOpenBadge = () => {
            this.gameMenu.closeMenu();
            this.badgePanel.openBadge();
        };
        this.gameMenu.onOpenQuest = () => {
            this.gameMenu.closeMenu();
            this.questPanel.openQuest();
        };
        this.gameMenu.onOpenSlotPicker = (type) => {
            this.gameMenu.closeMenu();
            this.slotPicker.openSlotPicker(type);
        };

        // BagPanel 回调：使用灵师手册 → 打开手册面板
        this.bagPanel.onUseManual = () => {
            this.dexPanel.openDex();
            this.dexPanel.page = 'guide'; // 直接打开指南页
        };
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
        this.gameMenu.closeMenu();
        this.bagPanel.closeBag();
        this.dexPanel.closeDex();
        this.badgePanel.closeBadge();
        this.questPanel.closeQuest();
        this.worldMapPanel.closeMap();
        this.slotPicker.closeSlotPicker();
        this.isAutoMoving = false;
        this.moveTarget = null;
    }

    update(deltaTime) {
        const g = this.game;
        const now = performance.now();

        // 子面板优先处理
        if (this.slotPicker.active) { this.slotPicker.update(now); return; }
        if (this.gameMenu.open) { this.gameMenu.update(now); return; }
        if (this.bagPanel.open) { this.bagPanel.update(now); return; }
        if (this.dexPanel.open) { this.dexPanel.update(now); return; }
        if (this.badgePanel.open) { this.badgePanel.update(now); return; }
        if (this.questPanel.open) { this.questPanel.update(now); return; }
        if (this.worldMapPanel.open) { this.worldMapPanel.update(now); return; }

        // ESC或点击菜单按钮打开菜单
        if (g.input.isCancelPressed()) {
            this.gameMenu.openMenu();
            return;
        }
        if (g.input.hasPendingClick()) {
            const pendingClick = g.input.peekClick();
            if (pendingClick) {
                const btnX = g.W - 50, btnY = g.H - 40, btnW = 40, btnH = 30;
                if (pendingClick.x >= btnX && pendingClick.x <= btnX + btnW &&
                    pendingClick.y >= btnY && pendingClick.y <= btnY + btnH) {
                    g.input.getClick();
                    this.gameMenu.openMenu();
                    return;
                }
                // 地图按钮（左下角）
                const mapBtnX = 8, mapBtnY = g.H - 40, mapBtnW = 40, mapBtnH = 30;
                if (pendingClick.x >= mapBtnX && pendingClick.x <= mapBtnX + mapBtnW &&
                    pendingClick.y >= mapBtnY && pendingClick.y <= mapBtnY + mapBtnH) {
                    g.input.getClick();
                    this.worldMapPanel.openMap();
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
                // 屏幕坐标 -> 世界坐标（考虑 zoom 缩放）
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

        // 委托给各面板渲染
        if (this.gameMenu.open) this.gameMenu.render();
        if (this.bagPanel.open) { g.ui.renderBag(g.creaturesManager); g.ui.renderButtonDialog(); }
        if (this.dexPanel.open) this.dexPanel.render();
        if (this.badgePanel.open) this.badgePanel.render();
        if (this.questPanel.open) this.questPanel.render();
        if (this.worldMapPanel.open) this.worldMapPanel.render();
        if (this.slotPicker.active) this.slotPicker.render();
    }

    // ========== 队伍菜单 ==========
    _openPartyMenu() {
        const g = this.game;
        this.gameMenu.closeMenu();
        g.ui.showCreatureSelect(g.creaturesManager.party, (index) => {
            g.ui.closeCreatureSelect();
            if (index >= 0) {
                const creature = g.creaturesManager.party[index];
                if (!creature) return;
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
        if (!map || !map.wildCreatures || map.wildCreatures.length === 0) return;
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

    openShop(shopType) {
        this.game.shopManager.open(shopType, this.game.creaturesManager);
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
        // 切换地图，检查返回值防止目标地图不存在
        const switched = g.mapManager.switchMap(transfer.targetMap);
        if (!switched) {
            console.error(`传送失败：目标地图 "${transfer.targetMap}" 不存在`);
            const currentMap = g.mapManager.getCurrentMap();
            if (currentMap && currentMap.playerStart) {
                g.player.setPosition(currentMap.playerStart.x, currentMap.playerStart.y);
            }
            g.ui.showMessage('传送失败，请重试');
            return;
        }
        const newMap = g.mapManager.getCurrentMap();
        // 校验目标坐标是否在新地图范围内
        const tx = transfer.targetX || 0;
        const ty = transfer.targetY || 0;
        const safeX = (tx >= 0 && tx < newMap.width) ? tx : (newMap.playerStart ? newMap.playerStart.x : 0);
        const safeY = (ty >= 0 && ty < newMap.height) ? ty : (newMap.playerStart ? newMap.playerStart.y : 0);
        g.player.setPosition(safeX, safeY);
        g.npcManager.loadNPCs(newMap.npcs);
        g.camera.snapTo(g.player.x, g.player.y, g.player.width, g.player.height, newMap.width * g.mapManager.tileSize, newMap.height * g.mapManager.tileSize);
        g.ui.showMessage(`来到了${newMap.name}`);
        g.saveManager.save(g, 0);
    }

    _onBattleEnd(result) {
        const g = this.game;
        try {
            // 从 BattleManager 保存的属性读取（endBattle 已清空 engine.state）
            const battleType = g.battleManager.lastBattleType || 'wild';
            const trainerNPC = g.battleManager.lastTrainerNPC || null;

            if (result === 'lose') {
                // 清理道馆相关状态
                g.currentBattleType = null;
                g.gymLeaderId = null;
                g.gymBadgeId = null;
                g.currentGymNPC = null;
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

                // 道馆馆主胜利 -> 颁发徽章
                if (g.currentBattleType === 'gym' && g.gymBadgeId) {
                    // 检查是否是冒牌馆主
                    const gymNPC = g.currentGymNPC;
                    if (gymNPC && gymNPC.isImposter) {
                        // 触发真相揭露剧情
                        g.ui.showDialog([
                            '等等...这个馆主的感觉不对...',
                            '真正的澜汐馆主被绑在道馆后面的密室里！',
                            '你击败的是浊流小头目「浪」伪装的冒牌馆主！',
                            '浪已经逃跑了...',
                            '澜汐馆主：谢谢你，孩子。',
                            '浊流比想象中更危险。',
                            '其他几个地区的道馆也收到了「合作邀请」。',
                            '如果他们也像这里一样被渗透...',
                            '你获得了碧波徽章！'
                        ], () => {
                            // 授予徽章
                            if (gymNPC.badgeId && !g.creaturesManager.hasBadge(gymNPC.badgeId)) {
                                g.creaturesManager.badges.push(gymNPC.badgeId);
                                g.ui.showMessage(`获得了${gymNPC.badgeId === 'bibo_badge' ? '碧波徽章' : gymNPC.badgeId}！`);
                            }
                            // 完成任务
                            if (g.quests) g.quests['quest_sea_route'] = 'completed';
                            // 标记真正馆主为已解救
                            const realLeader = g.npcManager.npcs.find(n => n.isRealLeader);
                            if (realLeader) {
                                realLeader.type = 'gym_leader';
                                realLeader.defeated = true;
                                realLeader.hidden = false; // 显示真正馆主
                            }
                            // 移除冒牌馆主
                            const imposterIdx = g.npcManager.npcs.findIndex(n => n.id === gymNPC.id);
                            if (imposterIdx >= 0) g.npcManager.npcs.splice(imposterIdx, 1);
                            g.currentGymNPC = null;
                            g.saveManager.save(g, 0);
                        });
                        g.sceneManager.push('dialog');
                        g.currentGymNPC = null;
                        return; // 跳过正常的道馆战奖励处理
                    }

                    const awarded = g.creaturesManager.awardBadge(g.gymBadgeId);
                    if (awarded) {
                        const badgeDef = CreaturesManager.GYM_DEFINITIONS.find(b => b.id === g.gymBadgeId);
                        g.ui.showMessage(`🏆 获得了${badgeDef ? badgeDef.name : '徽章'}！`);
                    }
                    g.currentBattleType = null;
                    g.gymLeaderId = null;
                    g.gymBadgeId = null;
                    g.currentGymNPC = null;
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
}

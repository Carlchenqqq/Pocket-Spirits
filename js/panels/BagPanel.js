/**
 * BagPanel - 背包面板
 * 从 ExploreScene.js 提取：_updateBag, _requestUseItem
 */
class BagPanel {
    constructor(game) {
        this.game = game;
        this.open = false;

        // 回调：由 ExploreScene 注入
        this.onClose = null;  // 关闭背包面板
        this.onEvolution = null; // 进化石使用回调 (creature, stoneType) => void
    }

    openBag() {
        const g = this.game;
        this.open = true;
        g.ui.bagSelectedIndex = 0;
        g.ui.showBag(g.creaturesManager.items, g.creaturesManager, () => {});
    }

    closeBag() {
        const g = this.game;
        this.open = false;
        g.ui.closeBag();
    }

    update(now) {
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
                    this.closeBag(); return;
                }
                // 道具列表点击
                const listStartY = boxY + 35, itemH = 25;
                if (click.x >= boxX && click.x <= boxX + boxW && click.y >= listStartY && click.y <= listStartY + items.length * itemH) {
                    const idx = Math.floor((click.y - listStartY) / itemH);
                    if (idx >= 0 && idx < items.length) { g.ui.bagSelectedIndex = idx; this._requestUseItem(idx); return; }
                } else { this.closeBag(); return; }
            }
        }
        if (g.input.isJustPressed('ArrowUp') || g.input.isJustPressed('KeyW')) g.ui.bagSelectedIndex = Math.max(0, g.ui.bagSelectedIndex - 1);
        if (g.input.isJustPressed('ArrowDown') || g.input.isJustPressed('KeyS')) g.ui.bagSelectedIndex = Math.min(items.length - 1, g.ui.bagSelectedIndex);
        if (g.input.isConfirmPressed(now) && items.length > 0) this._requestUseItem(g.ui.bagSelectedIndex);
        if (g.input.isCancelPressed()) this.closeBag();
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

            case 'stone': {
                // 进化石：选择一只精灵使用
                const stoneType = data.evolveType || data.stoneType;
                if (!stoneType) { g.ui.showMessage('这个进化石无法使用'); break; }

                const candidates = g.creaturesManager.party.filter(c =>
                    g.creaturesManager.canEvolveWithStone(c, stoneType)
                );

                if (candidates.length === 0) {
                    g.ui.showMessage('队伍中没有精灵可以使用这个进化石');
                    break;
                }

                if (candidates.length === 1) {
                    const target = candidates[0];
                    g.ui.showButtonDialog(`对 ${target.name} 使用 ${data.name}？`, ['确认使用', '取消'], (btnIndex) => {
                        if (btnIndex === 0) {
                            g.creaturesManager.useItem(item.itemId);
                            if (this.onEvolution) {
                                this.onEvolution(target, stoneType);
                            } else {
                                const result = g.creaturesManager.useEvolutionStone(target, stoneType);
                                if (result) {
                                    g.ui.showMessage(`恭喜！${result.oldName} 进化成了 ${result.newName}！`);
                                } else {
                                    g.ui.showMessage('进化失败了...');
                                }
                            }
                        }
                    });
                } else {
                    g.ui.showCreatureSelect(candidates, (index) => {
                        g.ui.closeCreatureSelect();
                        if (index >= 0) {
                            const target = candidates[index];
                            g.ui.showButtonDialog(`对 ${target.name} 使用 ${data.name}？`, ['确认使用', '取消'], (btnIndex) => {
                                if (btnIndex === 0) {
                                    g.creaturesManager.useItem(item.itemId);
                                    if (this.onEvolution) {
                                        this.onEvolution(target, stoneType);
                                    } else {
                                        const result = g.creaturesManager.useEvolutionStone(target, stoneType);
                                        if (result) {
                                            g.ui.showMessage(`恭喜！${result.oldName} 进化成了 ${result.newName}！`);
                                        } else {
                                            g.ui.showMessage('进化失败了...');
                                        }
                                    }
                                }
                            });
                        }
                    });
                }
                break;
            }

            default:
                g.ui.showMessage('这个道具无法在这里使用');
        }
    }
}

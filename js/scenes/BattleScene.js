/**
 * BattleScene - 战斗场景
 */
class BattleScene extends Scene {
    constructor(game) {
        super(game);
        this.id = 'battle';
    }

    onEnter() {
        const g = this.game;
        g.battleManager.resultCallback = (result) => {
            this._onBattleEnd(result);
        };
    }

    update(deltaTime) {
        const g = this.game;
        const now = performance.now();

        // 精灵选择面板激活时，拦截输入交给面板处理
        if (g.ui.creatureSelectActive) {
            this._updateCreatureSelect(now);
            g.battleManager.update(deltaTime);
            return;
        }

        g.battleManager.update(deltaTime);
        g.battleManager.handleInput(g.input, now);
    }

    render(ctx) {
        this.game.battleManager.render();
        // 精灵选择面板覆盖渲染
        if (this.game.ui.creatureSelectActive) {
            this.game.ui.renderCreatureSelect(this.game.creaturesManager);
        }
    }

    /** 战斗中精灵选择面板输入处理（复用 MenuScene 的逻辑） */
    _updateCreatureSelect(now) {
        const g = this.game;
        const list = g.ui.creatureSelectList || [];
        if (g.input.hasPendingClick()) {
            const click = g.input.getClick();
            if (click) {
                const boxX = 30, boxY = 20, boxW = g.W - 60;
                const backBtnW = 50, backBtnH = 22;
                const backBtnX = boxX + boxW - backBtnW - 8;
                const backBtnY = boxY + 6;
                if (click.x >= backBtnX && click.x <= backBtnX + backBtnW &&
                    click.y >= backBtnY && click.y <= backBtnY + backBtnH) {
                    if (g.ui.creatureSelectCallback) g.ui.creatureSelectCallback(-1);
                    return;
                }
                const listStartY = boxY + 35, itemH = 40;
                if (click.x >= boxX && click.x <= boxX + boxW && click.y >= listStartY && click.y <= listStartY + list.length * itemH) {
                    const idx = Math.floor((click.y - listStartY) / itemH);
                    if (idx >= 0 && idx < list.length) {
                        g.ui.creatureSelectIndex = idx;
                        if (g.ui.creatureSelectCallback) g.ui.creatureSelectCallback(idx);
                        return;
                    }
                } else {
                    if (g.ui.creatureSelectCallback) g.ui.creatureSelectCallback(-1);
                    return;
                }
            }
        }
        if (g.input.isJustPressed('ArrowUp') || g.input.isJustPressed('KeyW'))
            g.ui.creatureSelectIndex = Math.max(0, g.ui.creatureSelectIndex - 1);
        if (g.input.isJustPressed('ArrowDown') || g.input.isJustPressed('KeyS'))
            g.ui.creatureSelectIndex = Math.min(list.length - 1, g.ui.creatureSelectIndex);
        if (g.input.isConfirmPressed(now) && g.ui.creatureSelectCallback)
            g.ui.creatureSelectCallback(g.ui.creatureSelectIndex);
        if (g.input.isCancelPressed() && g.ui.creatureSelectCallback)
            g.ui.creatureSelectCallback(-1);
    }

    _onBattleEnd(result) {
        const g = this.game;
        const exploreScene = g.sceneManager.scenes.get('explore');
        if (exploreScene) {
            exploreScene._onBattleEnd(result);
        }
        g.sceneManager.pop();
    }
}

/**
 * MenuScene - 菜单场景（初始精灵选择、队伍精灵选择）
 */
class MenuScene extends Scene {
    constructor(game) {
        super(game);
        this.id = 'menu';
    }

    update(deltaTime) {
        const g = this.game;
        const now = performance.now();

        if (g.ui.starterSelectActive) {
            this._updateStarterSelect(now);
        } else if (g.ui.creatureSelectActive) {
            this._updateCreatureSelect(now);
        } else {
            g.sceneManager.pop();
        }
    }

    render(ctx) {
        const g = this.game;
        // 渲染底层探索场景
        const exploreScene = g.sceneManager.scenes.get('explore');
        if (exploreScene) exploreScene.render(ctx);
        // 渲染菜单UI
        g.ui.renderMenu();
        if (g.ui.starterSelectActive) g.ui.renderStarterSelect(g.creaturesManager);
        if (g.ui.creatureSelectActive) g.ui.renderCreatureSelect(g.creaturesManager);
    }

    _updateStarterSelect(now) {
        const g = this.game;
        if (g.input.hasPendingClick()) {
            const click = g.input.getClick();
            if (click) {
                const spacing = 190, startX = 45, cardW = 170, cardH = 280, cardY = 70;
                for (let i = 0; i < 3; i++) {
                    const cx = startX + i * spacing;
                    if (click.x >= cx && click.x <= cx + cardW && click.y >= cardY && click.y <= cardY + cardH) {
                        g.ui.starterSelectedIndex = i;
                        if (g.ui.starterCallback) g.ui.starterCallback(i);
                        return;
                    }
                }
            }
        }
        if (g.input.isJustPressed('ArrowLeft') || g.input.isJustPressed('KeyA')) g.ui.starterSelectedIndex = Math.max(0, g.ui.starterSelectedIndex - 1);
        if (g.input.isJustPressed('ArrowRight') || g.input.isJustPressed('KeyD')) g.ui.starterSelectedIndex = Math.min(2, g.ui.starterSelectedIndex + 1);
        if (g.input.isConfirmPressed(now) && g.ui.starterCallback) g.ui.starterCallback(g.ui.starterSelectedIndex);
    }

    _updateCreatureSelect(now) {
        const g = this.game;
        const list = g.ui.creatureSelectList || [];
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
                    if (g.ui.creatureSelectCallback) g.ui.creatureSelectCallback(-1);
                    return;
                }
                // 列表项点击
                const listStartY = boxY + 35, itemH = 40;
                if (click.x >= boxX && click.x <= boxX + boxW && click.y >= listStartY && click.y <= listStartY + list.length * itemH) {
                    const idx = Math.floor((click.y - listStartY) / itemH);
                    if (idx >= 0 && idx < list.length) { g.ui.creatureSelectIndex = idx; if (g.ui.creatureSelectCallback) g.ui.creatureSelectCallback(idx); return; }
                } else { if (g.ui.creatureSelectCallback) g.ui.creatureSelectCallback(-1); return; }
            }
        }
        if (g.input.isJustPressed('ArrowUp') || g.input.isJustPressed('KeyW')) g.ui.creatureSelectIndex = Math.max(0, g.ui.creatureSelectIndex - 1);
        if (g.input.isJustPressed('ArrowDown') || g.input.isJustPressed('KeyS')) g.ui.creatureSelectIndex = Math.min(list.length - 1, g.ui.creatureSelectIndex);
        if (g.input.isConfirmPressed(now) && g.ui.creatureSelectCallback) g.ui.creatureSelectCallback(g.ui.creatureSelectIndex);
        if (g.input.isCancelPressed() && g.ui.creatureSelectCallback) g.ui.creatureSelectCallback(-1);
    }
}

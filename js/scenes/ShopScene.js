/**
 * ShopScene - 商店场景
 */
class ShopScene extends Scene {
    constructor(game) {
        super(game);
        this.id = 'shop';
    }

    update(deltaTime) {
        const g = this.game;
        g.shopManager.update(deltaTime);

        if (g.input.hasPendingClick()) {
            const click = g.input.getClick();
            if (click) {
                if (g.shopManager.confirming) {
                    g.shopManager.handleClick(click.x, click.y, g.creaturesManager);
                    return;
                }
                // 返回按钮检测
                const W = CONFIG.CANVAS_W;
                const backBtnW = 50, backBtnH = 22;
                const backBtnX = W - backBtnW - 10, backBtnY = 12;
                if (click.x >= backBtnX && click.x <= backBtnX + backBtnW &&
                    click.y >= backBtnY && click.y <= backBtnY + backBtnH) {
                    g.shopManager.close(); g.sceneManager.pop(); return;
                }
                // 商品列表点击（行高 48px，与渲染一致）
                const listTop = 87;
                const listBottom = 95 + g.shopManager.shopItems.length * 48;
                if (click.x >= 20 && click.x <= W - 20 && click.y >= listTop && click.y <= listBottom) {
                    const clickedIndex = Math.floor((click.y - listTop) / 48);
                    if (clickedIndex >= 0 && clickedIndex < g.shopManager.shopItems.length) {
                        g.shopManager.requestBuy(clickedIndex);
                    }
                } else {
                    g.shopManager.close();
                    g.sceneManager.pop();
                }
            }
        }

        if (g.input.isCancelPressed()) {
            if (g.shopManager.confirming) {
                g.shopManager.cancelBuy();
            } else {
                g.shopManager.close();
                g.sceneManager.pop();
            }
        }
    }

    render(ctx) {
        this.game.shopManager.render(ctx, this.game.creaturesManager);
    }
}

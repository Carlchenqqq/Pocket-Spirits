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
        const now = performance.now();
        g.shopManager.update(deltaTime);

        if (g.input.hasPendingClick()) {
            const click = g.input.getClick();
            if (click) {
                if (g.shopManager.confirming) {
                    g.shopManager.handleClick(click.x, click.y, g.creaturesManager);
                    return;
                }
                const W = 640, H = 480;
                const listTop = 87, listBottom = 95 + 4 * 50;
                if (click.x >= 20 && click.x <= W - 20 && click.y >= listTop && click.y <= listBottom) {
                    const clickedIndex = Math.floor((click.y - listTop) / 50);
                    if (clickedIndex >= 0 && clickedIndex < g.shopManager.shopItems.length) {
                        g.shopManager.requestBuy(clickedIndex);
                    }
                } else {
                    g.shopManager.close();
                    g.sceneManager.pop();
                }
                return;
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

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
        g.battleManager.update(deltaTime);
        g.battleManager.handleInput(g.input, now);
    }

    render(ctx) {
        this.game.battleManager.render();
    }

    _onBattleEnd(result) {
        const g = this.game;
        // 获取 explore 场景并调用其 _onBattleEnd
        const exploreScene = g.sceneManager.scenes.get('explore');
        if (exploreScene) {
            exploreScene._onBattleEnd(result);
        }
        g.sceneManager.pop();
    }
}

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
        console.log('[BattleScene] _onBattleEnd | result:', result, '| stack:', [...g.sceneManager.sceneStack]);
        const exploreScene = g.sceneManager.scenes.get('explore');
        if (exploreScene) {
            exploreScene._onBattleEnd(result);
        }
        g.sceneManager.pop();
        console.log('[BattleScene] after pop | stack:', [...g.sceneManager.sceneStack], '| current:', g.sceneManager.getCurrentSceneId());
    }
}

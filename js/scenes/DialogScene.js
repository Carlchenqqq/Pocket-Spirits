/**
 * DialogScene - 对话场景
 */
class DialogScene extends Scene {
    constructor(game) {
        super(game);
        this.id = 'dialog';
        this.titleChoiceActive = false;
    }

    onEnter() {
        this.titleChoiceActive = this.game.titleChoiceActive || false;
    }

    update(deltaTime) {
        const g = this.game;
        const now = performance.now();

        g.ui.update(deltaTime);

        if (g.input.hasPendingClick()) {
            g.input.clearClick();
            if (!g.ui.dialogConfirm()) {
                if (this.titleChoiceActive) {
                    this.titleChoiceActive = false;
                    g.titleChoiceActive = false;
                    if (g.saveManager.load(g)) {
                        g.ui.showMessage('读取存档成功！');
                    } else {
                        g.ui.showMessage('读取失败，开始新游戏');
                    }
                }
                this._finishDialog();
            }
            return;
        }

        if (g.input.isConfirmPressed(now)) {
            if (!g.ui.dialogConfirm()) {
                if (this.titleChoiceActive) {
                    this.titleChoiceActive = false;
                    g.titleChoiceActive = false;
                    if (g.saveManager.load(g)) {
                        g.ui.showMessage('读取存档成功！');
                    } else {
                        g.ui.showMessage('读取失败，开始新游戏');
                    }
                }
                g.input.lastActionTime = now;
                this._finishDialog();
            }
        }

        if (this.titleChoiceActive && g.input.isCancelPressed()) {
            this.titleChoiceActive = false;
            g.titleChoiceActive = false;
            g.sceneManager.pop();
        }
    }

    /**
     * 对话结束处理：先 pop 自己，再执行回调
     */
    _finishDialog() {
        const g = this.game;
        const callback = g.ui.dialogCallback;
        console.log('[DialogScene] _finishDialog | callback:', !!callback, '| stack:', [...g.sceneManager.sceneStack]);
        // 先 pop DialogScene
        g.sceneManager.pop();
        console.log('[DialogScene] after pop | stack:', [...g.sceneManager.sceneStack], '| current:', g.sceneManager.getCurrentSceneId());
        // 再执行回调（回调中可能 push battle/shop 等新场景）
        if (callback) {
            callback();
            console.log('[DialogScene] after callback | stack:', [...g.sceneManager.sceneStack], '| current:', g.sceneManager.getCurrentSceneId());
        }
    }

    render(ctx) {
        const g = this.game;
        const exploreScene = g.sceneManager.scenes.get('explore');
        if (exploreScene) exploreScene.render(ctx);
        g.ui.renderDialog();
    }
}

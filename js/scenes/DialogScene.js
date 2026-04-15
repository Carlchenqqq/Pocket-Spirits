/**
 * DialogScene - 对话场景
 */
class DialogScene extends Scene {
    constructor(game) {
        super(game);
        this.id = 'dialog';
        this.titleChoiceActive = false;
        this._scenePushed = false;
    }

    onEnter() {
        this.titleChoiceActive = this.game.titleChoiceActive || false;
        this._scenePushed = false;
    }

    update(deltaTime) {
        const g = this.game;
        const now = performance.now();

        // 对话回调已触发新场景（战斗/商店等），不再处理输入
        if (this._scenePushed) return;

        g.ui.update(deltaTime);

        if (g.input.hasPendingClick()) {
            g.input.clearClick();
            if (!g.ui.dialogConfirm()) {
                if (this._scenePushed) {
                    // 对话回调中已 push 新场景，等待新场景接管
                    return;
                }
                if (this.titleChoiceActive) {
                    this.titleChoiceActive = false;
                    g.titleChoiceActive = false;
                    if (g.saveManager.load(g)) {
                        g.ui.showMessage('读取存档成功！');
                    } else {
                        g.ui.showMessage('读取失败，开始新游戏');
                    }
                    g.sceneManager.pop();
                    return;
                }
                g.sceneManager.pop();
            }
            return;
        }

        if (g.input.isConfirmPressed(now)) {
            if (!g.ui.dialogConfirm()) {
                if (this._scenePushed) {
                    // 对话回调中已 push 新场景，等待新场景接管
                    return;
                }
                if (this.titleChoiceActive) {
                    this.titleChoiceActive = false;
                    g.titleChoiceActive = false;
                    if (g.saveManager.load(g)) {
                        g.ui.showMessage('读取存档成功！');
                    } else {
                        g.ui.showMessage('读取失败，开始新游戏');
                    }
                    g.sceneManager.pop();
                    return;
                }
                g.input.lastActionTime = now;
                g.sceneManager.pop();
            }
        }

        if (this.titleChoiceActive && g.input.isCancelPressed()) {
            this.titleChoiceActive = false;
            g.titleChoiceActive = false;
            g.sceneManager.pop();
        }
    }

    /** 标记对话回调中已push新场景，阻止pop */
    markScenePushed() {
        this._scenePushed = true;
    }

    render(ctx) {
        const g = this.game;
        const exploreScene = g.sceneManager.scenes.get('explore');
        if (exploreScene) exploreScene.render(ctx);
        g.ui.renderDialog();
    }
}

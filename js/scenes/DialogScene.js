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

        // 如果之前push了子场景（战斗/商店），现在又回来了，
        // 说明子场景已经pop，我们需要自动pop自己回到探索场景
        if (this._scenePushed) {
            // 清理对话UI残留状态
            g.ui.dialogActive = false;
            g.ui.dialogQueue = [];
            g.ui.dialogCallback = null;
            this._scenePushed = false;
            g.sceneManager.pop();
            return;
        }

        g.ui.update(deltaTime);

        if (g.input.hasPendingClick()) {
            g.input.clearClick();
            if (!g.ui.dialogConfirm()) {
                // dialogConfirm 返回 false = 对话队列已空
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
                // dialogConfirm 返回 false = 对话队列已空
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

    /** 标记对话回调中已push新场景，阻止立即pop */
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

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
                // 对话结束，检查是否有回调需要执行
                // 注意：如果回调中 push 了新场景（战斗/商店），
                // 我们先 pop 自己，再执行回调，避免 DialogScene 残留在栈中
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
     * 回调中如果需要 push 新场景（战斗/商店），此时 DialogScene 已经不在栈中了，
     * 不会造成卡死或场景栈混乱
     */
    _finishDialog() {
        const g = this.game;
        // 保存回调引用（pop 后 this 可能不再活跃）
        const callback = g.ui.dialogCallback;
        // 先 pop DialogScene
        g.sceneManager.pop();
        // 再执行回调（回调中可能 push battle/shop 等新场景）
        if (callback) {
            callback();
        }
    }

    render(ctx) {
        const g = this.game;
        const exploreScene = g.sceneManager.scenes.get('explore');
        if (exploreScene) exploreScene.render(ctx);
        g.ui.renderDialog();
    }
}

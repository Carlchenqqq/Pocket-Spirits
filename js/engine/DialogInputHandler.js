/**
 * DialogInputHandler - 对话输入处理器
 * 处理对话框的键盘/触控输入
 */
class DialogInputHandler {
    /**
     * 处理对话输入
     * @returns {string|null} 动作：'next'|'confirm_choice'|null
     */
    static handleInput(input, dialogEngine, now) {
        if (!dialogEngine.isActive()) return null;

        // ─── 选项模式 ───
        if (dialogEngine.hasChoices()) {
            return this._handleChoiceMode(input, dialogEngine, now);
        }

        // ─── 普通对话模式（翻页/跳过） ───
        // 点击或确认键 = 翻页/跳过/结束
        let triggered = false;

        if (input.hasPendingClick()) {
            const click = input.getClick();
            if (click) {
                // 点击对话框区域（底部340~480）才响应
                if (click.y >= 330 && click.y <= 480) {
                    triggered = true;
                }
            }
        }

        if (!triggered && input.isConfirmPressed(now)) {
            triggered = true;
        }

        return triggered ? 'next' : null;
    }

    /** 选项模式的导航 */
    static _handleChoiceMode(input, engine, now) {
        const choices = engine.getChoices();
        if (!choices) return null;

        // 键盘上下移动选项
        if (input.isJustPressed('ArrowUp') || input.isJustPressed('KeyW')) {
            engine.moveChoiceUp();
            return null; // 只是移动，不是动作
        }
        if (input.isJustPressed('ArrowDown') || input.isJustPressed('KeyS')) {
            engine.moveChoiceDown();
            return null;
        }

        // 确认选择
        if (input.hasPendingClick() || input.isConfirmPressed(now)) {
            if (input.hasPendingClick()) {
                input.getClick(); // consume click
            }
            return 'confirm_choice';
        }

        return null;
    }
}

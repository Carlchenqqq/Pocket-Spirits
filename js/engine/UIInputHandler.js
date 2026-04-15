/**
 * UIInputHandler - 通用 UI 输入处理器
 * 处理列表导航（上下）、按钮弹框选择、菜单按钮点击等
 */
class UIInputHandler {
    // ════════════════════════════════════
    //   列表导航（背包、精灵选择、菜单）
    // ════════════════════════════════════

    /**
     * 处理垂直列表的输入
     * @param {object} input - InputHandler 实例
     * @param {number} currentIndex - 当前选中索引
     * @param {number} itemCount - 列表总项数
     * @param {number} now - 当前时间戳
     * @returns {{ index: number, confirmed: boolean, cancelled: boolean }}
     */
    static handleListNavigation(input, currentIndex, itemCount, now) {
        let idx = currentIndex;

        if (input.isJustPressed('ArrowUp') || input.isJustPressed('KeyW')) {
            idx = Math.max(0, idx - 1);
        }
        if (input.isJustPressed('ArrowDown') || input.isJustPressed('KeyS')) {
            idx = Math.min(itemCount - 1, idx + 1);
        }

        const confirmed = input.isConfirmPressed(now);
        const cancelled = input.isCancelPressed();

        return { index: idx, confirmed, cancelled };
    }

    /**
     * 检测列表项点击（垂直排列，每项固定高度）
     * @param {number} clickX
     * @param {number} clickY
     * @param {object} layout - { x, y, w, itemH }
     * @param {number} itemCount
     * @returns {number} 点击的项索引，-1 表示未命中
     */
    static detectListItemClick(clickX, clickY, layout, itemCount) {
        if (clickX < layout.x || clickX > layout.x + layout.w) return -1;
        for (let i = 0; i < itemCount; i++) {
            const iy = layout.y + i * (layout.itemH + 3); // 3px gap
            if (clickY >= iy && clickY <= iy + layout.itemH) return i;
        }
        return -1;
    }

    // ════════════════════════════════════
    //   按钮弹框输入
    // ════════════════════════════════════

    /**
     * 处理按钮弹框的输入
     * @returns {{ action: string|null, index: number }} 'confirm'|null
     */
    static handleButtonDialog(input, selectedIndex, btnCount, now) {
        // 左右切换按钮
        if (input.isJustPressed('ArrowLeft') || input.isJustPressed('KeyA')) {
            return { action: 'move', index: (selectedIndex - 1 + btnCount) % btnCount };
        }
        if (input.isJustPressed('ArrowRight') || input.isJustPressed('KeyD')) {
            return { action: 'move', index: (selectedIndex + 1) % btnCount };
        }

        // 确认
        if (input.isConfirmPressed(now)) {
            return { action: 'confirm', index: selectedIndex };
        }

        // 点击检测
        if (input.hasPendingClick()) {
            const click = input.getClick();
            if (click) {
                const clickedIdx = this._getButtonItemAt(click.x, click.y);
                if (clickedIdx >= 0) {
                    return { action: 'confirm', index: clickedIdx };
                }
            }
        }

        return null;
    }

    /** 按钮弹框点击检测 */
    static _getButtonItemAt(x, y) {
        const layout = UIRenderer.buttonDialogLayout;
        const boxX = (640 - layout.boxW) / 2;
        const boxY = (480 - layout.boxH) / 2;
        const btnW = layout.btnW, btnH = layout.btnH, gap = layout.btnGap;

        // 假设2个按钮（确认/取消）
        const totalBtnW = 2 * btnW + gap;
        const startBtnX = (640 - totalBtnW) / 2;

        for (let i = 0; i < 2; i++) {
            const bx = startBtnX + i * (btnW + gap);
            const by = boxY + 50;
            if (x >= bx && x <= bx + btnW && y >= by && y <= by + btnH) {
                return i;
            }
        }
        return -1;
    }

    // ════════════════════════════════════
    //   菜单按钮检测
    // ════════════════════════════════════

    /** 检测是否点击了菜单按钮 */
    static isMenuButtonClicked(input) {
        if (!input.hasPendingClick()) return false;
        const click = input.getClick();
        if (!click) return false;

        const layout = UIRenderer.menuButtonLayout;
        return click.x >= layout.x && click.x <= layout.x + layout.w &&
               click.y >= layout.y && click.y <= layout.y + layout.h;
    }

    /** 水平导航（用于初始精灵选择） */
    static handleHorizontalNav(input, currentIndex, count) {
        if (input.isJustPressed('ArrowLeft') || input.isJustPressed('KeyA')) {
            return (currentIndex - 1 + count) % count;
        }
        if (input.isJustPressed('ArrowRight') || input.isJustPressed('KeyD')) {
            return (currentIndex + 1) % count;
        }
        return currentIndex;
    }
}

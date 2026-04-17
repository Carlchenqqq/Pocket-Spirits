/**
 * BattleInputHandler - 战斗输入处理器
 * 负责键盘导航、触控点击检测
 * 将原始输入转化为语义化动作
 */
class BattleInputHandler {
    /**
     * 处理菜单/技能选择阶段的输入
     * @returns {string|null} 语义化动作：'attack'|'catch'|'switch'|'run'|'confirm_skill'|'back'|null
     */
    static handleMenuInput(input, phase, menuIndex, skillIndex, now, canvasWidth, canvasHeight) {
        // ─── 点击处理 ───
        if (input.hasPendingClick()) {
            const click = input.getClick();
            if (click) {
                // result 阶段：检测按钮点击
                if (phase === 'result') {
                    const btnW = 120, btnH = 35;
                    const btnX = (canvasWidth - btnW) / 2;
                    const btnY = canvasHeight / 2 + 40;
                    if (click.x >= btnX && click.x <= btnX + btnW &&
                        click.y >= btnY && click.y <= btnY + btnH) {
                        return 'confirm_result';
                    }
                    return null;
                }

                // 菜单阶段：坐标检测
                if (phase === 'menu') {
                    const idx = this._getMenuItemAt(click.x, click.y);
                    if (idx >= 0) return this._menuAction(idx);
                }

                // 技能选择阶段
                if (phase === 'skillSelect') {
                    const sIdx = this._getSkillItemAt(click.x, click.y);
                    if (sIdx >= 0) { return { type: 'select_skill', index: sIdx }; }

                    // B返回区域
                    if (click.x >= 560 && click.y >= 430 && click.y <= 445) {
                        return 'back';
                    }
                }
            }
        }

        // ─── 键盘处理：result 阶段 ───
        if (phase === 'result') {
            if (input.isConfirmPressed(now)) return 'confirm_result';
            return null;
        }

        // ─── 键盘处理：menu 阶段 ───
        let newMenuIndex = menuIndex;
        if (phase === 'menu') {
            newMenuIndex = this._navigateGrid2x2(input, menuIndex, now);
            if (typeof newMenuIndex === 'string') return newMenuIndex; // 是动作而非索引

            if (newMenuIndex !== menuIndex) {
                return { type: 'move_menu', index: newMenuIndex };
            }

            if (input.isConfirmPressed(now)) {
                return this._menuAction(menuIndex);
            }
        }

        // ─── 键盘处理：skillSelect 阶段 ───
        let newSkillIndex = skillIndex;
        if (phase === 'skillSelect') {
            newSkillIndex = this._navigateGrid2x2(input, skillIndex, now);
            if (typeof newSkillIndex === 'string') return newSkillIndex;

            if (newSkillIndex !== skillIndex) {
                return { type: 'move_skill', index: newSkillIndex };
            }

            if (input.isConfirmPressed(now)) return 'confirm_skill';
            if (input.isCancelPressed()) return 'back';
        }

        return null;
    }

    /** 2×2 网格导航（上下左右） */
    static _navigateGrid2x2(input, currentIndex, now) {
        if (input.isJustPressed('ArrowUp') || input.isJustPressed('KeyW')) {
            return currentIndex >= 2 ? currentIndex - 2 : currentIndex;
        }
        if (input.isJustPressed('ArrowDown') || input.isJustPressed('KeyS')) {
            return currentIndex <= 1 ? currentIndex + 2 : currentIndex;
        }
        if (input.isJustPressed('ArrowLeft') || input.isJustPressed('KeyA')) {
            return currentIndex % 2 === 1 ? currentIndex - 1 : currentIndex;
        }
        if (input.isJustPressed('ArrowRight') || input.isJustPressed('KeyD')) {
            return currentIndex % 2 === 0 ? currentIndex + 1 : currentIndex;
        }
        return currentIndex;
    }

    /** 菜单索引 → 动作映射 */
    static _menuAction(index) {
        switch (index) {
            case 0: return 'attack';
            case 1: return 'catch';
            case 2: return 'switch';
            case 3: return 'run';
            default: return null;
        }
    }

    /** 检测点击位置对应的菜单项 */
    static _getMenuItemAt(x, y) {
        const layout = BattleRenderer.menuLayout;
        const items = BattleRenderer.MENU_ITEMS;
        for (let i = 0; i < items.length; i++) {
            const col = i % 2;
            const row = Math.floor(i / 2);
            const ix = layout.x + 15 + col * 130;
            const iy = layout.y + 20 + row * 42;
            if (x >= ix - 5 && x <= ix + 115 && y >= iy - 12 && y <= iy + 18) {
                return i;
            }
        }
        return -1;
    }

    /** 检测点击位置对应的技能项 */
    static _getSkillItemAt(x, y, skillsLength = 4) {
        const layout = BattleRenderer.skillLayout;
        for (let i = 0; i < skillsLength; i++) {
            const col = i % 2;
            const row = Math.floor(i / 2);
            const sx = layout.x + 15 + col * 280;
            const sy = layout.y + 15 + row * 25;
            if (x >= sx - 5 && x <= sx + 260 && y >= sy - 10 && y <= sy + 12) {
                return i;
            }
        }
        return -1;
    }
}

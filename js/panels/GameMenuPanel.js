/**
 * GameMenuPanel - 游戏菜单面板
 * 从 ExploreScene.js 提取：_updateGameMenu, _executeMenuItem, _renderGameMenu
 */
class GameMenuPanel {
    constructor(game) {
        this.game = game;
        this.open = false;
        this.index = 0;
        this.items = ['精灵', '背包', '图鉴', '徽章', '任务', '保存', '读取', '删除存档', '关闭'];

        // 回调：由 ExploreScene 注入
        this.onOpenParty = null;       // 打开队伍菜单
        this.onOpenBag = null;         // 打开背包
        this.onOpenDex = null;         // 打开图鉴
        this.onOpenBadge = null;       // 打开徽章
        this.onOpenQuest = null;       // 打开任务
        this.onOpenSlotPicker = null;  // 打开存档槽选择器 (type: 'save'|'load')

        // 共享尺寸常量（update 和 render 必须一致）
        this.MENU_X = 10;
        this.MENU_Y = 30;
        this.HEADER_H = 50;            // 标题区域高度
        this.ITEM_H = 44;              // 每项行高
        this.ITEM_START_Y = this.MENU_Y + this.HEADER_H;
        this.menuW = 240;
    }

    get menuH() {
        return this.HEADER_H + this.items.length * this.ITEM_H + 10;
    }

    openMenu() {
        this.open = true;
        this.index = 0;
    }

    closeMenu() {
        this.open = false;
    }

    update(now) {
        const g = this.game;

        // 先处理键盘导航（更新高亮）
        if (g.input.isJustPressed('ArrowUp') || g.input.isJustPressed('KeyW')) {
            this.index = Math.max(0, this.index - 1);
            g.input.lastActionTime = now;
        }
        if (g.input.isJustPressed('ArrowDown') || g.input.isJustPressed('KeyS')) {
            this.index = Math.min(this.items.length - 1, this.index + 1);
            g.input.lastActionTime = now;
        }

        // 再处理点击（用与渲染相同的坐标）
        if (g.input.hasPendingClick()) {
            const click = g.input.getClick();
            if (click) {
                const DETECT_Y = this.ITEM_START_Y - 20;
                if (click.x >= this.MENU_X && click.x <= this.MENU_X + this.menuW &&
                    click.y >= DETECT_Y && click.y < DETECT_Y + this.items.length * this.ITEM_H) {
                    const idx = Math.floor((click.y - DETECT_Y) / this.ITEM_H);
                    if (idx >= 0 && idx < this.items.length) {
                        this._executeMenuItem(idx);
                        return;
                    }
                } else {
                    this.open = false;
                    return;
                }
            }
        }

        if (g.input.isConfirmPressed(now)) this._executeMenuItem(this.index);
        if (g.input.isCancelPressed()) this.open = false;
    }

    _executeMenuItem(index) {
        switch (index) {
            case 0: // 精灵
                if (this.onOpenParty) this.onOpenParty();
                break;
            case 1: // 背包
                if (this.onOpenBag) this.onOpenBag();
                break;
            case 2: // 图鉴
                if (this.onOpenDex) this.onOpenDex();
                break;
            case 3: // 徽章
                if (this.onOpenBadge) this.onOpenBadge();
                break;
            case 4: // 任务
                if (this.onOpenQuest) this.onOpenQuest();
                break;
            case 5: // 保存
                if (this.onOpenSlotPicker) this.onOpenSlotPicker('save');
                break;
            case 6: // 读取
                if (this.onOpenSlotPicker) this.onOpenSlotPicker('load');
                break;
            case 7: // 删除存档
                if (this.onOpenSlotPicker) this.onOpenSlotPicker('delete');
                break;
            case 8: // 关闭
                this.open = false;
                break;
        }
    }

    render() {
        const ctx = this.game.ctx;
        const { MENU_X, MENU_Y, ITEM_START_Y, ITEM_H, menuW, menuH } = this;

        // 背景
        ctx.fillStyle = 'rgba(0,0,0,0.85)';
        ctx.fillRect(MENU_X, MENU_Y, menuW, menuH);
        // 金色边框
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 3;
        ctx.strokeRect(MENU_X + 1, MENU_Y + 1, menuW - 2, menuH - 2);

        // 标题
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 22px monospace';
        ctx.fillText('菜单', MENU_X + 16, MENU_Y + 34);

        // 菜单项
        ctx.font = '22px monospace';
        this.items.forEach((item, i) => {
            const iy = ITEM_START_Y + i * ITEM_H;
            if (i === this.index) {
                // 选中项高亮背景
                ctx.fillStyle = 'rgba(255,215,0,0.2)';
                ctx.fillRect(MENU_X + 6, iy - 18, menuW - 12, 40);
                // 选中指示符
                ctx.fillStyle = '#FFD700';
                ctx.font = 'bold 22px monospace';
                ctx.fillText('▶', MENU_X + 14, iy + 6);
                ctx.font = '22px monospace';
            }
            ctx.fillStyle = i === this.index ? '#FFF' : '#AAA';
            ctx.fillText(item, MENU_X + 44, iy + 6);
        });
    }
}

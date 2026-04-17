/**
 * BadgePanel - 徽章面板
 * 从 ExploreScene.js 提取：_updateBadgePanel, _renderBadgePanel
 */
class BadgePanel {
    constructor(game) {
        this.game = game;
        this.open = false;
        this.scrollIndex = 0;
    }

    openBadge() {
        this.open = true;
        this.scrollIndex = 0;
    }

    closeBadge() {
        this.open = false;
    }

    update(now) {
        const g = this.game;
        if (g.input.hasPendingClick()) {
            const click = g.input.getClick();
            if (click) {
                // 返回按钮
                const backBtnW = 50, backBtnH = 22;
                const backBtnX = g.W - backBtnW - 10, backBtnY = 8;
                if (click.x >= backBtnX && click.x <= backBtnX + backBtnW &&
                    click.y >= backBtnY && click.y <= backBtnY + backBtnH) { this.closeBadge(); return; }
            }
        }
        if (g.input.isCancelPressed()) this.closeBadge();
    }

    render() {
        const ctx = this.game.ctx;
        const W = this.game.W, H = this.game.H;
        const cm = this.game.creaturesManager;

        ctx.fillStyle = 'rgba(0,0,0,0.85)';
        ctx.fillRect(0, 0, W, H);

        // 标题
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 20px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('道馆徽章', W / 2, 30);

        // 返回按钮
        const backBtnW = 50, backBtnH = 22;
        const backBtnX = W - backBtnW - 10, backBtnY = 8;
        ctx.fillStyle = 'rgba(255, 215, 0, 0.15)';
        ctx.fillRect(backBtnX, backBtnY, backBtnW, backBtnH);
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 1;
        ctx.strokeRect(backBtnX, backBtnY, backBtnW, backBtnH);
        ctx.fillStyle = '#FFD700';
        ctx.font = '12px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('← 返回', backBtnX + backBtnW / 2, backBtnY + 15);
        ctx.textAlign = 'left';

        // 调用 CreaturesManager 内置的徽章面板渲染
        cm.renderBadgePanel(ctx, 30, 55, W - 60);
    }
}

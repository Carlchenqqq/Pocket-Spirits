/**
 * QuestPanel - 任务面板
 * 从 ExploreScene.js 提取：_updateQuestPanel, _renderQuestPanel
 */
class QuestPanel {
    constructor(game) {
        this.game = game;
        this.open = false;
        this.scrollIndex = 0;
    }

    openQuest() {
        this.open = true;
        this.scrollIndex = 0;
    }

    closeQuest() {
        this.open = false;
    }

    update(now) {
        const g = this.game;
        const quests = g.quests || {};
        const questKeys = Object.keys(quests);
        const maxVisible = 8;

        if (g.input.hasPendingClick()) {
            const click = g.input.getClick();
            if (click) {
                // 返回按钮
                const backBtnW = 50, backBtnH = 22;
                const backBtnX = g.W - backBtnW - 10, backBtnY = 8;
                if (click.x >= backBtnX && click.x <= backBtnX + backBtnW &&
                    click.y >= backBtnY && click.y <= backBtnY + backBtnH) { this.closeQuest(); return; }
            }
        }
        if (g.input.isJustPressed('ArrowUp') || g.input.isJustPressed('KeyW')) this.scrollIndex = Math.max(0, this.scrollIndex - 1);
        if (g.input.isJustPressed('ArrowDown') || g.input.isJustPressed('KeyS')) this.scrollIndex = Math.min(questKeys.length - 1, this.scrollIndex + 1);
        if (g.input.isCancelPressed()) this.closeQuest();
    }

    render() {
        const ctx = this.game.ctx;
        const W = this.game.W, H = this.game.H;
        const g = this.game;
        const quests = g.quests || {};
        const questKeys = Object.keys(quests);

        ctx.fillStyle = 'rgba(0,0,0,0.85)';
        ctx.fillRect(0, 0, W, H);

        // 标题
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 20px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('任务日志', W / 2, 30);

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

        // 统计
        const active = questKeys.filter(k => quests[k] === 'active').length;
        const completed = questKeys.filter(k => quests[k] === 'completed').length;
        ctx.font = '12px monospace';
        ctx.fillStyle = '#AAA';
        ctx.textAlign = 'center';
        ctx.fillText(`进行中: ${active}  已完成: ${completed}`, W / 2, 52);
        ctx.textAlign = 'left';

        if (questKeys.length === 0) {
            ctx.textAlign = 'center';
            ctx.fillStyle = '#666';
            ctx.font = '14px monospace';
            ctx.fillText('暂无任务记录', W / 2, H / 2);
        } else {
            const startY = 70;
            const itemH = 40;
            const maxVisible = Math.floor((H - startY - 30) / itemH);
            const scrollStart = Math.max(0, Math.min(this.scrollIndex, questKeys.length - maxVisible));
            const scrollEnd = Math.min(questKeys.length, scrollStart + maxVisible);

            for (let i = scrollStart; i < scrollEnd; i++) {
                const qId = questKeys[i];
                const status = quests[qId];
                const y = startY + (i - scrollStart) * itemH;
                const isSelected = i === this.scrollIndex;

                if (isSelected) {
                    ctx.fillStyle = 'rgba(255,215,0,0.1)';
                    ctx.fillRect(20, y, W - 40, itemH - 4);
                    ctx.strokeStyle = 'rgba(255,215,0,0.4)';
                    ctx.lineWidth = 1;
                    ctx.strokeRect(20, y, W - 40, itemH - 4);
                }

                // 任务 ID（截短显示）
                ctx.font = 'bold 13px monospace';
                ctx.fillStyle = '#FFF';
                ctx.textAlign = 'left';
                ctx.fillText(qId.length > 20 ? qId.substring(0, 20) + '...' : qId, 35, y + 18);

                // 状态标签
                const isActive = status === 'active';
                const isCompleted = status === 'completed';
                ctx.font = '11px monospace';
                if (isCompleted) {
                    ctx.fillStyle = '#4CAF50';
                    ctx.fillText('已完成', W - 100, y + 18);
                } else if (isActive) {
                    ctx.fillStyle = '#FFC107';
                    ctx.fillText('进行中', W - 100, y + 18);
                }
            }
        }

        ctx.textAlign = 'center';
        ctx.fillStyle = '#888';
        ctx.font = '12px monospace';
        ctx.fillText('↑↓浏览  ESC关闭', W / 2, H - 12);
        ctx.textAlign = 'left';
    }
}

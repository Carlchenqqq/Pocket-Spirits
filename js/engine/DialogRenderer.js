/**
 * DialogRenderer - 对话渲染器（纯渲染层）
 * 负责对话框绘制：文本框、头像、打字机文字、选项列表
 */
class DialogRenderer {
    constructor(ctx, canvas) {
        this.ctx = ctx;
        this.W = canvas.width;
        this.H = canvas.height;
    }

    /** 主渲染入口 */
    render(state) {
        if (!state || !state.active) return;
        const ctx = this.ctx;

        switch (state.boxStyle) {
            case 'narrator':
                this._renderNarratorBox(ctx, state);
                break;
            case 'system':
                this._renderSystemBox(ctx, state);
                break;
            default:
                this._renderDefaultBox(ctx, state);
        }

        // 选项（在最后一页打完后显示）
        if (state.choices && state.choices.length > 0 && state.charIndex >= this._getCurrentTextLen(state)) {
            this._renderChoices(ctx, state);
        }
    }

    // ─── 默认对话框（底部，带头像） ───
    _renderDefaultBox(ctx, s) {
        const boxX = 20, boxY = 340, boxW = 600, boxH = 130;

        // 背景
        ctx.fillStyle = 'rgba(10, 10, 30, 0.92)';
        ctx.fillRect(boxX, boxY, boxW, boxH);

        // 边框
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 2;
        ctx.strokeRect(boxX, boxY, boxW, boxH);

        // 内部装饰线
        ctx.strokeStyle = 'rgba(255, 215, 0, 0.3)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(boxX + 4, boxY + 4);
        ctx.lineTo(boxX + boxW - 4, boxY + 4);
        ctx.stroke();

        // 发言者名称
        if (s.speaker) {
            ctx.fillStyle = '#FFD700';
            ctx.font = 'bold 14px monospace';
            ctx.fillText(s.speaker, boxX + 15, boxY + 24);
            // 分隔线
            ctx.strokeStyle = 'rgba(255, 215, 0, 0.5)';
            ctx.beginPath();
            ctx.moveTo(boxX + 12, boxY + 32);
            ctx.lineTo(boxX + boxW - 12, boxY + 32);
            ctx.stroke();
        }

        // 文本内容
        const textStartY = s.speaker ? boxY + 52 : boxY + 22;
        ctx.fillStyle = '#EEE';
        ctx.font = '14px monospace';
        this._drawWrappedText(ctx, s.displayedText || '', boxX + 18, textStartY, boxW - 36, 20);

        // 继续指示器
        if (!this._hasMoreContent(s)) {
            ctx.fillStyle = 'rgba(255, 215, 0, 0.7)';
            ctx.font = '16px sans-serif';
            ctx.fillText('▼', boxX + boxW - 30, boxY + boxH - 12);
        }
    }

    // ─── 旁白框（居中） ───
    _renderNarratorBox(ctx, s) {
        const boxX = 40, boxY = this.H * 0.3, boxW = this.W - 80, boxH = 120;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(boxX, boxY, boxW, boxH);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 1;
        ctx.strokeRect(boxX, boxY, boxW, boxH);

        ctx.fillStyle = '#CCC';
        ctx.font = 'italic 15px monospace';
        ctx.textAlign = 'center';
        this._drawWrappedText(ctx, s.displayedText || '', boxX, boxY + 35, boxW, 22);
        ctx.textAlign = 'left';
    }

    // ─── 系统提示框（顶部小条） ───
    _renderSystemBox(ctx, s) {
        const boxX = 50, boxY = 30, boxW = this.W - 100, boxH = 45;

        ctx.fillStyle = 'rgba(65, 105, 225, 0.9)';
        ctx.fillRect(boxX, boxY, boxW, boxH);
        ctx.strokeStyle = '#87CEEB';
        ctx.lineWidth = 1;
        ctx.strokeRect(boxX, boxY, boxW, boxH);

        ctx.fillStyle = '#FFF';
        ctx.font = '14px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(s.displayedText || '', this.W / 2, boxY + 28);
        ctx.textAlign = 'left';
    }

    // ─── 选项列表 ───
    _renderChoices(ctx, s) {
        const choices = s.choices;
        if (!choices || choices.length === 0) return;

        const choiceBoxY = 200;
        const choiceItemH = 28;

        choices.forEach((choice, i) => {
            const cy = choiceBoxY + i * choiceItemH;
            const isSelected = i === s.selectedChoice;

            // 高亮背景
            if (isSelected) {
                ctx.fillStyle = 'rgba(255, 215, 0, 0.2)';
                ctx.fillRect(100, cy - 2, 440, choiceItemH - 2);
            }

            // 游标
            ctx.fillStyle = isSelected ? '#FFD700' : '#888';
            ctx.font = '14px monospace';
            ctx.fillText(isSelected ? '▶' : '  ', 110, cy + 17);

            // 选项文字
            ctx.fillStyle = isSelected ? '#FFF' : '#BBB';
            ctx.fillText(choice, 135, cy + 17);
        });
    }

    // ─── 工具方法 ───

    /** 自动换行绘制文本 */
    _drawWrappedText(ctx, text, x, y, maxWidth, lineHeight) {
        if (!text) return;
        const chars = text.split('');
        let line = '';
        for (const char of chars) {
            const testLine = line + char;
            if (ctx.measureText(testLine).width > maxWidth && line.length > 0) {
                ctx.fillText(line, x, y);
                line = char;
                y += lineHeight;
            } else {
                line = testLine;
            }
        }
        if (line) ctx.fillText(line, x, y);
    }

    /** 当前页面文本总长度 */
    _getCurrentTextLen(s) {
        return (s.pages[s.currentPage] || '').length;
    }

    /** 是否还有更多内容（更多页或未打完） */
    _hasMoreContent(s) {
        const pageText = s.pages[s.currentPage] || '';
        if (s.charIndex < pageText.length) return true; // 还在打字
        return s.currentPage < s.pages.length - 1;     // 还有更多页
    }
}

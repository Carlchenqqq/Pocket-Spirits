/**
 * UIRenderer - 通用 UI 渲染组件（无状态）
 * 提供可复用的 UI 渲染方法：HP条、消息提示、按钮弹框、HUD 等
 * 所有方法都是 static 或实例方法的纯绘制，不保存状态
 */
class UIRenderer {
    constructor(ctx, canvas) {
        this.ctx = ctx;
        this.W = canvas.width;
        this.H = canvas.height;
    }

    // ════════════════════════════════════
    //   HP 条
    // ════════════════════════════════════

    /** 渲染 HP 条（带颜色渐变和光泽效果） */
    renderHPBar(x, y, w, h, current, max) {
        const ctx = this.ctx;
        const ratio = Math.max(0, current / max);

        // 背景
        ctx.fillStyle = '#333';
        ctx.fillRect(x + 1, y, w - 2, h);
        ctx.fillRect(x, y + 1, w, h - 2);

        // 颜色：绿→黄→红
        const color = ratio > 0.5 ? '#4CAF50' : ratio > 0.2 ? '#FFC107' : '#F44336';

        if (ratio > 0) {
            const barW = Math.max(2, (w - 2) * ratio);
            ctx.fillStyle = color;
            ctx.fillRect(x + 1, y + 1, barW, h - 2);
            ctx.fillRect(x + 2, y, barW - 2, h);
        }

        // 光泽
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.fillRect(x + 2, y + 1, Math.max(0, (w - 4) * ratio), 1);

        // 边框
        ctx.strokeStyle = '#555';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, w, h);
    }

    // ════════════════════════════════════
    //   消息提示 Toast
    // ════════════════════════════════════

    /**
     * 渲染顶部居中消息提示
     * @param {string} message - 消息文本
     */
    renderMessage(message) {
        if (!message) return;

        const ctx = this.ctx;
        ctx.font = '14px monospace';
        const tw = ctx.measureText(message).width;
        const boxW = tw + 24, boxH = 28;
        const boxX = (this.W - boxW) / 2, boxY = 10;

        ctx.fillStyle = 'rgba(0,0,0,0.8)';
        ctx.fillRect(boxX, boxY, boxW, boxH);
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 1;
        ctx.strokeRect(boxX, boxY, boxW, boxH);

        ctx.fillStyle = '#FFF';
        ctx.textAlign = 'center';
        ctx.fillText(message, this.W / 2, boxY + 19);
        ctx.textAlign = 'left';
    }

    // ════════════════════════════════════
    //   按钮确认弹框
    // ════════════════════════════════════

    /**
     * 渲染按钮确认弹框
     * @param {object} opts - { text, buttons, selectedIndex }
     * @returns {{ btnRects: Array<{x,y,w,h}> }} 按钮位置信息（供点击检测用）
     */
    renderButtonDialog(opts) {
        const ctx = this.ctx;
        const { text, buttons, selectedIndex } = opts;
        const boxW = 300, boxH = 100;
        const boxX = (this.W - boxW) / 2, boxY = (this.H - boxH) / 2;

        // 背景
        ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
        ctx.fillRect(boxX, boxY, boxW, boxH);
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 2;
        ctx.strokeRect(boxX + 1, boxY + 1, boxW - 2, boxH - 2);

        // 文本
        ctx.fillStyle = '#FFF';
        ctx.font = '14px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(text, this.W / 2, boxY + 30);
        ctx.textAlign = 'left';

        // 按钮
        const btnW = 100, btnH = 30;
        const totalBtnW = buttons.length * btnW + (buttons.length - 1) * 20;
        const startBtnX = (this.W - totalBtnW) / 2;
        const btnRects = [];

        buttons.forEach((btn, i) => {
            const bx = startBtnX + i * (btnW + 20);
            const by = boxY + 50;
            const sel = i === selectedIndex;

            ctx.fillStyle = sel ? 'rgba(255,215,0,0.3)' : 'rgba(60,60,60,0.8)';
            ctx.fillRect(bx, by, btnW, btnH);
            ctx.strokeStyle = sel ? '#FFD700' : '#888';
            ctx.lineWidth = sel ? 2 : 1;
            ctx.strokeRect(bx, by, btnW, btnH);

            ctx.fillStyle = sel ? '#FFD700' : '#CCC';
            ctx.font = '13px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(btn, bx + btnW / 2, by + 20);
            ctx.textAlign = 'left';

            btnRects.push({ x: bx, y: by, w: btnW, h: btnH });
        });

        return { boxX, boxY, btnRects };
    }

    /** 获取按钮弹框的布局信息（供 InputHandler 使用） */
    static get buttonDialogLayout() {
        return { boxW: 300, boxH: 100, btnW: 100, btnH: 30, btnGap: 20 };
    }

    // ════════════════════════════════════
    //   HUD
    // ════════════════════════════════════

    /**
     * 渲染游戏 HUD（地图名、金币、菜单按钮）
     * @param {string|null} mapName
     * @param {number} gold
     * @returns {{ menuBtnX, menuBtnY, menuBtnW, menuBtnH }} 菜单按钮位置
     */
    renderHUD(mapName, gold) {
        const ctx = this.ctx;

        // 地图名
        if (mapName) {
            ctx.fillStyle = 'rgba(0,0,0,0.6)';
            ctx.fillRect(5, 5, 110, 20);
            ctx.fillStyle = '#FFF';
            ctx.font = '12px monospace';
            ctx.fillText(mapName, 10, 19);
        }

        // 金币
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(this.W - 115, 5, 110, 20);
        ctx.fillStyle = '#FFD700';
        ctx.font = '12px monospace';
        ctx.fillText(`金币: ${gold}`, this.W - 110, 19);

        // 菜单按钮
        const mbx = this.W - 50, mby = this.H - 40, mbw = 40, mbh = 30;
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(mbx, mby, mbw, mbh);
        ctx.strokeStyle = 'rgba(255,215,0,0.6)';
        ctx.lineWidth = 1;
        ctx.strokeRect(mbx, mby, mbw, mbh);
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 14px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('☰', mbx + mbw / 2, mby + 21);
        ctx.textAlign = 'left';

        return { menuBtnX: mbx, menuBtnY: mby, menuBtnW: mbw, menuBtnH: mbh };
    }

    /** 获取菜单按钮布局（供点击检测） */
    static get menuButtonLayout() {
        return { x: 640 - 50, y: 480 - 40, w: 40, h: 30 };
    }
}

/**
 * SlotPickerPanel - 存档槽位选择器面板
 * 从 ExploreScene.js 提取：_getSlotPickerCardRects, _updateSlotPicker, _confirmSlotPickerAction, _renderSlotPicker
 */
class SlotPickerPanel {
    constructor(game) {
        this.game = game;
        this.active = false;
        this.type = null;    // 'save' | 'load'
        this.index = 0;      // 当前选中的槽
        this.cardRects = []; // 槽位卡片点击区域
    }

    openSlotPicker(type) {
        this.active = true;
        this.type = type;
        this.index = 0;
        this.cardRects = [];
    }

    closeSlotPicker() {
        this.active = false;
    }

    /** 计算存档选择器卡片位置 */
    _getSlotPickerCardRects(W, H) {
        const panelW = Math.min(340, W - 40);
        const panelH = 150;
        const px = (W - panelW) / 2;
        const py = (H - panelH) / 2 + 20;
        const cardW = (panelW - 25) / 3;
        const cardH = panelH - 50;
        const cardY = py + 32;
        const rects = [];
        for (let i = 0; i < 3; i++) {
            const cx = px + 8 + i * (cardW + 3);
            rects.push({ x: cx, y: cardY, w: cardW, h: cardH });
        }
        return rects;
    }

    update(now) {
        const g = this.game;
        const slotCount = g.saveManager.getSlotCount();

        // 方向键切换槽位（使用 isJustPressed 检测按键）
        if (g.input.isJustPressed('ArrowLeft') || g.input.isJustPressed('KeyA')) {
            this.index = (this.index - 1 + slotCount) % slotCount;
            g.input.lastActionTime = now;
        } else if (g.input.isJustPressed('ArrowRight') || g.input.isJustPressed('KeyD')) {
            this.index = (this.index + 1) % slotCount;
            g.input.lastActionTime = now;
        }

        // 鼠标点击检测
        if (g.input.hasPendingClick()) {
            const click = g.input.getClick();
            if (!click) return;

            // 实时计算卡片位置（避免依赖渲染时填充的 cardRects）
            const cardRects = this._getSlotPickerCardRects(g.canvas.width, g.canvas.height);

            // 检查是否点击了某个槽位卡片
            for (let i = 0; i < cardRects.length; i++) {
                const rect = cardRects[i];
                if (click.x >= rect.x && click.x <= rect.x + rect.w &&
                    click.y >= rect.y && click.y <= rect.y + rect.h) {
                    this.index = i;
                    // 点击后直接执行保存/读取
                    this._confirmAction(now);
                    return;
                }
            }
        }

        // 确认
        if (g.input.isConfirmPressed(now)) {
            this._confirmAction(now);
        }

        // 取消
        if (g.input.isCancelPressed(now)) {
            g.input.lastActionTime = now;
            this.closeSlotPicker();
        }
    }

    /** 确认槽位选择并执行保存/读取 */
    _confirmAction(now) {
        const g = this.game;
        g.input.lastActionTime = now;
        const slot = this.index;

        if (this.type === 'save') {
            if (g.saveManager.save(g, slot)) {
                g.ui.showMessage(`已保存到存档 ${slot + 1}！`);
            } else {
                g.ui.showMessage('保存失败！');
            }
        } else if (this.type === 'load') {
            if (g.saveManager.hasSlotSave(slot)) {
                if (g.saveManager.load(g, slot)) {
                    g.ui.showMessage(`已从存档 ${slot + 1} 读取！`);
                } else {
                    g.ui.showMessage('读取失败！');
                }
            } else {
                g.ui.showMessage(`存档 ${slot + 1} 为空`);
            }
        }
        this.closeSlotPicker();
    }

    render() {
        const ctx = this.game.ctx;
        const W = this.game.W, H = this.game.H;
        const g = this.game;

        const panelW = Math.min(360, W - 40);
        const panelH = 150;
        const px = (W - panelW) / 2;
        const py = (H - panelH) / 2 + 10;

        // 半透明背景遮罩
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, W, H);

        // 面板背景
        ctx.fillStyle = 'rgba(10, 15, 35, 0.95)';
        ctx.strokeStyle = this.type === 'save' ? 'rgba(76, 175, 80, 0.6)' : 'rgba(100, 150, 255, 0.6)';
        ctx.lineWidth = 2;
        this._roundRect(ctx, px, py, panelW, panelH, 10);
        ctx.fill();
        ctx.stroke();

        // 标题
        const titleText = this.type === 'save' ? '— 保存游戏 —' : '— 读取存档 —';
        ctx.fillStyle = this.type === 'save' ? '#81C784' : '#6ab7ff';
        ctx.font = 'bold 14px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(titleText, W / 2, py + 22);

        // 3个槽位卡片
        const cardW = (panelW - 25) / 3;
        const cardH = panelH - 50;
        const cardY = py + 32;
        const summaries = g.saveManager.getSlotSummaries();

        // 清空并重新记录点击区域
        this.cardRects = [];

        for (let i = 0; i < 3; i++) {
            const cx = px + 8 + i * (cardW + 3);
            const summary = summaries[i];
            const selected = i === this.index;

            // 记录点击区域
            this.cardRects.push({ x: cx, y: cardY, w: cardW, h: cardH });

            if (selected) {
                ctx.fillStyle = 'rgba(80, 140, 255, 0.2)';
                ctx.strokeStyle = '#6ab7ff';
                ctx.lineWidth = 2;
            } else {
                ctx.fillStyle = summary.empty ? 'rgba(30, 35, 60, 0.8)' : 'rgba(30, 45, 80, 0.65)';
                ctx.strokeStyle = 'rgba(80, 110, 180, 0.3)';
                ctx.lineWidth = 1;
            }
            this._roundRect(ctx, cx, cardY, cardW, cardH, 6);
            ctx.fill();
            ctx.stroke();

            // 鼠标悬停效果
            if (g.input.mouseX >= cx && g.input.mouseX <= cx + cardW &&
                g.input.mouseY >= cardY && g.input.mouseY <= cardY + cardH) {
                ctx.fillStyle = 'rgba(100, 160, 255, 0.15)';
                this._roundRect(ctx, cx, cardY, cardW, cardH, 6);
                ctx.fill();
            }

            ctx.fillStyle = selected ? '#6ab7ff' : '#8899bb';
            ctx.font = 'bold 11px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(`存档 ${i + 1}`, cx + cardW / 2, cardY + 16);

            if (summary.empty) {
                ctx.fillStyle = '#556';
                ctx.font = '10px monospace';
                ctx.fillText('— 空 —', cx + cardW / 2, cardY + cardH / 2 + 4);
            } else {
                ctx.textAlign = 'center';
                ctx.fillStyle = '#aabbdd';
                ctx.font = '8px monospace';
                ctx.fillText(summary.timeStr, cx + cardW / 2, cardY + 32);

                const mapNames = {
                    qingye_town: '青叶镇', town1: '青叶镇', route1: '一号道路',
                    forest_1: '迷雾森林', cave_1: '岩石洞穴', city_gym: '道馆城',
                    port_town: '港口镇', mountain_path: '山间小径',
                    volcanic_cave: '火山洞窟', ice_cave: '冰之洞窟',
                    desert_ruins: '沙漠遗迹', sky_tower: '天空塔',
                };
                ctx.fillStyle = '#99bbee';
                ctx.fillText(mapNames[summary.mapId] || summary.mapId || '?', cx + cardW / 2, cardY + 46);

                ctx.fillStyle = '#88aacc';
                ctx.font = '8px monospace';
                ctx.fillText(`Lv.${summary.topLevel} 🏅${summary.badgeCount} 💰${summary.gold}`, cx + cardW / 2, cardY + 60);
            }

            if (selected) {
                ctx.fillStyle = '#FFD700';
                ctx.font = 'bold 12px monospace';
                ctx.fillText('▼', cx + cardW / 2, cardY + cardH + 12);
            }
        }

        // 底部提示
        ctx.fillStyle = '#7799BB';
        ctx.font = '10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('← → 选择 / 点击卡片   确认 执行   取消 返回', W / 2, py + panelH + 16);
        ctx.textAlign = 'left';
    }

    /** 辅助：绘制圆角矩形路径 */
    _roundRect(ctx, x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
    }
}

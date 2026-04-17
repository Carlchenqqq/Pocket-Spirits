/**
 * TitleScene - 标题画面场景
 * 支持多槽位存档选择
 */
class TitleScene extends Scene {
    constructor(game) {
        super(game);
        this.id = 'title';
        this.titleAlpha = 0;
        this.titleBlink = 0;
        // 多槽选择状态
        this.slotSelectMode = false;
        this.slotSelectIndex = 0;
        this.slotSummaries = [];
        // 槽位卡片点击区域（用于鼠标交互）
        this.slotCardRects = [];
    }

    onEnter() {
        this.titleAlpha = 0;
        this.titleBlink = 0;
        this.slotSelectMode = false;
        this.slotSelectIndex = 0;
        // 预加载槽位摘要（确保始终是有效数组）
        try {
            this.slotSummaries = this.game.saveManager.getSlotSummaries();
            if (!Array.isArray(this.slotSummaries) || this.slotSummaries.length === 0) {
                this.slotSummaries = [{ slot: 0, empty: true }, { slot: 1, empty: true }, { slot: 2, empty: true }];
            }
        } catch (e) {
            console.error('[TitleScene] 加载存档摘要失败:', e);
            this.slotSummaries = [{ slot: 0, empty: true }, { slot: 1, empty: true }, { slot: 2, empty: true }];
        }
    }

    update(deltaTime) {
        const g = this.game;

        this.titleAlpha = Math.min(1, this.titleAlpha + deltaTime * 0.001);
        this.titleBlink += deltaTime;

        // 处理按钮弹框输入
        if (g.ui.buttonDialogActive) {
            g.ui.handleButtonDialogInput(g.input, performance.now());
            return;
        }

        if ((g.input.anyKeyPressed() || g.input.hasPendingClick()) && g.dataLoaded) {
            // 槽位选择模式下的输入（不要提前清除点击，让 _handleSlotInput 自己处理）
            if (this.slotSelectMode) {
                this._handleSlotInput(g);
                return;
            }
            // 非选择模式下，如果有待处理点击，清除它
            if (g.input.hasPendingClick()) g.input.clearClick();

            // 正常进入：检查是否有存档
            if (g.saveManager.hasSave()) {
                this.slotSelectMode = true;
                this.slotSelectIndex = 0;
                // 安全获取存档摘要
                try {
                    this.slotSummaries = g.saveManager.getSlotSummaries();
                    if (!Array.isArray(this.slotSummaries)) {
                        this.slotSummaries = [{ slot: 0, empty: true }, { slot: 1, empty: true }, { slot: 2, empty: true }];
                    }
                } catch (e) {
                    console.error('[TitleScene] 获取存档摘要失败:', e);
                    this.slotSummaries = [{ slot: 0, empty: true }, { slot: 1, empty: true }, { slot: 2, empty: true }];
                }
                // 默认选中第一个有存档的槽位
                for (let i = 0; i < this.slotSummaries.length; i++) {
                    if (!this.slotSummaries[i].empty) { this.slotSelectIndex = i; break; }
                }
            } else {
                g.sceneManager.switchTo('explore');
            }
        }
    }

    /** 计算存档卡片位置（用于点击检测） */
    _getSlotCardRects(W, H) {
        const panelW = Math.min(380, W - 40);
        const panelH = 170;
        const px = (W - panelW) / 2;
        const py = (H - panelH) / 2 + 20;
        const cardW = (panelW - 30) / 3;
        const cardH = panelH - 55;
        const cardY = py + 36;
        const rects = [];
        for (let i = 0; i < 3; i++) {
            const cx = px + 10 + i * (cardW + 5);
            rects.push({ x: cx, y: cardY, w: cardW, h: cardH });
        }
        return rects;
    }

    /** 处理槽位选择的输入（键盘 + 鼠标） */
    _handleSlotInput(g) {
        const now = performance.now();
        const slotCount = g.saveManager.getSlotCount();

        // 左右切换槽位（使用 isJustPressed 检测按键）
        if (g.input.isJustPressed('ArrowLeft') || g.input.isJustPressed('KeyA')) {
            g.input.lastActionTime = now;
            this.slotSelectIndex = (this.slotSelectIndex - 1 + slotCount) % slotCount;
        } else if (g.input.isJustPressed('ArrowRight') || g.input.isJustPressed('KeyD')) {
            g.input.lastActionTime = now;
            this.slotSelectIndex = (this.slotSelectIndex + 1) % slotCount;
        }

        // 鼠标点击检测
        if (g.input.hasPendingClick()) {
            const click = g.input.getClick();
            if (!click) return;

            // 实时计算卡片位置（避免依赖渲染时填充的 slotCardRects）
            const cardRects = this._getSlotCardRects(g.canvas.width, g.canvas.height);

            // 调试输出
            console.log('Click at:', click.x, click.y);
            console.log('Card rects:', cardRects);

            // 检查是否点击了某个槽位卡片
            for (let i = 0; i < cardRects.length; i++) {
                const rect = cardRects[i];
                if (click.x >= rect.x && click.x <= rect.x + rect.w &&
                    click.y >= rect.y && click.y <= rect.y + rect.h) {
                    console.log('Clicked card', i);
                    this.slotSelectIndex = i;
                    // 点击后直接确认进入
                    this._confirmSlotSelection(g);
                    return;
                }
            }
        }

        if (g.input.isConfirmPressed(now)) {
            this._confirmSlotSelection(g);
        }

        if (g.input.isCancelPressed(now)) {
            g.input.lastActionTime = now;
            this.slotSelectMode = false;
            // 取消选择 → 回到普通标题画面（不进入游戏）
        }
    }

    /** 确认槽位选择并进入游戏 */
    _confirmSlotSelection(g) {
        const now = performance.now();
        g.input.lastActionTime = now;
        const slot = this.slotSelectIndex;
        const summary = this.slotSummaries[slot];

        // 安全检查：确保 summary 有效
        if (summary && !summary.empty) {
            // 有存档 → 加载
            try {
                const loaded = g.saveManager.load(g, slot);
                if (loaded) {
                    console.log(`[TitleScene] 读取存档 ${slot + 1} 成功`);
                } else {
                    console.warn(`[TitleScene] 读取存档 ${slot + 1} 失败，开始新游戏`);
                }
            } catch (e) {
                console.error('[TitleScene] 加载存档异常:', e);
            }
        }
        // 无论空还是有存档，确认后都进入游戏
        this.slotSelectMode = false;
        g.sceneManager.switchTo('explore');
    }

    render(ctx) {
        const W = this.game.W, H = this.game.H;

        // 背景
        const gradient = ctx.createLinearGradient(0, 0, 0, H);
        gradient.addColorStop(0, '#1a1a2e');
        gradient.addColorStop(0.5, '#16213e');
        gradient.addColorStop(1, '#0f3460');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, W, H);

        // 装饰星星
        ctx.fillStyle = '#FFF';
        for (let i = 0; i < 30; i++) {
            const sx = (i * 137 + 50) % W;
            const sy = (i * 97 + 30) % H;
            const size = (i % 3) + 1;
            ctx.fillRect(sx, sy, size, size);
        }

        // 标题
        ctx.globalAlpha = this.titleAlpha;
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 28px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('精灵纪元', W / 2, H / 2 - 60);

        ctx.fillStyle = '#FFF';
        ctx.font = '12px monospace';
        ctx.fillText('Pocket Spirits', W / 2, H / 2 - 35);

        // 闪烁提示
        if (!this.slotSelectMode && Math.floor(this.titleBlink / 600) % 2 === 0) {
            ctx.fillStyle = '#AAA';
            ctx.font = '11px monospace';
            ctx.fillText('按任意键开始', W / 2, H / 2 + 40);
        }

        // 版本信息
        ctx.fillStyle = '#666';
        ctx.font = '9px monospace';
        ctx.fillText('v1.0 Demo', W / 2, H - 15);

        ctx.globalAlpha = 1;

        // ===== 存档槽位选择面板 =====
        if (this.slotSelectMode) {
            this._renderSlotPanel(ctx, W, H);
        } else {
            // 渲染按钮弹框（非选槽时）
            this.game.ui.renderButtonDialog();
        }

        ctx.textAlign = 'left';
    }

    /** 渲染存档槽位选择面板 */
    _renderSlotPanel(ctx, W, H) {
        const panelW = Math.min(380, W - 40);
        const panelH = 170;
        const px = (W - panelW) / 2;
        const py = (H - panelH) / 2 + 20;

        // 半透明背景
        ctx.fillStyle = 'rgba(10, 15, 35, 0.92)';
        ctx.strokeStyle = 'rgba(100, 150, 255, 0.5)';
        ctx.lineWidth = 2;
        roundRect(ctx, px, py, panelW, panelH, 12);
        ctx.fill();
        ctx.stroke();

        // 标题
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 14px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('— 选择存档 —', W / 2, py + 24);

        // 3个槽位卡片
        const cardW = (panelW - 30) / 3;
        const cardH = panelH - 55;
        const cardY = py + 36;

        // 清空并重新记录点击区域
        this.slotCardRects = [];

        for (let i = 0; i < 3; i++) {
            const cx = px + 10 + i * (cardW + 5);
            const summary = this.slotSummaries[i];
            const selected = i === this.slotSelectIndex;

            // 记录点击区域
            this.slotCardRects.push({ x: cx, y: cardY, w: cardW, h: cardH });

            // 卡片背景
            if (selected) {
                ctx.fillStyle = 'rgba(80, 140, 255, 0.25)';
                ctx.strokeStyle = '#6ab7ff';
                ctx.lineWidth = 2;
            } else {
                ctx.fillStyle = summary.empty ? 'rgba(30, 35, 60, 0.8)' : 'rgba(30, 45, 80, 0.7)';
                ctx.strokeStyle = 'rgba(100, 130, 200, 0.3)';
                ctx.lineWidth = 1;
            }
            roundRect(ctx, cx, cardY, cardW, cardH, 8);
            ctx.fill();
            ctx.stroke();

            // 鼠标悬停效果
            if (this.game.input.mouseX >= cx && this.game.input.mouseX <= cx + cardW &&
                this.game.input.mouseY >= cardY && this.game.input.mouseY <= cardY + cardH) {
                ctx.fillStyle = 'rgba(100, 160, 255, 0.15)';
                roundRect(ctx, cx, cardY, cardW, cardH, 8);
                ctx.fill();
            }

            // 槽位标签
            ctx.fillStyle = selected ? '#6ab7ff' : '#8899bb';
            ctx.font = 'bold 12px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(`存档 ${i + 1}`, cx + cardW / 2, cardY + 18);

            if (summary.empty) {
                // 空槽位
                ctx.fillStyle = '#556';
                ctx.font = '10px monospace';
                ctx.fillText('— 空 —', cx + cardW / 2, cardY + cardH / 2 + 4);
                ctx.fillStyle = '#445';
                ctx.font = '9px monospace';
                ctx.fillText('按确认开始新游戏', cx + cardW / 2, cardY + cardH / 2 + 22);
            } else {
                // 有存档信息
                const yBase = cardY + 34;
                ctx.textAlign = 'center';

                // 时间
                ctx.fillStyle = '#aabbdd';
                ctx.font = '9px monospace';
                ctx.fillText(summary.timeStr, cx + cardW / 2, yBase);

                // 地图
                ctx.fillStyle = '#99bbee';
                ctx.font = '9px monospace';
                const mapName = this._getMapDisplayName(summary.mapId);
                ctx.fillText(mapName, cx + cardW / 2, yBase + 16);

                // 精灵 & 徽章 & 金币
                ctx.fillStyle = '#88aaCC';
                ctx.font = '9px monospace';
                ctx.fillText(`Lv.${summary.topLevel} | 🏅${summary.badgeCount} | 💰${summary.gold}`, cx + cardW / 2, yBase + 32);
            }

            // 选中指示箭头
            if (selected) {
                ctx.fillStyle = '#FFD700';
                ctx.font = 'bold 14px monospace';
                ctx.fillText('▼', cx + cardW / 2, cardY + cardH + 12);
            }
        }

        // 底部操作提示
        ctx.fillStyle = '#7799BB';
        ctx.font = '10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('← → 选择 / 点击卡片   确认 进入/加载   取消 返回', W / 2, py + panelH + 18);

        ctx.textAlign = 'left';
    }

    /** 地图 ID 转显示名称 */
    _getMapDisplayName(mapId) {
        const names = {
            qingye_town: '青叶镇',
            town1: '青叶镇(旧)',
            route1: '一号道路',
            forest_1: '迷雾森林',
            cave_1: '岩石洞穴',
            city_gym: '道馆城',
            port_town: '港口镇',
            mountain_path: '山间小径',
            volcanic_cave: '火山洞窟',
            ice_cave: '冰之洞窟',
            desert_ruins: '沙漠遗迹',
            sky_tower: '天空塔',
        };
        return names[mapId] || mapId || '未知';
    }
}

/** 圆角矩形辅助函数 */
function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.arcTo(x + w, y, x + w, y + r, r);
    ctx.lineTo(x + w, y + h - r);
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h);
    ctx.arcTo(x, y + h, x, y + h - r, r);
    ctx.lineTo(x, y + r);
    ctx.arcTo(x, y, x + r, y, r);
    ctx.closePath();
}

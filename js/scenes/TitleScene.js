/**
 * TitleScene - 标题画面场景
 */
class TitleScene extends Scene {
    constructor(game) {
        super(game);
        this.id = 'title';
        this.titleAlpha = 0;
        this.titleBlink = 0;
    }

    onEnter() {
        this.titleAlpha = 0;
        this.titleBlink = 0;
    }

    update(deltaTime) {
        this.titleAlpha = Math.min(1, this.titleAlpha + deltaTime * 0.001);
        this.titleBlink += deltaTime;

        const g = this.game;

        // 处理按钮弹框输入
        if (g.ui.buttonDialogActive) {
            g.ui.handleButtonDialogInput(g.input, performance.now());
            return;
        }

        if ((g.input.anyKeyPressed() || g.input.hasPendingClick()) && g.dataLoaded) {
            if (g.input.hasPendingClick()) g.input.clearClick();
            if (g.saveManager.hasSave()) {
                g.ui.showButtonDialog(
                    '检测到存档数据',
                    ['读取存档', '开始新游戏'],
                    (index) => {
                        if (index === 0) {
                            if (g.saveManager.load(g)) {
                                g.ui.showMessage('读取存档成功！');
                            } else {
                                g.ui.showMessage('读取失败，开始新游戏');
                            }
                        }
                        g.sceneManager.switchTo('explore');
                    }
                );
            } else {
                g.sceneManager.switchTo('explore');
            }
        }
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
        ctx.fillText('精灵纪元', W / 2, H / 2 - 40);

        ctx.fillStyle = '#FFF';
        ctx.font = '12px monospace';
        ctx.fillText('Pocket Spirits', W / 2, H / 2 - 15);

        // 闪烁提示
        if (Math.floor(this.titleBlink / 600) % 2 === 0) {
            ctx.fillStyle = '#AAA';
            ctx.font = '11px monospace';
            ctx.fillText('按任意键开始', W / 2, H / 2 + 40);
        }

        // 版本信息
        ctx.fillStyle = '#666';
        ctx.font = '9px monospace';
        ctx.fillText('v1.0 Demo', W / 2, H - 15);

        ctx.globalAlpha = 1;
        ctx.textAlign = 'left';

        // 渲染按钮弹框
        this.game.ui.renderButtonDialog();
    }
}

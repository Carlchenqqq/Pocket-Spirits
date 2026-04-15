/**
 * UIEngine - UI 引擎
 * 统一管理 HUD、菜单、弹框等 UI 组件
 */
class UIEngine {
    constructor(ctx, canvas, eventBus) {
        this.ctx = ctx;
        this.canvas = canvas;
        this.eventBus = eventBus;
        this.W = canvas.width;
        this.H = canvas.height;
        
        // 消息系统
        this.message = '';
        this.messageTimer = 0;
        this.messageDuration = 2000;
        
        // 组件栈（支持嵌套 UI）
        this.componentStack = [];
        
        // 菜单按钮位置
        this.menuBtnX = this.W - 50;
        this.menuBtnY = this.H - 40;
        this.menuBtnW = 40;
        this.menuBtnH = 30;
    }

    /** 显示消息 */
    showMessage(text, duration = 2000) {
        this.message = text;
        this.messageTimer = duration;
        this.messageDuration = duration;
        this.eventBus.emit(GameEvents.UI_MESSAGE, { text });
    }

    /** 更新 */
    update(deltaTime) {
        // 更新消息计时器
        if (this.messageTimer > 0) {
            this.messageTimer -= deltaTime;
            if (this.messageTimer <= 0) {
                this.message = '';
            }
        }
    }

    /** 渲染 HUD */
    renderHUD(player, creaturesManager) {
        // 菜单按钮
        this.ctx.fillStyle = 'rgba(0,0,0,0.7)';
        this.ctx.fillRect(this.menuBtnX, this.menuBtnY, this.menuBtnW, this.menuBtnH);
        this.ctx.strokeStyle = 'rgba(255,215,0,0.6)';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(this.menuBtnX, this.menuBtnY, this.menuBtnW, this.menuBtnH);
        this.ctx.fillStyle = '#FFD700';
        this.ctx.font = 'bold 14px monospace';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('☰', this.menuBtnX + this.menuBtnW / 2, this.menuBtnY + 21);
        this.ctx.textAlign = 'left';
        
        // 玩家信息
        if (creaturesManager.starterChosen && creaturesManager.party.length > 0) {
            const first = creaturesManager.party[0];
            this.ctx.fillStyle = 'rgba(0,0,0,0.6)';
            this.ctx.fillRect(10, this.H - 50, 150, 40);
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '12px monospace';
            this.ctx.fillText(first.name, 20, this.H - 35);
            this.renderHPBar(this.ctx, 20, this.H - 25, 100, 10, first.currentHP, first.maxHP);
        }
    }

    /** 渲染 HP 条 */
    renderHPBar(ctx, x, y, w, h, current, max) {
        const ratio = Math.max(0, Math.min(1, current / max));
        
        // 背景
        ctx.fillStyle = '#333';
        ctx.fillRect(x, y, w, h);
        
        // HP 条
        if (ratio > 0.5) ctx.fillStyle = '#4CAF50';
        else if (ratio > 0.2) ctx.fillStyle = '#FFC107';
        else ctx.fillStyle = '#F44336';
        ctx.fillRect(x, y, w * ratio, h);
        
        // 边框
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, w, h);
    }

    /** 渲染消息 */
    renderMessage(ctx) {
        if (!this.message) return;
        
        ctx.fillStyle = 'rgba(0,0,0,0.8)';
        const w = ctx.measureText(this.message).width + 40;
        const h = 30;
        const x = (this.W - w) / 2;
        const y = this.H - 60;
        ctx.fillRect(x, y, w, h);
        ctx.strokeStyle = '#FFD700';
        ctx.strokeRect(x, y, w, h);
        
        ctx.fillStyle = '#fff';
        ctx.font = '14px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(this.message, this.W / 2, y + 20);
        ctx.textAlign = 'left';
    }

    /** 检查点击是否在菜单按钮上 */
    isMenuButtonClick(x, y) {
        return x >= this.menuBtnX && x <= this.menuBtnX + this.menuBtnW &&
               y >= this.menuBtnY && y <= this.menuBtnY + this.menuBtnH;
    }
}

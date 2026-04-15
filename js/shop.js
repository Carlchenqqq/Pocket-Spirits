/**
 * Shop - 商店系统
 * 买入道具、金币管理
 */
class ShopManager {
    constructor() {
        this.active = false;
        this.selectedIndex = 0;
        this.shopItems = [
            { itemId: 1, label: '精灵球    100G' },
            { itemId: 2, label: '超级球    300G' },
            { itemId: 3, label: '伤药       50G' },
            { itemId: 4, label: '好伤药   150G' }
        ];
        this.message = '';
        this.messageTimer = 0;
        // 二次确认弹框
        this.confirming = false;
        this.confirmItemIndex = -1;
    }

    /** 打开商店 */
    open() {
        this.active = true;
        this.selectedIndex = 0;
        this.message = '';
        this.messageTimer = 0;
        this.confirming = false;
        this.confirmItemIndex = -1;
    }

    /** 关闭商店 */
    close() {
        this.active = false;
        this.confirming = false;
    }

    /** 上移选择 */
    up() {
        if (!this.confirming && this.selectedIndex > 0) this.selectedIndex--;
    }

    /** 下移选择 */
    down() {
        if (!this.confirming && this.selectedIndex < this.shopItems.length - 1) this.selectedIndex++;
    }

    /** 确认购买 */
    confirmBuy(creaturesManager) {
        if (!this.confirming) return;
        const item = this.shopItems[this.confirmItemIndex];
        const data = creaturesManager.getItemData(item.itemId);
        if (!data) { this.confirming = false; return; }

        if (creaturesManager.gold >= data.price) {
            creaturesManager.gold -= data.price;
            creaturesManager.addItem(item.itemId, 1);
            this.message = `购买了${data.name}！`;
        } else {
            this.message = '金币不足！';
        }
        this.messageTimer = 1500;
        this.confirming = false;
    }

    /** 取消购买 */
    cancelBuy() {
        this.confirming = false;
        this.confirmItemIndex = -1;
    }

    /** 请求购买（弹出二次确认） */
    requestBuy(itemIndex) {
        this.confirmItemIndex = itemIndex;
        this.confirming = true;
    }

    /** 更新 */
    update(deltaTime) {
        if (this.messageTimer > 0) {
            this.messageTimer -= deltaTime;
            if (this.messageTimer <= 0) {
                this.message = '';
            }
        }
    }

    /** 渲染商店界面 */
    render(ctx, creaturesManager) {
        if (!this.active) return;

        const W = 640, H = 480;

        // 背景
        ctx.fillStyle = 'rgba(0, 0, 0, 0.92)';
        ctx.fillRect(0, 0, W, H);

        // 标题
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 20px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('精灵商店', W / 2, 40);
        ctx.textAlign = 'left';

        // 返回按钮
        if (!this.confirming) {
            const backBtnW = 50, backBtnH = 22;
            const backBtnX = W - backBtnW - 10, backBtnY = 12;
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
        }

        // 金币显示
        ctx.fillStyle = '#FFD700';
        ctx.font = '14px monospace';
        ctx.fillText(`金币: ${creaturesManager.gold}G`, 30, 70);

        // 商品列表
        this.shopItems.forEach((item, i) => {
            const data = creaturesManager.getItemData(item.itemId);
            const iy = 95 + i * 50;

            // 所有商品都显示为可点击的卡片样式
            ctx.fillStyle = 'rgba(50, 50, 70, 0.6)';
            ctx.fillRect(20, iy - 8, W - 40, 42);
            ctx.strokeStyle = 'rgba(255, 215, 0, 0.3)';
            ctx.lineWidth = 1;
            ctx.strokeRect(20, iy - 8, W - 40, 42);

            ctx.fillStyle = '#FFF';
            ctx.font = '14px monospace';
            ctx.fillText(item.label, 50, iy + 16);

            if (data) {
                ctx.fillStyle = '#888';
                ctx.font = '12px monospace';
                ctx.fillText(data.desc, 280, iy + 16);
            }
        });

        // 消息
        if (this.message) {
            ctx.fillStyle = '#FFF';
            ctx.font = '14px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(this.message, W / 2, 340);
            ctx.textAlign = 'left';
        }

        // 二次确认弹框
        if (this.confirming && this.confirmItemIndex >= 0) {
            const item = this.shopItems[this.confirmItemIndex];
            const data = creaturesManager.getItemData(item.itemId);

            // 半透明遮罩
            ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
            ctx.fillRect(0, 0, W, H);

            // 弹框背景
            const boxW = 320, boxH = 160;
            const boxX = (W - boxW) / 2, boxY = (H - boxH) / 2;
            ctx.fillStyle = 'rgba(30, 30, 50, 0.95)';
            ctx.fillRect(boxX, boxY, boxW, boxH);
            ctx.strokeStyle = '#FFD700';
            ctx.lineWidth = 2;
            ctx.strokeRect(boxX, boxY, boxW, boxH);

            // 标题
            ctx.fillStyle = '#FFD700';
            ctx.font = 'bold 16px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('确认购买', W / 2, boxY + 30);

            // 商品信息
            if (data) {
                ctx.fillStyle = '#FFF';
                ctx.font = '14px monospace';
                ctx.fillText(`${data.name}  -  ${data.price}G`, W / 2, boxY + 60);
                ctx.fillStyle = '#AAA';
                ctx.font = '12px monospace';
                ctx.fillText(data.desc, W / 2, boxY + 82);
            }

            // 确认按钮
            const btnW = 110, btnH = 36;
            const confirmX = W / 2 - btnW - 15;
            const cancelX = W / 2 + 15;
            const btnY = boxY + boxH - 55;

            // 确认按钮
            ctx.fillStyle = 'rgba(76, 175, 80, 0.8)';
            ctx.fillRect(confirmX, btnY, btnW, btnH);
            ctx.strokeStyle = '#4CAF50';
            ctx.lineWidth = 2;
            ctx.strokeRect(confirmX, btnY, btnW, btnH);
            ctx.fillStyle = '#FFF';
            ctx.font = 'bold 14px monospace';
            ctx.fillText('确认购买', confirmX + btnW / 2, btnY + 23);

            // 取消按钮
            ctx.fillStyle = 'rgba(158, 158, 158, 0.6)';
            ctx.fillRect(cancelX, btnY, btnW, btnH);
            ctx.strokeStyle = '#888';
            ctx.lineWidth = 2;
            ctx.strokeRect(cancelX, btnY, btnW, btnH);
            ctx.fillStyle = '#FFF';
            ctx.fillText('取消', cancelX + btnW / 2, btnY + 23);

            ctx.textAlign = 'left';
        }

        // 操作提示
        if (!this.confirming) {
            ctx.fillStyle = '#888';
            ctx.font = '13px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('点击商品购买  点击其他区域退出', W / 2, H - 25);
            ctx.textAlign = 'left';
        }
    }

    /** 处理点击（返回 'bought'/'cancelled'/null） */
    handleClick(clickX, clickY, creaturesManager) {
        if (!this.confirming) return null;

        const W = 640, H = 480;
        const boxW = 320, boxH = 160;
        const boxX = (W - boxW) / 2, boxY = (H - boxH) / 2;
        const btnW = 110, btnH = 36;
        const confirmX = W / 2 - btnW - 15;
        const cancelX = W / 2 + 15;
        const btnY = boxY + boxH - 55;

        // 点击确认按钮
        if (clickX >= confirmX && clickX <= confirmX + btnW && clickY >= btnY && clickY <= btnY + btnH) {
            this.confirmBuy(creaturesManager);
            return 'bought';
        }
        // 点击取消按钮
        if (clickX >= cancelX && clickX <= cancelX + btnW && clickY >= btnY && clickY <= btnY + btnH) {
            this.cancelBuy();
            return 'cancelled';
        }
        // 点击弹框外区域也取消
        if (clickX < boxX || clickX > boxX + boxW || clickY < boxY || clickY > boxY + boxH) {
            this.cancelBuy();
            return 'cancelled';
        }
        return null;
    }
}

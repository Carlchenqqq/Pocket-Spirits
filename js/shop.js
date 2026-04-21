/**
 * ShopManager - 商店系统 V1 升级版
 * 从 items.json 动态加载商品，支持多种商店类型（杂货铺/精灵球店/药店/秘传技店）
 */

// ========== 商店类型配置 ==========
const SHOP_TYPES = {
    general: {
        name: '杂货铺',
        npc: 'shop_keeper',
        categories: ['misc', 'key_item'],
        welcome: '欢迎光临！有什么需要的吗？',
        goodbye: '欢迎下次再来！'
    },
    ball: {
        name: '精灵球专卖店',
        npc: 'ball_seller',
        categories: ['ball'],
        welcome: '挑个好球，抓只强精灵！',
        goodbye: '祝你好运！'
    },
    medicine: {
        name: '药店',
        npc: 'doctor',
        categories: ['medicine', 'boost'],
        welcome: '注意安全，备点药品总是好的。',
        goodbye: '保重身体！'
    },
    tm: {
        name: '秘传技商店',
        npc: 'tm_seller',
        categories: ['tm'],
        welcome: '稀有的秘传技能，看看有没有喜欢的？',
        goodbye: '这些技能会帮大忙的！'
    }
};

class ShopManager {
    constructor() {
        this.active = false;
        this.selectedIndex = 0;
        this.shopItems = [];           // 当前商店商品列表（动态生成）
        this.currentShopType = null;   // 当前商店类型
        this.message = '';
        this.messageTimer = 0;
        // 二次确认弹框
        this.confirming = false;
        this.confirmItemIndex = -1;
        // 分页支持
        this.currentPage = 0;
        this.itemsPerPage = 6;

        /** 初始化默认商品列表（向后兼容） */
        this._initDefaultItems();
    }

    /**
     * 从 creaturesManager.itemsData 动态构建商品列表
     * @param {string} shopType - 商店类型 key（SHOP_TYPES 的键）
     * @param {Object} creaturesManager - CreaturesManager 实例
     * @returns {Array} 商品数组
     */
    _buildShopItems(shopType, creaturesManager) {
        const config = SHOP_TYPES[shopType];
        if (!config || !creaturesManager || !Array.isArray(creaturesManager.itemsData)) {
            return this._getDefaultItems();
        }

        const items = [];
        creaturesManager.itemsData.forEach(item => {
            // 只出售有售价且属于该商店类型的物品（type 字段匹配 categories）
            if (item.price > 0 && config.categories.includes(item.type)) {
                items.push({
                    itemId: item.id,
                    label: `${String(item.name).padEnd(6, '\u3000')}${String(item.price).padStart(4)}G`,
                    _name: item.name,
                    _price: item.price,
                    _desc: item.desc || '',
                    _category: item.type,
                    _icon: ''
                });
            }
        });

        return items.length > 0 ? items : this._getDefaultItems();
    }

    /** 默认商品列表（兼容模式 - 当 items.json 加载失败时使用） */
    _getDefaultItems() {
        return [
            { itemId: 1, label: '精灵球    100G', _name: '精灵球', _price: 100, _desc: '基础捕捉道具，用于捕捉野生精灵' },
            { itemId: 2, label: '超级球    300G', _name: '超级球', _price: 300, _desc: '高级捕捉道具，捕捉率更高' },
            { itemId: 3, label: '伤药       50G', _name: '伤药', _price: 50, _desc: '恢复精灵50点HP' },
            { itemId: 4, label: '好伤药   150G', _name: '好伤药', _price: 150, _desc: '恢复精灵200点HP' }
        ];
    }

    /** 向后兼容的初始化 */
    _initDefaultItems() {
        this.shopItems = this._getDefaultItems();
    }

    /** 打开商店
     *  @param {string} shopType - 商店类型（ball/medicine/general 等），默认 'general'
     *  @param {Object} creaturesManager - CreaturesManager 实例，用于动态加载商品
     */
    open(shopType, creaturesManager) {
        this.active = true;
        this.selectedIndex = 0;
        this.message = '';
        this.messageTimer = 0;
        this.confirming = false;
        this.confirmItemIndex = -1;
        this.currentPage = 0;

        // 根据商店类型加载商品
        if (shopType && SHOP_TYPES[shopType]) {
            this.currentShopType = shopType;
            this.shopItems = this._buildShopItems(shopType, creaturesManager);
        } else {
            // 默认打开综合商店
            this.currentShopType = shopType || 'general';
            this.shopItems = this._buildShopItems(this.currentShopType, creaturesManager);
        }
    }

    /** 关闭商店 */
    close() {
        this.active = false;
        this.confirming = false;
        this.currentShopType = null;
    }

    /** 获取当前商店名称 */
    getShopName() {
        if (this.currentShopType && SHOP_TYPES[this.currentShopType]) {
            return SHOP_TYPES[this.currentShopType].name;
        }
        return '精灵商店';
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
        if (!this.confirming || this.confirmItemIndex < 0) return;
        const item = this.shopItems[this.confirmItemIndex];
        const price = item._price || 0;

        if (creaturesManager.gold >= price) {
            creaturesManager.gold -= price;
            creaturesManager.addItem(item.itemId, 1);
            this.message = `购买了${item._name || item.label.split(/\s+/)[0]}！`;
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
        if (itemIndex >= 0 && itemIndex < this.shopItems.length) {
            this.confirmItemIndex = itemIndex;
            this.confirming = true;
        }
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

        const W = CONFIG.CANVAS_W, H = CONFIG.CANVAS_H;

        // 背景
        ctx.fillStyle = 'rgba(0, 0, 0, 0.92)';
        ctx.fillRect(0, 0, W, H);

        // 标题（显示当前商店名）
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 20px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(this.getShopName(), W / 2, 40);

        // 如果是特定商店，显示欢迎语
        if (this.currentShopType && SHOP_TYPES[this.currentShopType] && !this.confirming) {
            ctx.fillStyle = '#AAA';
            ctx.font = '12px monospace';
            ctx.fillText(SHOP_TYPES[this.currentShopType].welcome, W / 2, 58);
        }
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
        ctx.fillText(`金币: ${creaturesManager.gold}G`, 30, 75);

        // 商品列表
        this.shopItems.forEach((item, i) => {
            const iy = 95 + i * 48;

            // 卡片背景
            ctx.fillStyle = i === this.selectedIndex ? 'rgba(80, 80, 120, 0.7)' : 'rgba(50, 50, 70, 0.6)';
            ctx.fillRect(20, iy - 8, W - 40, 42);
            ctx.strokeStyle = i === this.selectedIndex ? 'rgba(255, 215, 0, 0.8)' : 'rgba(255, 215, 0, 0.3)';
            ctx.lineWidth = 1;
            ctx.strokeRect(20, iy - 8, W - 40, 42);

            // 物品图标（如果有）
            let iconX = 35;
            if (item._icon) {
                ctx.font = '16px sans-serif';
                ctx.fillText(item._icon, 30, iy + 16);
                iconX = 55;
            }

            // 名称和价格
            ctx.fillStyle = '#FFF';
            ctx.font = '14px monospace';
            ctx.fillText(item.label, iconX, iy + 16);

            // 描述
            if (item._desc) {
                ctx.fillStyle = '#888';
                ctx.font = '12px monospace';
                ctx.fillText(item._desc, 280, iy + 16);
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
            this._renderConfirmDialog(ctx, creaturesManager, W, H);
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

    /** 渲染确认购买对话框 */
    _renderConfirmDialog(ctx, creaturesManager, W, H) {
        const item = this.shopItems[this.confirmItemIndex];
        const name = item._name || item.label.split(/\s+/)[0];
        const price = item._price || 0;
        const desc = item._desc || '';

        // 半透明遮罩
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(0, 0, W, H);

        // 弹框背景
        const boxW = 320, boxH = 200;
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
        ctx.fillText('确认购买', W / 2, boxY + 28);

        // 图标+名称
        if (item._icon) {
            ctx.font = '24px sans-serif';
            ctx.fillText(item._icon, boxX + 40, boxY + 62);
            ctx.fillStyle = '#FFF';
            ctx.font = 'bold 18px monospace';
            ctx.fillText(name, boxX + 70, boxY + 60);
        } else {
            ctx.fillStyle = '#FFF';
            ctx.font = 'bold 18px monospace';
            ctx.fillText(name, W / 2, boxY + 58);
        }

        // 价格
        ctx.fillStyle = '#FFD700';
        ctx.font = '15px monospace';
        ctx.fillText(`${price} G`, W / 2, boxY + 82);

        // 拥有金币对比
        const canAfford = creaturesManager.gold >= price;
        ctx.fillStyle = canAfford ? '#4CAF50' : '#F44336';
        ctx.font = '12px monospace';
        ctx.fillText(canAfford ? `持有: ${creaturesManager.gold}G ✓` : `持有: ${creaturesManager.gold}G ✗ 金币不足!`, W / 2, boxY + 100);

        // 描述
        if (desc) {
            ctx.fillStyle = '#AAA';
            ctx.font = '12px monospace';
            ctx.fillText(desc, W / 2, boxY + 118);
        }

        // 确认/取消按钮
        const btnW = 110, btnH = 36;
        const confirmX = W / 2 - btnW - 15;
        const cancelX = W / 2 + 15;
        const btnY = boxY + boxH - 52;

        // 确认按钮
        ctx.fillStyle = canAfford ? 'rgba(76, 175, 80, 0.8)' : 'rgba(100, 100, 100, 0.5)';
        ctx.fillRect(confirmX, btnY, btnW, btnH);
        ctx.strokeStyle = canAfford ? '#4CAF50' : '#666';
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

    /** 处理点击（返回 'bought'/'cancelled'/null） */
    handleClick(clickX, clickY, creaturesManager) {
        // 处理确认对话框的点击
        if (this.confirming) {
            return this._handleConfirmClick(clickX, clickY, creaturesManager);
        }
        return null;
    }

    /** 处理确认框内的点击 */
    _handleConfirmClick(clickX, clickY, creaturesManager) {
        const W = CONFIG.CANVAS_W, H = CONFIG.CANVAS_H;
        const boxW = 320, boxH = 170;
        const boxX = (W - boxW) / 2, boxY = (H - boxH) / 2;
        const btnW = 110, btnH = 36;
        const confirmX = W / 2 - btnW - 15;
        const cancelX = W / 2 + 15;
        const btnY = boxY + boxH - 52;

        // 点击确认按钮
        if (clickX >= confirmX && clickX <= confirmX + btnW &&
            clickY >= btnY && clickY <= btnY + btnH) {
            this.confirmBuy(creaturesManager);
            return 'bought';
        }
        // 点击取消按钮
        if (clickX >= cancelX && clickX <= cancelX + btnW &&
            clickY >= btnY && clickY <= btnY + btnH) {
            this.cancelBuy();
            return 'cancelled';
        }
        // 点击弹框外区域也取消
        if (clickX < boxX || clickX > boxX + boxW ||
            clickY < boxY || clickY > boxY + boxH) {
            this.cancelBuy();
            return 'cancelled';
        }
        return null;
    }
}

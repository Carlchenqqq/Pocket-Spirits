/**
 * UIManager - UI 管理器（兼容层）
 * 
 * 注意：此文件为兼容层，新代码应优先使用 js/engine/ 下的：
 * - UIEngine.js（状态管理）
 * - UIRenderer.js（渲染）
 * - UIInputHandler.js（输入处理）
 * 
 * 以下方法已迁移到新系统（此文件保留委托调用以兼容旧代码）：
 * - showMessage / renderMessage → UIEngine
 * - renderHPBar → UIRenderer
 * - renderHUD → UIRenderer
 * - showButtonDialog / renderButtonDialog / handleButtonDialogInput → UIRenderer + UIInputHandler
 */
class UIManager {
    constructor(ctx, canvas) {
        this.ctx = ctx;
        this.canvas = canvas;
        this.W = canvas.width;
        this.H = canvas.height;

        // 对话框状态
        this.dialogActive = false;
        this.dialogText = '';
        this.dialogDisplayed = '';
        this.dialogCharIndex = 0;
        this.dialogTimer = 0;
        this.dialogSpeed = 30; // 每字符毫秒
        this.dialogCallback = null;
        this.dialogQueue = [];

        // 菜单状态
        this.menuActive = false;
        this.menuItems = [];
        this.menuSelectedIndex = 0;
        this.menuCallback = null;
        this.menuTitle = '';

        // 精灵选择状态
        this.creatureSelectActive = false;
        this.creatureSelectCallback = null;
        this.creatureSelectScroll = 0;

        // 背包状态
        this.bagActive = false;
        this.bagCallback = null;
        this.bagSelectedIndex = 0;

        // 消息提示
        this.message = '';
        this.messageTimer = 0;
        this.messageDuration = 2000;

        // 初始精灵选择
        this.starterSelectActive = false;
        this.starterCallback = null;
        this.starterSelectedIndex = 0;

        // 按钮弹框状态
        this.buttonDialogActive = false;
        this.buttonDialogText = '';
        this.buttonDialogButtons = [];
        this.buttonDialogCallback = null;
        this.buttonDialogSelectedIndex = 0;
    }

    /** 更新UI */
    update(deltaTime) {
        // 更新对话框打字效果
        if (this.dialogActive && this.dialogCharIndex < this.dialogText.length) {
            this.dialogTimer += deltaTime;
            while (this.dialogTimer >= this.dialogSpeed && this.dialogCharIndex < this.dialogText.length) {
                this.dialogTimer -= this.dialogSpeed;
                this.dialogCharIndex++;
                this.dialogDisplayed = this.dialogText.substring(0, this.dialogCharIndex);
            }
        }

        // 更新消息提示
        if (this.messageTimer > 0) {
            this.messageTimer -= deltaTime;
            if (this.messageTimer <= 0) {
                this.message = '';
            }
        }
    }

    /** 显示消息提示 */
    showMessage(text, duration) {
        this.message = text;
        this.messageTimer = duration || this.messageDuration;
    }

    // ==================== 按钮弹框 ====================

    /** 显示按钮弹框 */
    showButtonDialog(text, buttons, callback) {
        // console.log('[UI] showButtonDialog:', text, '| buttons:', buttons);
        this.buttonDialogActive = true;
        this.buttonDialogText = text;
        this.buttonDialogButtons = buttons;
        this.buttonDialogCallback = callback;
        this.buttonDialogSelectedIndex = 0;
    }

    /** 关闭按钮弹框 */
    closeButtonDialog() {
        this.buttonDialogActive = false;
        this.buttonDialogButtons = [];
        this.buttonDialogCallback = null;
    }

    /** 渲染按钮弹框 */
    renderButtonDialog() {
        if (!this.buttonDialogActive) return;
        // console.log('[UI] renderButtonDialog active, text:', this.buttonDialogText); // 每帧打印太吵，需要时取消注释

        const ctx = this.ctx;
        const boxW = 300;
        const boxH = 100;
        const boxX = (this.W - boxW) / 2;
        const boxY = (this.H - boxH) / 2;

        // 背景
        ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
        ctx.fillRect(boxX, boxY, boxW, boxH);
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 2;
        ctx.strokeRect(boxX + 1, boxY + 1, boxW - 2, boxH - 2);

        // 文字
        ctx.fillStyle = '#FFF';
        ctx.font = '14px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(this.buttonDialogText, this.W / 2, boxY + 30);
        ctx.textAlign = 'left';

        // 按钮
        const buttons = this.buttonDialogButtons;
        const btnW = 100;
        const btnH = 30;
        const totalBtnW = buttons.length * btnW + (buttons.length - 1) * 20;
        const startBtnX = (this.W - totalBtnW) / 2;

        buttons.forEach((btn, i) => {
            const btnX = startBtnX + i * (btnW + 20);
            const btnY = boxY + 50;

            // 按钮背景
            if (i === this.buttonDialogSelectedIndex) {
                ctx.fillStyle = 'rgba(255, 215, 0, 0.3)';
                ctx.fillRect(btnX, btnY, btnW, btnH);
                ctx.strokeStyle = '#FFD700';
                ctx.lineWidth = 2;
                ctx.strokeRect(btnX, btnY, btnW, btnH);
                ctx.fillStyle = '#FFD700';
            } else {
                ctx.fillStyle = 'rgba(60, 60, 60, 0.8)';
                ctx.fillRect(btnX, btnY, btnW, btnH);
                ctx.strokeStyle = '#888';
                ctx.lineWidth = 1;
                ctx.strokeRect(btnX, btnY, btnW, btnH);
                ctx.fillStyle = '#CCC';
            }

            // 按钮文字
            ctx.font = '13px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(btn, btnX + btnW / 2, btnY + 20);
            ctx.textAlign = 'left';
        });
    }

    /** 处理按钮弹框输入（支持点击和键盘） */
    handleButtonDialogInput(input, now) {
        if (!this.buttonDialogActive) return false;

        const btnCount = this.buttonDialogButtons.length;

        // 键盘方向键
        if (input.isJustPressed('ArrowLeft') || input.isJustPressed('KeyA')) {
            this.buttonDialogSelectedIndex = (this.buttonDialogSelectedIndex - 1 + btnCount) % btnCount;
        }
        if (input.isJustPressed('ArrowRight') || input.isJustPressed('KeyD')) {
            this.buttonDialogSelectedIndex = (this.buttonDialogSelectedIndex + 1) % btnCount;
        }

        // ESC / 取消键：关闭弹框（触发最后一个按钮=取消）
        if (input.isCancelPressed()) {
            const callback = this.buttonDialogCallback;
            this.closeButtonDialog();
            if (callback) callback(btnCount - 1); // 默认取消
            return true;
        }

        // 确认/点击
        if (input.isConfirmPressed(now)) {
            const index = this.buttonDialogSelectedIndex;
            const callback = this.buttonDialogCallback;
            this.closeButtonDialog();
            if (callback) callback(index);
            return true;
        }

        // 触摸/鼠标点击：检测点了哪个按钮
        if (input.hasPendingClick()) {
            const click = input.getClick();
            if (click) {
                const clickedBtnIdx = this._getButtonItemAt(click.x, click.y);
                if (clickedBtnIdx >= 0) {
                    // 点击了某个按钮，直接触发
                    this.buttonDialogSelectedIndex = clickedBtnIdx;
                    const callback = this.buttonDialogCallback;
                    this.closeButtonDialog();
                    if (callback) callback(clickedBtnIdx);
                    return true;
                }
                // 点击弹窗外部区域 = 取消
                input.clearClick();
                const callback = this.buttonDialogCallback;
                this.closeButtonDialog();
                if (callback) callback(btnCount - 1); // 默认取消
                return true;
            } else {
                // hasPendingClick 为 true 但 getClick 返回 null（理论上不会发生）
                input.clearClick();
                const index = this.buttonDialogSelectedIndex;
                const callback = this.buttonDialogCallback;
                this.closeButtonDialog();
                if (callback) callback(index);
                return true;
            }
        }
        return true;
    }

    /** 获取点击位置对应的按钮索引 */
    _getButtonItemAt(x, y) {
        if (!this.buttonDialogActive) return -1;
        const boxW = 300, boxH = 100;
        const boxX = (this.W - boxW) / 2;
        const boxY = (this.H - boxH) / 2;
        const buttons = this.buttonDialogButtons;
        const btnW = 100, btnH = 30;
        const totalBtnW = buttons.length * btnW + (buttons.length - 1) * 20;
        const startBtnX = (this.W - totalBtnW) / 2;

        for (let i = 0; i < buttons.length; i++) {
            const btnX = startBtnX + i * (btnW + 20);
            const btnY = boxY + 50;
            if (x >= btnX && x <= btnX + btnW && y >= btnY && y <= btnY + btnH) {
                return i;
            }
        }
        return -1;
    }

    // ==================== 对话框 ====================

    /** 显示对话（支持多行对话队列） */
    showDialog(texts, callback) {
        if (Array.isArray(texts)) {
            this.dialogQueue = [...texts];
        } else {
            this.dialogQueue = [texts];
        }
        this.dialogCallback = callback;
        this._showNextDialog();
    }

    /** 显示下一条对话 */
    _showNextDialog() {
        if (this.dialogQueue.length === 0) {
            this.dialogActive = false;
            // 不在此处执行 callback！
            // 对话结束后的回调（如启动战斗/打开商店）由 DialogScene._finishDialog() 处理
            // 那里会先 pop DialogScene，再执行 callback，避免场景栈混乱
            return;
        }
        this.dialogActive = true;
        this.dialogText = this.dialogQueue.shift();
        this.dialogDisplayed = '';
        this.dialogCharIndex = 0;
        this.dialogTimer = 0;
    }

    /** 对话框确认键处理 */
    dialogConfirm() {
        if (!this.dialogActive) return false;
        if (this.dialogCharIndex < this.dialogText.length) {
            // 跳过打字效果，直接显示全部
            this.dialogCharIndex = this.dialogText.length;
            this.dialogDisplayed = this.dialogText;
            return true;
        }
        // 显示下一条
        this._showNextDialog();
        // 如果对话队列已空（dialogActive 被设为 false），返回 false 通知调用方结束对话
        return this.dialogActive;
    }

    /** 渲染对话框 */
    renderDialog() {
        if (!this.dialogActive) return;

        const ctx = this.ctx;
        const boxX = 20;
        const boxY = this.H - 110;
        const boxW = this.W - 40;
        const boxH = 90;

        // 背景
        ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        ctx.fillRect(boxX, boxY, boxW, boxH);
        // 边框
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 2;
        ctx.strokeRect(boxX + 1, boxY + 1, boxW - 2, boxH - 2);

        // 文字（14px，行高20，内边距增大）
        ctx.fillStyle = '#FFF';
        ctx.font = '14px monospace';
        this._wrapText(ctx, this.dialogDisplayed, boxX + 16, boxY + 24, boxW - 32, 20);

        // 继续提示
        if (this.dialogCharIndex >= this.dialogText.length) {
            ctx.fillStyle = '#FFD700';
            ctx.font = '12px monospace';
            const blink = Math.floor(Date.now() / 500) % 2;
            if (blink) {
                ctx.fillText('▼', boxX + boxW - 24, boxY + boxH - 10);
            }
        }
    }

    // ==================== 菜单 ====================

    /** 显示菜单 */
    showMenu(title, items, callback) {
        this.menuActive = true;
        this.menuTitle = title;
        this.menuItems = items;
        this.menuSelectedIndex = 0;
        this.menuCallback = callback;
    }

    /** 关闭菜单 */
    closeMenu() {
        this.menuActive = false;
        this.menuItems = [];
        this.menuCallback = null;
    }

    /** 菜单上移 */
    menuUp() {
        if (this.menuSelectedIndex > 0) this.menuSelectedIndex--;
    }

    /** 菜单下移 */
    menuDown() {
        if (this.menuSelectedIndex < this.menuItems.length - 1) this.menuSelectedIndex++;
    }

    /** 菜单确认 */
    menuConfirm() {
        if (!this.menuActive) return;
        const item = this.menuItems[this.menuSelectedIndex];
        if (this.menuCallback) {
            this.menuCallback(this.menuSelectedIndex, item);
        }
    }

    /** 渲染菜单 */
    renderMenu() {
        if (!this.menuActive) return;

        const ctx = this.ctx;
        const menuW = 140;
        const menuH = 30 + this.menuItems.length * 20 + 10;
        const menuX = this.W - menuW - 10;
        const menuY = 10;

        // 背景
        ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        ctx.fillRect(menuX, menuY, menuW, menuH);
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 2;
        ctx.strokeRect(menuX + 1, menuY + 1, menuW - 2, menuH - 2);

        // 标题
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 14px monospace';
        ctx.fillText(this.menuTitle, menuX + 10, menuY + 20);

        // 菜单项（13px）
        ctx.font = '13px monospace';
        this.menuItems.forEach((item, i) => {
            const iy = menuY + 30 + i * 20;
            if (i === this.menuSelectedIndex) {
                ctx.fillStyle = 'rgba(255, 215, 0, 0.2)';
                ctx.fillRect(menuX + 4, iy - 10, menuW - 8, 18);
                ctx.fillStyle = '#FFD700';
                ctx.fillText('▶', menuX + 8, iy + 2);
            }
            ctx.fillStyle = i === this.menuSelectedIndex ? '#FFF' : '#AAA';
            ctx.fillText(item, menuX + 22, iy + 2);
        });
    }

    // ==================== HP条 ====================

    /** 渲染HP条 */
    renderHPBar(x, y, width, height, current, max) {
        const ctx = this.ctx;
        const ratio = Math.max(0, current / max);

        // 背景（圆角效果）
        ctx.fillStyle = '#333';
        ctx.fillRect(x + 1, y, width - 2, height);
        ctx.fillRect(x, y + 1, width, height - 2);

        // HP条颜色（绿→黄→红）
        let color;
        if (ratio > 0.5) color = '#4CAF50';
        else if (ratio > 0.2) color = '#FFC107';
        else color = '#F44336';

        // HP条（圆角效果）
        if (ratio > 0) {
            const barW = Math.max(2, (width - 2) * ratio);
            ctx.fillStyle = color;
            ctx.fillRect(x + 1, y + 1, barW, height - 2);
            ctx.fillRect(x + 2, y, barW - 2, height);
        }

        // 光泽效果（顶部1px白色高光）
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.fillRect(x + 2, y + 1, Math.max(0, (width - 4) * ratio), 1);

        // 边框
        ctx.strokeStyle = '#555';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, width, height);
    }

    // ==================== 精灵选择 ====================

    /** 显示精灵选择界面 */
    showCreatureSelect(creatures, callback) {
        this.creatureSelectActive = true;
        this.creatureSelectCallback = callback;
        this.creatureSelectList = creatures;
        this.creatureSelectScroll = 0;
        this.creatureSelectIndex = 0;
    }

    /** 关闭精灵选择 */
    closeCreatureSelect() {
        this.creatureSelectActive = false;
        this.creatureSelectCallback = null;
    }

    /** 渲染精灵选择界面 */
    renderCreatureSelect(creaturesManager) {
        if (!this.creatureSelectActive) return;

        const ctx = this.ctx;
        const boxX = 30;
        const boxY = 20;
        const boxW = this.W - 60;
        const boxH = this.H - 40;

        // 背景
        ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
        ctx.fillRect(boxX, boxY, boxW, boxH);
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 2;
        ctx.strokeRect(boxX + 1, boxY + 1, boxW - 2, boxH - 2);

        // 标题
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 14px monospace';
        ctx.fillText('选择精灵', boxX + 10, boxY + 20);

        // 返回按钮
        const backBtnW = 50;
        const backBtnH = 22;
        const backBtnX = boxX + boxW - backBtnW - 8;
        const backBtnY = boxY + 6;
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

        // 精灵列表
        const list = this.creatureSelectList || [];
        const startY = boxY + 35;
        const itemH = 40;

        list.forEach((creature, i) => {
            const iy = startY + i * itemH;
            if (iy + itemH > boxY + boxH - 10) return;

            if (i === this.creatureSelectIndex) {
                ctx.fillStyle = 'rgba(255, 215, 0, 0.15)';
                ctx.fillRect(boxX + 5, iy, boxW - 10, itemH - 4);
            }

            // 精灵像素画
            creaturesManager.renderCreature(ctx, creature.id, boxX + 10, iy + 2, 32);

            // 名称和等级
            ctx.fillStyle = '#FFF';
            ctx.font = '13px monospace';
            ctx.fillText(`${creature.name} Lv.${creature.level}`, boxX + 48, iy + 14);

            // 类型
            ctx.fillStyle = creaturesManager.getTypeColor(creature.type);
            ctx.fillText(creature.type, boxX + 48, iy + 28);

            // HP
            ctx.fillStyle = '#AAA';
            ctx.font = '12px monospace';
            ctx.fillText(`HP: ${creature.currentHP}/${creature.maxHP}`, boxX + 160, iy + 14);

            // HP条
            this.renderHPBar(boxX + 150, iy + 20, 80, 8, creature.currentHP, creature.maxHP);
        });

        // ===== 右侧详情面板 =====
        const selected = list[this.creatureSelectIndex];
        if (selected && selected.stats) {
            const detailX = boxX + 270;
            const detailY = boxY + 35;
            const detailW = boxW - 280;
            const detailH = boxH - 60;

            // 面板背景
            ctx.fillStyle = 'rgba(10, 15, 35, 0.85)';
            ctx.fillRect(detailX, detailY, detailW, detailH);
            ctx.strokeStyle = 'rgba(255, 215, 0, 0.4)';
            ctx.lineWidth = 1;
            ctx.strokeRect(detailX, detailY, detailW, detailH);

            const px = detailX + 12;
            let py = detailY + 20;

            // 精灵像素画（大）
            creaturesManager.renderCreature(ctx, selected.id, detailX + detailW / 2 - 24, detailY + 8, 48);

            // 名称和等级
            ctx.fillStyle = '#FFF';
            ctx.font = 'bold 14px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(`${selected.name} Lv.${selected.level}`, detailX + detailW / 2, py + 48);
            ctx.textAlign = 'left';

            // 稀有度标签
            const rarityMap = { common: '普通', rare: '稀有', legendary: '传说' };
            const rarityColorMap = { common: '#AAA', rare: '#4FC3F7', legendary: '#FFD700' };
            const data = creaturesManager.getCreatureData(selected.id);
            const rarity = data ? data.rarity : 'common';
            ctx.fillStyle = rarityColorMap[rarity] || '#AAA';
            ctx.font = '11px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(`[${rarityMap[rarity] || rarity}]`, detailX + detailW / 2, py + 64);
            ctx.textAlign = 'left';

            py += 80;

            // 属性标签
            const typeColor = creaturesManager.getTypeColor(selected.type);
            const typeNames = { fire: '火', grass: '草', water: '水', electric: '电', rock: '岩', dark: '暗', dragon: '龙', ice: '冰', normal: '普通', poison: '毒' };
            ctx.fillStyle = typeColor;
            ctx.font = 'bold 12px monospace';
            ctx.fillText(`属性: ${typeNames[selected.type] || selected.type}`, px, py);
            py += 20;

            // 分割线
            ctx.fillStyle = 'rgba(255,215,0,0.2)';
            ctx.fillRect(px, py, detailW - 24, 1);
            py += 10;

            // 基础属性
            const stats = selected.stats || {};
            const baseStats = selected.baseStats || {};
            const statEntries = [
                { label: '生命', key: 'hp', val: selected.maxHP, base: baseStats.hp, color: '#4CAF50' },
                { label: '攻击', key: 'attack', val: stats.attack, base: baseStats.attack, color: '#F44336' },
                { label: '防御', key: 'defense', val: stats.defense, base: baseStats.defense, color: '#2196F3' },
                { label: '速度', key: 'speed', val: stats.speed, base: baseStats.speed, color: '#FFC107' },
            ];
            statEntries.forEach(s => {
                ctx.fillStyle = '#AAA';
                ctx.font = '11px monospace';
                ctx.fillText(s.label, px, py);
                // 属性条
                const barX = px + 40;
                const barW = detailW - 120;
                const barH = 10;
                const maxStat = 200; // 属性条最大值参考
                const ratio = Math.min(1, (s.val || 0) / maxStat);
                ctx.fillStyle = '#222';
                ctx.fillRect(barX, py - 8, barW, barH);
                ctx.fillStyle = s.color;
                ctx.fillRect(barX, py - 8, barW * ratio, barH);
                // 数值
                ctx.fillStyle = '#FFF';
                ctx.font = 'bold 11px monospace';
                ctx.fillText(`${s.val}`, barX + barW + 6, py);
                py += 18;
            });

            py += 4;

            // 分割线
            ctx.fillStyle = 'rgba(255,215,0,0.2)';
            ctx.fillRect(px, py, detailW - 24, 1);
            py += 12;

            // 综合战斗力
            const power = (stats.hp || 0) + (stats.attack || 0) * 2 + (stats.defense || 0) * 1.5 + (stats.speed || 0) * 1.2;
            const powerInt = Math.floor(power);
            ctx.fillStyle = '#FFD700';
            ctx.font = 'bold 13px monospace';
            ctx.fillText('⚔ 综合战斗力', px, py);
            ctx.fillStyle = '#FFF';
            ctx.font = 'bold 18px monospace';
            ctx.fillText(`${powerInt}`, px + 110, py + 2);
            py += 24;

            // 分割线
            ctx.fillStyle = 'rgba(255,215,0,0.2)';
            ctx.fillRect(px, py, detailW - 24, 1);
            py += 12;

            // 技能列表
            ctx.fillStyle = '#AAA';
            ctx.font = 'bold 11px monospace';
            ctx.fillText('技能列表', px, py);
            py += 16;

            const skills = selected.skills || [];
            if (skills.length > 0) {
                skills.slice(0, 4).forEach((skill, si) => {
                    const skillData = creaturesManager.getSkillData(skill.id);
                    if (!skillData) return;
                    const sTypeColor = creaturesManager.getTypeColor(skillData.type || 'normal');
                    ctx.fillStyle = sTypeColor;
                    ctx.font = '11px monospace';
                    ctx.fillText(`${skillData.name}`, px + 4, py);
                    // 威力
                    if (skillData.power) {
                        ctx.fillStyle = '#888';
                        ctx.fillText(`威力:${skillData.power}`, px + 80, py);
                    }
                    // PP
                    ctx.fillStyle = '#6a9';
                    ctx.fillText(`PP:${skill.currentPP}/${skillData.pp}`, px + 140, py);
                    py += 16;
                });
            } else {
                ctx.fillStyle = '#555';
                ctx.font = '11px monospace';
                ctx.fillText('无技能', px + 4, py);
            }

            // 经验条
            py = detailY + detailH - 20;
            if (selected.expToNext > 0 && selected.level < 100) {
                ctx.fillStyle = '#888';
                ctx.font = '10px monospace';
                ctx.fillText('EXP', px, py);
                const expBarX = px + 30;
                const expBarW = detailW - 70;
                ctx.fillStyle = '#222';
                ctx.fillRect(expBarX, py - 8, expBarW, 6);
                ctx.fillStyle = '#4169E1';
                ctx.fillRect(expBarX, py - 8, expBarW * Math.min(1, (selected.exp || 0) / selected.expToNext), 6);
                ctx.fillStyle = '#AAA';
                ctx.fillText(`${selected.exp || 0}/${selected.expToNext}`, expBarX + expBarW + 4, py);
            }
        }

        // 操作提示
        ctx.fillStyle = '#888';
        ctx.font = '11px monospace';
        ctx.fillText('↑↓选择  点击/空格确认  ESC取消', boxX + 10, boxY + boxH - 8);
    }

    // ==================== 背包界面 ====================

    /** 显示背包 */
    showBag(items, creaturesManager, callback) {
        this.bagActive = true;
        this.bagCallback = callback;
        this.bagItems = items;
        this.bagSelectedIndex = 0;
    }

    /** 关闭背包 */
    closeBag() {
        this.bagActive = false;
        this.bagCallback = null;
    }

    /** 渲染背包 */
    renderBag(creaturesManager) {
        if (!this.bagActive) return;

        const ctx = this.ctx;
        const boxX = 30;
        const boxY = 20;
        const boxW = this.W - 60;
        const boxH = this.H - 40;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
        ctx.fillRect(boxX, boxY, boxW, boxH);
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 2;
        ctx.strokeRect(boxX + 1, boxY + 1, boxW - 2, boxH - 2);

        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 14px monospace';
        ctx.fillText('背包', boxX + 10, boxY + 20);

        // 返回按钮
        const backBtnW = 50;
        const backBtnH = 22;
        const backBtnX = boxX + boxW - backBtnW - 8;
        const backBtnY = boxY + 6;
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

        const items = this.bagItems || [];
        items.forEach((item, i) => {
            const data = creaturesManager.getItemData(item.itemId);
            if (!data) return;
            const iy = boxY + 35 + i * 25;
            if (i === this.bagSelectedIndex) {
                ctx.fillStyle = 'rgba(255, 215, 0, 0.15)';
                ctx.fillRect(boxX + 5, iy, boxW - 10, 22);
            }
            ctx.fillStyle = i === this.bagSelectedIndex ? '#FFF' : '#AAA';
            ctx.font = '13px monospace';
            ctx.fillText(`${data.name} x${item.count}`, boxX + 15, iy + 14);
            ctx.fillStyle = '#888';
            ctx.font = '11px monospace';
            ctx.fillText(data.desc, boxX + 180, iy + 14);
        });

        if (items.length === 0) {
            ctx.fillStyle = '#888';
            ctx.font = '13px monospace';
            ctx.fillText('背包是空的', boxX + 15, boxY + 50);
        }

        ctx.fillStyle = '#888';
        ctx.font = '11px monospace';
        ctx.fillText('↑↓选择  点击/空格使用', boxX + 10, boxY + boxH - 8);
    }

    // ==================== 初始精灵选择 ====================

    /** 显示初始精灵选择 */
    showStarterSelect(starters, creaturesManager, callback) {
        this.starterSelectActive = true;
        this.starterCallback = callback;
        this.starterList = starters;
        this.starterSelectedIndex = 0;
    }

    /** 关闭初始精灵选择 */
    closeStarterSelect() {
        this.starterSelectActive = false;
        this.starterCallback = null;
    }

    /** 渲染初始精灵选择 */
    renderStarterSelect(creaturesManager) {
        if (!this.starterSelectActive) return;

        const ctx = this.ctx;

        // 背景
        ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
        ctx.fillRect(0, 0, this.W, this.H);

        // 标题
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 20px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('选择你的初始精灵伙伴！', this.W / 2, 40);
        ctx.textAlign = 'left';

        // 三个精灵 - 适应640x480
        const starters = this.starterList || [];
        const spacing = 190;
        const startX = (this.W - spacing * starters.length) / 2 + 20;

        starters.forEach((starter, i) => {
            const cx = startX + i * spacing;
            const cy = 70;

            // 选中高亮
            if (i === this.starterSelectedIndex) {
                ctx.strokeStyle = '#FFD700';
                ctx.lineWidth = 2;
                ctx.strokeRect(cx - 8, cy - 8, 170, 280);
                ctx.fillStyle = 'rgba(255, 215, 0, 0.1)';
                ctx.fillRect(cx - 8, cy - 8, 170, 280);
            }

            // 精灵像素画（更大）
            creaturesManager.renderCreature(ctx, starter.id, cx + 40, cy + 15, 80);

            // 名称
            ctx.fillStyle = '#FFF';
            ctx.font = 'bold 14px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(starter.name, cx + 80, cy + 115);
            ctx.textAlign = 'left';

            // 类型
            ctx.fillStyle = creaturesManager.getTypeColor(starter.type);
            ctx.font = '12px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(starter.type, cx + 80, cy + 135);
            ctx.textAlign = 'left';

            // 属性
            ctx.fillStyle = '#AAA';
            ctx.font = '12px monospace';
            ctx.fillText(`HP: ${starter.baseStats.hp}`, cx + 20, cy + 160);
            ctx.fillText(`攻击: ${starter.baseStats.attack}`, cx + 20, cy + 180);
            ctx.fillText(`防御: ${starter.baseStats.defense}`, cx + 20, cy + 200);
            ctx.fillText(`速度: ${starter.baseStats.speed}`, cx + 20, cy + 220);
        });

        // 操作提示
        ctx.fillStyle = '#888';
        ctx.font = '13px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('←→选择  点击/空格确认', this.W / 2, this.H - 25);
        ctx.textAlign = 'left';
    }

    // ==================== 消息提示 ====================

    /** 渲染消息提示 */
    renderMessage() {
        if (!this.message) return;

        const ctx = this.ctx;
        ctx.font = '14px monospace';
        const textWidth = ctx.measureText(this.message).width;
        const boxW = textWidth + 24;
        const boxH = 28;
        const boxX = (this.W - boxW) / 2;
        const boxY = 10;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(boxX, boxY, boxW, boxH);
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 1;
        ctx.strokeRect(boxX, boxY, boxW, boxH);

        ctx.fillStyle = '#FFF';
        ctx.textAlign = 'center';
        ctx.fillText(this.message, this.W / 2, boxY + 19);
        ctx.textAlign = 'left';
    }

    // ==================== HUD ====================

    /** 渲染游戏HUD */
    renderHUD(creaturesManager, mapManager) {
        const ctx = this.ctx;
        const map = mapManager.getCurrentMap();

        // 地图名称
        if (map) {
            ctx.fillStyle = 'rgba(0,0,0,0.6)';
            ctx.fillRect(5, 5, 110, 20);
            ctx.fillStyle = '#FFF';
            ctx.font = '12px monospace';
            ctx.fillText(map.name, 10, 19);
        }

        // 当前精灵信息面板（名称、等级、HP条、经验条）
        const party = creaturesManager.party;
        if (party.length > 0) {
            const c = party[0]; // 当前出战精灵
            const panelX = 5, panelY = 28, panelW = 180, panelH = 42;
            ctx.fillStyle = 'rgba(0,0,0,0.65)';
            ctx.fillRect(panelX, panelY, panelW, panelH);

            // 名称和等级
            ctx.fillStyle = '#FFF';
            ctx.font = 'bold 12px monospace';
            ctx.fillText(`${c.name} Lv.${c.level}`, panelX + 6, panelY + 14);

            // HP条
            const hpBarX = panelX + 6, hpBarY = panelY + 18, hpBarW = 120, hpBarH = 8;
            ctx.fillStyle = '#333';
            ctx.fillRect(hpBarX, hpBarY, hpBarW, hpBarH);
            const hpRatio = c.maxHP > 0 ? Math.max(0, c.currentHP / c.maxHP) : 0;
            ctx.fillStyle = hpRatio > 0.5 ? '#4CAF50' : (hpRatio > 0.2 ? '#FFC107' : '#F44336');
            ctx.fillRect(hpBarX, hpBarY, hpBarW * hpRatio, hpBarH);
            // HP数值
            ctx.fillStyle = '#AAA';
            ctx.font = '10px monospace';
            ctx.fillText(`${c.currentHP}/${c.maxHP}`, hpBarX + hpBarW + 4, hpBarY + 8);

            // 经验条
            if (c.expToNext > 0 && c.level < 100) {
                const expBarX = panelX + 6, expBarY = panelY + 30, expBarW = 168, expBarH = 6;
                ctx.fillStyle = '#222';
                ctx.fillRect(expBarX, expBarY, expBarW, expBarH);
                const expRatio = Math.min(1, c.exp / c.expToNext);
                ctx.fillStyle = '#4169E1';
                ctx.fillRect(expBarX, expBarY, expBarW * expRatio, expBarH);
                // EXP数值
                ctx.fillStyle = '#888';
                ctx.font = '9px monospace';
                ctx.fillText(`EXP: ${c.exp}/${c.expToNext}`, expBarX + expBarW + 4, expBarY + 6);
            }
        }

        // 金币
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(this.W - 115, 5, 110, 20);
        ctx.fillStyle = '#FFD700';
        ctx.font = '12px monospace';
        ctx.fillText(`金币: ${creaturesManager.gold}`, this.W - 110, 19);

        // 菜单按钮（右上角）
        this.menuBtnX = this.W - 50;
        this.menuBtnY = this.H - 40;
        this.menuBtnW = 40;
        this.menuBtnH = 30;
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(this.menuBtnX, this.menuBtnY, this.menuBtnW, this.menuBtnH);
        ctx.strokeStyle = 'rgba(255,215,0,0.6)';
        ctx.lineWidth = 1;
        ctx.strokeRect(this.menuBtnX, this.menuBtnY, this.menuBtnW, this.menuBtnH);
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 14px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('☰', this.menuBtnX + this.menuBtnW / 2, this.menuBtnY + 21);
        ctx.textAlign = 'left';

        // 地图按钮（左下角）
        this.mapBtnX = 8;
        this.mapBtnY = this.H - 40;
        this.mapBtnW = 40;
        this.mapBtnH = 30;
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(this.mapBtnX, this.mapBtnY, this.mapBtnW, this.mapBtnH);
        ctx.strokeStyle = 'rgba(255,215,0,0.6)';
        ctx.lineWidth = 1;
        ctx.strokeRect(this.mapBtnX, this.mapBtnY, this.mapBtnW, this.mapBtnH);
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 14px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('🗺', this.mapBtnX + this.mapBtnW / 2, this.mapBtnY + 21);
        ctx.textAlign = 'left';
    }

    // ==================== 工具方法 ====================

    /** 自动换行文字 */
    _wrapText(ctx, text, x, y, maxWidth, lineHeight) {
        let line = '';
        for (let i = 0; i < text.length; i++) {
            const testLine = line + text[i];
            const metrics = ctx.measureText(testLine);
            if (metrics.width > maxWidth && line.length > 0) {
                ctx.fillText(line, x, y);
                line = text[i];
                y += lineHeight;
            } else {
                line = testLine;
            }
        }
        ctx.fillText(line, x, y);
    }
}

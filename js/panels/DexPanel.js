/**
 * DexPanel - 灵师手册面板
 * 整合了灵兽图鉴、训练师记录和师者指南
 * 从 ExploreScene.js 提取：_updateDex, _renderDex, _renderDexDetail
 */
class DexPanel {
    constructor(game) {
        this.game = game;
        this.open = false;
        this.page = 'creature'; // 'creature' | 'npc' | 'guide'
        this.scrollIndex = 0;
        this.detailMode = false;
        this.detailId = null;

        // 指南页的滚动位置
        this.guideScrollY = 0;
    }

    openDex() {
        this.open = true;
        this.page = 'creature';
        this.scrollIndex = 0;
        this.detailMode = false;
        this.detailId = null;
        this.guideScrollY = 0;
    }

    closeDex() {
        this.open = false;
        this.detailMode = false;
        this.detailId = null;
    }

    update(now) {
        const g = this.game;
        const cm = g.creaturesManager;

        // 详情页模式
        if (this.detailMode) {
            if (g.input.isCancelPressed() || g.input.isJustPressed('Escape')) {
                this.detailMode = false;
                this.detailId = null;
            }
            return;
        }

        // 指南页：独立滚动浏览模式
        if (this.page === 'guide') {
            if (g.input.isJustPressed('ArrowUp') || g.input.isJustPressed('KeyW')) {
                this.guideScrollY = Math.max(0, this.guideScrollY - 20);
            }
            if (g.input.isJustPressed('ArrowDown') || g.input.isJustPressed('KeyS')) {
                this.guideScrollY += 20;
            }
            if (g.input.isJustPressed('Tab') || g.input.isJustPressed('KeyQ')) { this.page = 'creature'; this.scrollIndex = 0; }
            if (g.input.isCancelPressed()) this.closeDex();
            if (g.input.hasPendingClick()) {
                const click = g.input.getClick();
                if (click) {
                    // 返回按钮
                    const backBtnW = 50, backBtnH = 22;
                    const backBtnX = g.W - backBtnW - 10, backBtnY = 8;
                    if (click.x >= backBtnX && click.x <= backBtnX + backBtnW &&
                        click.y >= backBtnY && click.y <= backBtnY + backBtnH) { this.closeDex(); return; }
                    // Tab 切换
                    if (click.y < 80) { this.page = 'creature'; this.scrollIndex = 0; return; }
                }
            }
            return;
        }

        // 精灵图鉴 / NPC图鉴：列表浏览模式（原逻辑）
        const allKeys = this.page === 'creature'
            ? cm.creaturesData.map(c => c.id)
            : Object.keys(cm.npcDex);
        const dex = this.page === 'creature' ? cm.creatureDex : cm.npcDex;
        const keys = this.page === 'creature' ? allKeys : Object.keys(dex);
        const startY = 90, itemH = 55;
        const maxVisible = Math.floor((g.H - startY - 40) / itemH);

        if (g.input.hasPendingClick()) {
            const click = g.input.getClick();
            if (click) {
                // 返回按钮
                const backBtnW = 50, backBtnH = 22;
                const backBtnX = g.W - backBtnW - 10, backBtnY = 8;
                if (click.x >= backBtnX && click.x <= backBtnX + backBtnW &&
                    click.y >= backBtnY && click.y <= backBtnY + backBtnH) { this.closeDex(); return; }
                // Tab 切换页签 (3个Tab循环)
                if (click.y < 80) {
                    if (this.page === 'creature') this.page = 'npc';
                    else if (this.page === 'npc') this.page = 'guide';
                    else this.page = 'creature';
                    this.scrollIndex = 0;
                    this.guideScrollY = 0;
                    return;
                }
                // 列表项
                if (click.y >= startY && click.y < startY + maxVisible * itemH) {
                    const scrollStart = Math.max(0, Math.min(this.scrollIndex, keys.length - maxVisible));
                    const idx = scrollStart + Math.floor((click.y - startY) / itemH);
                    if (idx >= 0 && idx < keys.length) {
                        this.scrollIndex = idx;
                        // 点击已发现精灵进入详情
                        if (this.page === 'creature') {
                            const cId = keys[idx];
                            if (cm.creatureDex[cId] && cm.creatureDex[cId].encountered) {
                                this.detailMode = true;
                                this.detailId = cId;
                                return;
                            }
                        }
                    }
                    return;
                }
            }
        }
        if (g.input.isJustPressed('ArrowUp') || g.input.isJustPressed('KeyW')) this.scrollIndex = Math.max(0, this.scrollIndex - 1);
        if (g.input.isJustPressed('ArrowDown') || g.input.isJustPressed('KeyS')) this.scrollIndex = Math.min(keys.length - 1, this.scrollIndex + 1);
        // 确认键进入详情
        if (g.input.isConfirmPressed(now) && this.page === 'creature') {
            const cId = keys[this.scrollIndex];
            if (cm.creatureDex[cId] && cm.creatureDex[cId].encountered) {
                this.detailMode = true;
                this.detailId = cId;
            }
        }
        // Q键切换Tab (3个循环)
        if (g.input.isJustPressed('Tab') || g.input.isJustPressed('KeyQ')) {
            if (this.page === 'creature') this.page = 'npc';
            else if (this.page === 'npc') this.page = 'guide';
            else this.page = 'creature';
            this.scrollIndex = 0;
            this.guideScrollY = 0;
        }
        if (g.input.isCancelPressed()) this.closeDex();
    }

    render() {
        const ctx = this.game.ctx;
        const W = this.game.W, H = this.game.H;
        const cm = this.game.creaturesManager;

        // 详情页渲染
        if (this.detailMode && this.detailId != null) {
            this._renderDetail();
            return;
        }

        // ===== 指南页渲染 =====
        if (this.page === 'guide') {
            this._renderGuide();
            return;
        }

        ctx.fillStyle = 'rgba(0,0,0,0.85)';
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 20px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('灵师手册', W / 2, 30);

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

        const stats = cm.getDexStats();
        ctx.font = '12px monospace';
        ctx.fillStyle = '#AAA';
        ctx.textAlign = 'center';
        ctx.fillText(`精灵: ${stats.encounteredCreatures}/${stats.totalCreatures} 遭遇  ${stats.caughtCreatures} 捕获  |  NPC: ${stats.totalNPCs} 遭遇`, W / 2, 50);

        // 3个Tab
        const tabNames = ['灵兽图鉴', '训练师', '师者指南'];
        const tabKeys = ['creature', 'npc', 'guide'];
        const tabWidth = W / 3;
        tabKeys.forEach((key, i) => {
            ctx.fillStyle = this.page === key ? '#FFD700' : '#888';
            ctx.font = '12px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(`[Q] ${tabNames[i]}`, tabWidth * i + tabWidth / 2, 70);
        });
        ctx.textAlign = 'left';

        // 精灵图鉴：展示全部精灵（未发现的显示 ??? 占位）
        const allCreatureIds = cm.creaturesData.map(c => c.id);
        const dex = this.page === 'creature' ? cm.creatureDex : cm.npcDex;
        const keys = this.page === 'creature' ? allCreatureIds : Object.keys(dex);
        const startY = 90, itemHeight = 55;
        const maxVisible = Math.floor((H - startY - 40) / itemHeight);
        const scrollStart = Math.max(0, Math.min(this.scrollIndex, keys.length - maxVisible));
        const scrollEnd = Math.min(keys.length, scrollStart + maxVisible);

        for (let i = scrollStart; i < scrollEnd; i++) {
            const y = startY + (i - scrollStart) * itemHeight;
            const isSelected = i === this.scrollIndex;
            if (isSelected) {
                ctx.fillStyle = 'rgba(255,215,0,0.15)';
                ctx.fillRect(20, y - 5, W - 40, itemHeight - 5);
                ctx.strokeStyle = 'rgba(255,215,0,0.5)';
                ctx.lineWidth = 1;
                ctx.strokeRect(20, y - 5, W - 40, itemHeight - 5);
            }
            if (this.page === 'creature') {
                const cId = keys[i];
                const entry = cm.creatureDex[cId];
                if (entry && entry.encountered) {
                    // 已发现：正常显示
                    if (cm.spriteData[cId]) cm.renderCreature(ctx, 30, y + 2, 40, cId);
                    ctx.textAlign = 'left';
                    ctx.font = 'bold 14px monospace';
                    ctx.fillStyle = '#FFF';
                    ctx.fillText(`#${cId} ${entry.name}`, 80, y + 12);
                    const typeColors = { fire:'#F44336', water:'#2196F3', grass:'#4CAF50', electric:'#FFC107', rock:'#795548', dark:'#9C27B0', dragon:'#E91E63', normal:'#9E9E9E' };
                    const typeNames = { fire:'火', water:'水', grass:'草', electric:'电', rock:'岩', dark:'暗', dragon:'龙', normal:'普通' };
                    ctx.fillStyle = typeColors[entry.type] || '#9E9E9E';
                    ctx.font = '11px monospace';
                    ctx.fillText(typeNames[entry.type] || entry.type, 80, y + 28);
                    const rarityNames = { common:'普通', rare:'稀有', legendary:'传说' };
                    const rarityColors = { common:'#AAA', rare:'#2196F3', legendary:'#FFD700' };
                    ctx.fillStyle = rarityColors[entry.rarity] || '#AAA';
                    ctx.fillText(rarityNames[entry.rarity] || entry.rarity, 130, y + 28);
                    ctx.fillStyle = entry.caught ? '#4CAF50' : '#888';
                    ctx.font = '11px monospace';
                    ctx.fillText(entry.caught ? '已捕获' : '已遭遇', W - 90, y + 12);
                } else {
                    // 未发现：占位显示
                    ctx.textAlign = 'left';
                    ctx.font = 'bold 14px monospace';
                    ctx.fillStyle = '#444';
                    ctx.fillText(`#${cId} ???`, 80, y + 12);
                    ctx.font = '11px monospace';
                    ctx.fillStyle = '#333';
                    ctx.fillText('未发现', 80, y + 28);
                    // 占位图标
                    ctx.fillStyle = '#222';
                    ctx.fillRect(30, y + 2, 40, 40);
                    ctx.fillStyle = '#444';
                    ctx.font = '18px monospace';
                    ctx.textAlign = 'center';
                    ctx.fillText('?', 50, y + 30);
                    ctx.textAlign = 'left';
                }
            } else {
                const entry = dex[keys[i]];
                ctx.textAlign = 'left';
                ctx.font = 'bold 14px monospace';
                ctx.fillStyle = '#FFF';
                ctx.fillText(entry.name, 40, y + 15);
                const typeNames = { professor:'教授', trainer:'训练师', shop:'商店', healer:'治疗', dialog:'路人' };
                const typeColors = { professor:'#2196F3', trainer:'#F44336', shop:'#FFC107', healer:'#E91E63', dialog:'#9E9E9E' };
                ctx.fillStyle = typeColors[entry.type] || '#9E9E9E';
                ctx.font = '12px monospace';
                ctx.fillText(typeNames[entry.type] || entry.type, 40, y + 35);
                ctx.fillStyle = '#4CAF50';
                ctx.font = '11px monospace';
                ctx.fillText('已遭遇', W - 90, y + 20);
            }
        }
        if (keys.length === 0) { ctx.textAlign = 'center'; ctx.fillStyle = '#666'; ctx.font = '14px monospace'; ctx.fillText('还没有记录', W / 2, H / 2); }
        ctx.textAlign = 'center';
        ctx.fillStyle = '#888';
        ctx.font = '12px monospace';
        const hintText = this.page === 'creature' ? '↑↓浏览  确认查看详情  Q切换  ESC关闭' : '↑↓浏览  Q切换  ESC关闭';
        ctx.fillText(hintText, W / 2, H - 15);
        ctx.textAlign = 'left';
    }

    // ========== 师者指南页渲染 ==========
    _renderGuide() {
        const ctx = this.game.ctx;
        const W = this.game.W, H = this.game.H;

        ctx.fillStyle = 'rgba(0,0,0,0.88)';
        ctx.fillRect(0, 0, W, H);

        // 标题
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 20px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('灵师手册', W / 2, 30);

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

        // Tab栏
        const tabNames = ['灵兽图鉴', '训练师', '师者指南'];
        const tabKeys = ['creature', 'npc', 'guide'];
        const tabWidth = W / 3;
        tabKeys.forEach((key, i) => {
            ctx.fillStyle = this.page === key ? '#FFD700' : '#888';
            ctx.font = '12px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(`[Q] ${tabNames[i]}`, tabWidth * i + tabWidth / 2, 70);
        });

        // 指南内容区域（带裁剪）
        const contentY = 85;
        const contentH = H - contentY - 25;

        ctx.save();
        ctx.beginPath();
        ctx.rect(15, contentY, W - 30, contentH);
        ctx.clip();

        const baseY = contentY - this.guideScrollY;
        let y = baseY + 5;
        const leftX = 25;
        const rightX = W / 2 + 10;
        const lineH = 18;
        const sectionGap = 14;

        // ---- 标题装饰线 ----
        ctx.strokeStyle = 'rgba(255, 215, 0, 0.3)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(leftX, y); ctx.lineTo(W - leftX, y);
        ctx.stroke();
        y += sectionGap;

        // ===== 第一章：操作指南 =====
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 16px monospace';
        ctx.textAlign = 'left';
        ctx.fillText('◆ 操作指南', leftX, y); y += lineH + 4;

        const controls = [
            ['方向键 / WASD', '移动角色'],
            ['Z / Enter / 空格', '确认、调查、对话'],
            ['X / ESC', '取消、打开菜单'],
            ['Q / Tab', '在手册的三个页面间切换'],
            ['鼠标点击', '移动、交互、菜单操作'],
        ];
        ctx.font = '13px monospace';
        controls.forEach(([key, desc]) => {
            ctx.fillStyle = '#4FC3F7'; ctx.fillText(key, leftX + 10, y);
            ctx.fillStyle = '#BBB';   ctx.fillText('— ' + desc, leftX + 160, y);
            y += lineH;
        });
        y += sectionGap;

        // ===== 第二章：属性相性 =====
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 16px monospace';
        ctx.fillText('◆ 属性克制关系', leftX, y); y += lineH + 4;

        const typeChart = [
            { from: '火', icon: '🔥', strong: '草', weak: '水', color: '#F44336' },
            { from: '水', icon: '💧', strong: '火', weak: '电', color: '#2196F3' },
            { from: '草', icon: '🌿', strong: '水', weak: '火', color: '#4CAF50' },
            { from: '电', icon: '⚡', strong: '水', weak: '岩', color: '#FFC107' },
            { from: '岩', icon: '🪨', strong: '电', weak: '草', color: '#795548' },
            { from: '暗', icon: '🌑', strong: '', weak: '', color: '#9C27B0' },
            { from: '龙', icon: '🐉', strong: '', weak: '', color: '#E91E63' },
            { from: '普通', icon: '⚪', strong: '', weak: '', color: '#9E9E9E' },
        ];

        typeChart.forEach(t => {
            ctx.fillStyle = t.color; ctx.font = 'bold 13px monospace';
            ctx.fillText(`${t.icon} ${t.from}`, leftX + 10, y);
            if (t.strong) {
                ctx.fillStyle = '#4CAF50'; ctx.font = '12px monospace';
                ctx.fillText(`克制 ${t.strong}`, leftX + 80, y);
            }
            if (t.weak) {
                ctx.fillStyle = '#F44336'; ctx.font = '12px monospace';
                ctx.fillText(`被${t.weak}克制`, leftX + 170, y);
            }
            if (!t.strong && !t.weak) {
                ctx.fillStyle = '#666'; ctx.font = '12px monospace';
                ctx.fillText('— 无特殊相性', leftX + 80, y);
            }
            y += lineH - 2;
        });
        y += sectionGap;

        // ===== 第三章：战斗提示 =====
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 16px monospace';
        ctx.fillText('◆ 战斗基础', leftX, y); y += lineH + 4;

        const battleTips = [
            '· 每只精灵可以学会最多4个招式',
            '· 属性克制会使伤害×1.5，被克制则×0.7',
            '· 精灵HP归零时无法战斗，需去精灵中心恢复',
            '· 野生精灵可以用精灵球尝试捕获',
            '· 训练师战胜利后获得金钱和经验',
            '· 状态异常（中毒/麻痹等）会持续造成伤害',
        ];
        ctx.fillStyle = '#CCC';
        ctx.font = '13px monospace';
        battleTips.forEach(tip => {
            ctx.fillText(tip, leftX + 10, y);
            y += lineH;
        });
        y += sectionGap;

        // ===== 第四章：状态异常 =====
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 16px monospace';
        ctx.fillText('◆ 状态异常一览', leftX, y); y += lineH + 4;

        const statuses = [
            { name: '中毒', color: '#AEEA00', effect: '每回合损失HP', cure: '使用解毒药' },
            { name: '麻痹', color: '#FFE082', effect: '速度大幅下降，可能无法行动', cure: '使用解麻药' },
            { name: '烧伤', color: '#FF8A65', effect: '每回合损失HP，攻击降低', cure: '使用解烧伤药' },
            { name: '冰冻', color: '#80DEEA', effect: '完全无法行动', cure: '使用解冻药或等待融化' },
            { name: '睡眠', color: '#CE93D8', effect: '随机回合数内无法行动', cure: '等待醒来或被攻击唤醒' },
        ];
        statuses.forEach(s => {
            ctx.fillStyle = s.color; ctx.font = 'bold 13px monospace';
            ctx.fillText(`【${s.name}】`, leftX + 10, y);
            ctx.fillStyle = '#AAA'; ctx.font = '12px monospace';
            ctx.fillText(s.effect, leftX + 90, y);
            ctx.fillStyle = '#666';
            ctx.fillText(`(${s.cure})`, leftX + 280, y);
            y += lineH - 1;
        });
        y += sectionGap;

        // ===== 第五章：冒险建议 =====
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 16px monospace';
        ctx.fillText('◆ 冒险小贴士', leftX, y); y += lineH + 4;

        const tips = [
            '· 多准备一些伤药和精灵球再出发',
            '· 遇到新精灵时优先记录到图鉴中',
            '· 每到一个新城镇先拜访精灵中心',
            '· 与所有训练师对战可以积累经验',
            '· 存档是免费的，记得随时保存进度！',
        ];
        ctx.fillStyle = '#CCC';
        ctx.font = '13px monospace';
        tips.forEach(t => {
            ctx.fillText(t, leftX + 10, y);
            y += lineH;
        });
        y += sectionGap;

        // 尾部标注
        ctx.fillStyle = '#555';
        ctx.font = 'italic 11px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('— 父亲留给你的灵师手册 —', W / 2, y);

        ctx.restore(); // 恢复裁剪

        // 底部提示
        ctx.textAlign = 'center';
        ctx.fillStyle = '#888';
        ctx.font = '12px monospace';
        ctx.fillText('↑↓滚动浏览  Q切换页签  ESC返回', W / 2, H - 10);
        ctx.textAlign = 'left';
    }

    _renderDetail() {
        const ctx = this.game.ctx;
        const W = this.game.W, H = this.game.H;
        const cm = this.game.creaturesManager;
        const entry = cm.creatureDex[this.detailId];
        const cData = cm.creaturesData.find(c => c.id === this.detailId);

        ctx.fillStyle = 'rgba(0,0,0,0.92)';
        ctx.fillRect(0, 0, W, H);

        if (!entry || !cData) {
            ctx.textAlign = 'center'; ctx.fillStyle = '#666'; ctx.font = '14px monospace';
            ctx.fillText('没有数据', W / 2, H / 2);
            ctx.fillStyle = '#888'; ctx.font = '12px monospace';
            ctx.fillText('ESC返回', W / 2, H / 2 + 30);
            ctx.textAlign = 'left';
            return;
        }

        // 返回提示
        ctx.fillStyle = '#888'; ctx.font = '11px monospace';
        ctx.fillText('ESC ← 返回', 15, 18);

        // 精灵大图
        if (cm.spriteData[this.detailId]) {
            cm.renderCreature(ctx, W / 2 - 50, 40, 100, this.detailId);
        }

        // 名称 + 编号
        ctx.textAlign = 'center';
        ctx.fillStyle = '#FFD700'; ctx.font = 'bold 18px monospace';
        ctx.fillText(`#${this.detailId} ${entry.name}`, W / 2, 160);

        // 属性标签
        const typeColors = { fire:'#F44336', water:'#2196F3', grass:'#4CAF50', electric:'#FFC107', rock:'#795548', dark:'#9C27B0', dragon:'#E91E63', normal:'#9E9E9E' };
        const typeNames = { fire:'火', water:'水', grass:'草', electric:'电', rock:'岩', dark:'暗', dragon:'龙', normal:'普通' };
        const rarityNames = { common:'普通', rare:'稀有', legendary:'传说' };
        const rarityColors = { common:'#AAA', rare:'#2196F3', legendary:'#FFD700' };

        ctx.fillStyle = typeColors[entry.type] || '#9E9E9E'; ctx.font = '14px monospace';
        ctx.fillText(`属性: ${typeNames[entry.type] || entry.type}`, W / 2, 185);
        ctx.fillStyle = rarityColors[entry.rarity] || '#AAA';
        ctx.fillText(`稀有度: ${rarityNames[entry.rarity] || entry.rarity}`, W / 2, 205);
        ctx.fillStyle = entry.caught ? '#4CAF50' : '#888';
        ctx.fillText(entry.caught ? '已捕获' : '已遭遇', W / 2, 225);

        // 如果已捕获，显示种族值
        if (entry.caught && cData.baseStats) {
            ctx.textAlign = 'left';
            const bx = W / 2 - 80, by = 250;
            ctx.fillStyle = '#FFD700'; ctx.font = 'bold 13px monospace';
            ctx.fillText('种族值', bx, by);
            ctx.font = '12px monospace';
            const stats = cData.baseStats;
            const statLabels = { hp:'HP', attack:'攻击', defense:'防御', speed:'速度' };
            const statColors = { hp:'#4CAF50', attack:'#F44336', defense:'#2196F3', speed:'#FFC107' };
            let sy = by + 22;
            for (const [key, label] of Object.entries(statLabels)) {
                const val = stats[key] || 0;
                ctx.fillStyle = '#888';
                ctx.fillText(label, bx, sy);
                // 数值条
                ctx.fillStyle = '#333';
                ctx.fillRect(bx + 45, sy - 10, 120, 10);
                ctx.fillStyle = statColors[key] || '#9E9E9E';
                ctx.fillRect(bx + 45, sy - 10, Math.min(120, val * 0.8), 10);
                ctx.fillStyle = '#FFF';
                ctx.fillText(`${val}`, bx + 170, sy);
                sy += 20;
            }
            // 总计
            const total = Object.values(stats).reduce((s, v) => s + v, 0);
            ctx.fillStyle = '#FFD700'; ctx.font = 'bold 12px monospace';
            ctx.fillText(`总计: ${total}`, bx, sy + 5);
        }

        // 招式列表（仅已捕获显示）
        if (entry.caught && cData.skills) {
            ctx.textAlign = 'left';
            const sx = 15, sy2 = H - 80;
            ctx.fillStyle = '#FFD700'; ctx.font = 'bold 12px monospace';
            ctx.fillText('可学招式', sx, sy2);
            ctx.font = '11px monospace';
            // skills 是 ID 数组，需要从 skillsData 查名称
            const skillNames = cData.skills.slice(0, 4).map(sId => {
                const sd = cm.skillsData.find(s => s.id === sId);
                return sd ? sd.name : '?';
            });
            skillNames.forEach((name, i) => {
                ctx.fillStyle = '#CCC';
                ctx.fillText(`· ${name}`, sx + (i % 2 === 0 ? 0 : 140), sy2 + 18 + Math.floor(i / 2) * 16);
            });
        }

        ctx.textAlign = 'left';
    }
}

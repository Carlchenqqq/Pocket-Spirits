/**
 * DexPanel - 图鉴面板
 * 从 ExploreScene.js 提取：_updateDex, _renderDex, _renderDexDetail
 */
class DexPanel {
    constructor(game) {
        this.game = game;
        this.open = false;
        this.page = 'creature';
        this.scrollIndex = 0;
        this.detailMode = false;
        this.detailId = null;
    }

    openDex() {
        this.open = true;
        this.page = 'creature';
        this.scrollIndex = 0;
        this.detailMode = false;
        this.detailId = null;
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

        // 精灵图鉴：展示全部精灵（含未发现的占位）
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
                // Tab 切换页签
                if (click.y < 80) { this.page = this.page === 'creature' ? 'npc' : 'creature'; this.scrollIndex = 0; return; }
                // 列表项
                if (click.y >= startY && click.y < startY + maxVisible * itemH) {
                    const scrollStart = Math.max(0, Math.min(this.scrollIndex, keys.length - maxVisible));
                    const idx = scrollStart + Math.floor((click.y - startY) / itemH);
                    if (idx >= 0 && idx < keys.length) {
                        this.scrollIndex = idx;
                        // 双击或点击已发现精灵进入详情
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
        if (g.input.isJustPressed('Tab') || g.input.isJustPressed('KeyQ')) { this.page = this.page === 'creature' ? 'npc' : 'creature'; this.scrollIndex = 0; }
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

        ctx.fillStyle = 'rgba(0,0,0,0.85)';
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 20px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('图鉴', W / 2, 30);

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

        ctx.fillStyle = this.page === 'creature' ? '#FFD700' : '#888';
        ctx.fillText('[Q] 精灵图鉴', W / 4, 70);
        ctx.fillStyle = this.page === 'npc' ? '#FFD700' : '#888';
        ctx.fillText('[Q] NPC图鉴', W * 3 / 4, 70);
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

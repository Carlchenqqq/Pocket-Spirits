/**
 * QuestPanel - 任务面板
 * 左右布局：左侧任务列表，右侧任务详情
 */
class QuestPanel {
    constructor(game) {
        this.game = game;
        this.open = false;
        this.selectedIndex = 0;
        // 任务名称和描述映射
        this.questInfo = {
            'quest_start':          { name: '前往碧波镇',   desc: '前往碧波镇，找到澜汐馆主做灵师资质测试。', type: '主线' },
            'quest_train_three':    { name: '训练师之路',   desc: '击败至少3个训练师，证明你的实力！', type: '主线' },
            'quest_suspicious_people': { name: '可疑人物',  desc: '调查碧波森林深处的可疑人物。', type: '支线' },
            'quest_sea_route':      { name: '海上航线',     desc: '获得碧波徽章后，找船夫开启海上航线。', type: '主线' },
            'quest_crystal_hint':   { name: '灵晶碎片',     desc: '在迷雾沼泽中找到灵晶碎片。', type: '支线' },
            'spirit_crystal_south': { name: '灵晶碎片·南', desc: '在迷雾沼泽中发现的灵晶碎片。', type: '收集' },
            'spirit_crystal_east':  { name: '灵晶碎片·东', desc: '在礁石航道中发现的灵晶碎片。', type: '收集' },
            'spirit_crystal_west':  { name: '灵晶碎片·西', desc: '在赤岩古道中发现的灵晶碎片。', type: '收集' },
            'quest_warn_others':    { name: '警告其他地区', desc: '其他道馆也收到了浊流的「合作邀请」，需要警告他们。', type: '主线' },
        };
    }

    _getQuestName(qId) { return this.questInfo[qId]?.name || qId; }
    _getQuestDesc(qId) { return this.questInfo[qId]?.desc || ''; }
    _getQuestType(qId) { return this.questInfo[qId]?.type || '其他'; }

    openQuest() { this.open = true; this.selectedIndex = 0; }
    closeQuest() { this.open = false; }

    update(now) {
        const g = this.game;
        const quests = g.quests || {};
        const questKeys = Object.keys(quests);

        if (g.input.hasPendingClick()) {
            const click = g.input.getClick();
            if (click) {
                // 返回按钮
                const backBtnW = 50, backBtnH = 22;
                const backBtnX = g.W - backBtnW - 10, backBtnY = 8;
                if (click.x >= backBtnX && click.x <= backBtnX + backBtnW &&
                    click.y >= backBtnY && click.y <= backBtnY + backBtnH) { this.closeQuest(); return; }

                // 左侧列表点击
                const listX = 20, listW = 320, listStartY = 70, itemH = 44;
                if (click.x >= listX && click.x <= listX + listW && click.y >= listStartY) {
                    const maxVisible = Math.floor((g.H - listStartY - 30) / itemH);
                    const scrollStart = Math.max(0, Math.min(this.selectedIndex, questKeys.length - maxVisible));
                    const scrollEnd = Math.min(questKeys.length, scrollStart + maxVisible);
                    for (let i = scrollStart; i < scrollEnd; i++) {
                        const iy = listStartY + (i - scrollStart) * itemH;
                        if (click.y >= iy && click.y <= iy + itemH - 4) {
                            this.selectedIndex = i;
                            return;
                        }
                    }
                }
            }
        }
        if (g.input.isJustPressed('ArrowUp') || g.input.isJustPressed('KeyW')) this.selectedIndex = Math.max(0, this.selectedIndex - 1);
        if (g.input.isJustPressed('ArrowDown') || g.input.isJustPressed('KeyS')) this.selectedIndex = Math.min(questKeys.length - 1, this.selectedIndex + 1);
        if (g.input.isCancelPressed()) this.closeQuest();
    }

    render() {
        const ctx = this.game.ctx;
        const W = this.game.W, H = this.game.H;
        const g = this.game;
        const quests = g.quests || {};
        const questKeys = Object.keys(quests);

        // 全屏背景
        ctx.fillStyle = 'rgba(0,0,0,0.85)';
        ctx.fillRect(0, 0, W, H);

        // 标题
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 20px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('任务日志', W / 2, 30);
        ctx.textAlign = 'left';

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

        // 统计
        const active = questKeys.filter(k => quests[k] === 'active').length;
        const completed = questKeys.filter(k => quests[k] === 'completed').length;
        ctx.font = '12px monospace';
        ctx.fillStyle = '#AAA';
        ctx.textAlign = 'center';
        ctx.fillText(`进行中: ${active}  已完成: ${completed}`, W / 2, 52);
        ctx.textAlign = 'left';

        if (questKeys.length === 0) {
            ctx.textAlign = 'center';
            ctx.fillStyle = '#666';
            ctx.font = '14px monospace';
            ctx.fillText('暂无任务记录', W / 2, H / 2);
        } else {
            // ===== 左侧：任务列表 =====
            const listX = 20, listW = 320;
            const listStartY = 70, itemH = 44;
            const maxVisible = Math.floor((H - listStartY - 30) / itemH);
            const scrollStart = Math.max(0, Math.min(this.selectedIndex, questKeys.length - maxVisible));
            const scrollEnd = Math.min(questKeys.length, scrollStart + maxVisible);

            // 列表背景
            ctx.fillStyle = 'rgba(10, 15, 35, 0.6)';
            ctx.fillRect(listX, listStartY - 5, listW, H - listStartY - 25);
            ctx.strokeStyle = 'rgba(255, 215, 0, 0.3)';
            ctx.lineWidth = 1;
            ctx.strokeRect(listX, listStartY - 5, listW, H - listStartY - 25);

            for (let i = scrollStart; i < scrollEnd; i++) {
                const qId = questKeys[i];
                const status = quests[qId];
                const y = listStartY + (i - scrollStart) * itemH;
                const isSelected = i === this.selectedIndex;

                // 选中高亮
                if (isSelected) {
                    ctx.fillStyle = 'rgba(255,215,0,0.15)';
                    ctx.fillRect(listX + 4, y, listW - 8, itemH - 4);
                    // 左侧指示条
                    ctx.fillStyle = '#FFD700';
                    ctx.fillRect(listX + 4, y, 3, itemH - 4);
                }

                // 任务类型标签
                const qType = this._getQuestType(qId);
                const typeColors = { '主线': '#FF6B6B', '支线': '#4FC3F7', '收集': '#81C784', '其他': '#AAA' };
                ctx.fillStyle = typeColors[qType] || '#AAA';
                ctx.font = '10px monospace';
                ctx.fillText(`[${qType}]`, listX + 14, y + 14);

                // 任务名称
                ctx.font = 'bold 13px monospace';
                ctx.fillStyle = isSelected ? '#FFD700' : '#FFF';
                ctx.fillText(this._getQuestName(qId), listX + 14, y + 30);

                // 状态标签（右侧）
                const isCompleted = status === 'completed';
                const isActive = status === 'active';
                ctx.font = '10px monospace';
                ctx.textAlign = 'right';
                if (isCompleted) {
                    ctx.fillStyle = '#4CAF50';
                    ctx.fillText('✓ 已完成', listX + listW - 14, y + 22);
                } else if (isActive) {
                    ctx.fillStyle = '#FFC107';
                    ctx.fillText('● 进行中', listX + listW - 14, y + 22);
                } else {
                    ctx.fillStyle = '#888';
                    ctx.fillText(status, listX + listW - 14, y + 22);
                }
                ctx.textAlign = 'left';
            }

            // ===== 右侧：任务详情 =====
            const detailX = listX + listW + 20;
            const detailY = listStartY - 5;
            const detailW = W - detailX - 20;
            const detailH = H - listStartY - 25;

            // 详情面板背景
            ctx.fillStyle = 'rgba(10, 15, 35, 0.7)';
            ctx.fillRect(detailX, detailY, detailW, detailH);
            ctx.strokeStyle = 'rgba(255, 215, 0, 0.3)';
            ctx.lineWidth = 1;
            ctx.strokeRect(detailX, detailY, detailW, detailH);

            const selectedId = questKeys[this.selectedIndex];
            if (selectedId) {
                const px = detailX + 16;
                let py = detailY + 24;

                // 任务类型标签
                const qType = this._getQuestType(selectedId);
                const typeColors = { '主线': '#FF6B6B', '支线': '#4FC3F7', '收集': '#81C784', '其他': '#AAA' };
                ctx.fillStyle = typeColors[qType] || '#AAA';
                ctx.font = 'bold 11px monospace';
                ctx.fillText(`[${qType}]`, px, py);
                py += 22;

                // 任务名称
                ctx.fillStyle = '#FFF';
                ctx.font = 'bold 16px monospace';
                ctx.fillText(this._getQuestName(selectedId), px, py);
                py += 28;

                // 分割线
                ctx.fillStyle = 'rgba(255,215,0,0.2)';
                ctx.fillRect(px, py, detailW - 32, 1);
                py += 16;

                // 状态
                const status = quests[selectedId];
                const isCompleted = status === 'completed';
                const isActive = status === 'active';
                ctx.font = 'bold 12px monospace';
                if (isCompleted) {
                    ctx.fillStyle = '#4CAF50';
                    ctx.fillText('状态: ✓ 已完成', px, py);
                } else if (isActive) {
                    ctx.fillStyle = '#FFC107';
                    ctx.fillText('状态: ● 进行中', px, py);
                } else {
                    ctx.fillStyle = '#888';
                    ctx.fillText('状态: ' + status, px, py);
                }
                py += 24;

                // 分割线
                ctx.fillStyle = 'rgba(255,215,0,0.2)';
                ctx.fillRect(px, py, detailW - 32, 1);
                py += 16;

                // 任务描述标题
                ctx.fillStyle = '#AAA';
                ctx.font = 'bold 12px monospace';
                ctx.fillText('任务描述', px, py);
                py += 20;

                // 任务描述内容（自动换行）
                const desc = this._getQuestDesc(selectedId);
                if (desc) {
                    ctx.fillStyle = '#DDD';
                    ctx.font = '13px monospace';
                    const maxDescW = detailW - 40;
                    const lines = [];
                    let line = '';
                    for (let ch of desc) {
                        const testLine = line + ch;
                        if (ctx.measureText(testLine).width > maxDescW && line.length > 0) {
                            lines.push(line);
                            line = ch;
                        } else {
                            line = testLine;
                        }
                    }
                    lines.push(line);
                    lines.forEach(l => {
                        ctx.fillText(l, px + 4, py);
                        py += 20;
                    });
                } else {
                    ctx.fillStyle = '#666';
                    ctx.font = '12px monospace';
                    ctx.fillText('暂无描述', px + 4, py);
                    py += 20;
                }

                py += 12;

                // 分割线
                ctx.fillStyle = 'rgba(255,215,0,0.2)';
                ctx.fillRect(px, py, detailW - 32, 1);
                py += 16;

                // 任务进度（如果有）
                ctx.fillStyle = '#AAA';
                ctx.font = 'bold 12px monospace';
                ctx.fillText('任务进度', px, py);
                py += 20;

                // 根据任务类型显示不同进度
                if (selectedId === 'quest_train_three') {
                    const defeated = (g.creaturesManager.defeatedTrainers || []).length;
                    const needed = 3;
                    const progress = Math.min(defeated, needed);
                    ctx.font = '12px monospace';
                    ctx.fillStyle = '#DDD';
                    ctx.fillText(`击败训练师: ${progress} / ${needed}`, px + 4, py);
                    py += 18;
                    // 进度条
                    const barW = detailW - 48;
                    ctx.fillStyle = '#222';
                    ctx.fillRect(px + 4, py - 8, barW, 10);
                    ctx.fillStyle = progress >= needed ? '#4CAF50' : '#FFC107';
                    ctx.fillRect(px + 4, py - 8, barW * (progress / needed), 10);
                    ctx.strokeStyle = '#555';
                    ctx.lineWidth = 1;
                    ctx.strokeRect(px + 4, py - 8, barW, 10);
                } else if (selectedId.startsWith('spirit_crystal_')) {
                    const crystalCount = Object.keys(quests).filter(k => k.startsWith('spirit_crystal_') && quests[k] === 'collected').length;
                    ctx.font = '12px monospace';
                    ctx.fillStyle = '#DDD';
                    ctx.fillText(`灵晶碎片: ${crystalCount} / 3`, px + 4, py);
                    py += 18;
                    const barW = detailW - 48;
                    ctx.fillStyle = '#222';
                    ctx.fillRect(px + 4, py - 8, barW, 10);
                    ctx.fillStyle = crystalCount >= 3 ? '#4CAF50' : '#4FC3F7';
                    ctx.fillRect(px + 4, py - 8, barW * (crystalCount / 3), 10);
                    ctx.strokeStyle = '#555';
                    ctx.lineWidth = 1;
                    ctx.strokeRect(px + 4, py - 8, barW, 10);
                } else if (selectedId === 'quest_sea_route') {
                    const badges = g.creaturesManager.badges || [];
                    const hasBadge = badges.length > 0;
                    ctx.font = '12px monospace';
                    ctx.fillStyle = '#DDD';
                    ctx.fillText(`获得碧波徽章: ${hasBadge ? '✓ 是' : '✗ 否'}`, px + 4, py);
                } else if (selectedId === 'quest_start') {
                    // 检查是否在碧波镇
                    const map = g.mapManager ? g.mapManager.getCurrentMap() : null;
                    const inBibo = map && (map.id === 'bibo_town' || map.id === 'town2');
                    ctx.font = '12px monospace';
                    ctx.fillStyle = '#DDD';
                    ctx.fillText(`当前位置: ${map ? map.name : '未知'}`, px + 4, py);
                    py += 18;
                    ctx.fillText(`到达碧波镇: ${inBibo ? '✓ 是' : '✗ 否'}`, px + 4, py);
                } else {
                    ctx.font = '12px monospace';
                    ctx.fillStyle = '#666';
                    ctx.fillText('暂无进度信息', px + 4, py);
                }
            }
        }

        // 操作提示
        ctx.textAlign = 'center';
        ctx.fillStyle = '#888';
        ctx.font = '12px monospace';
        ctx.fillText('↑↓选择  点击切换  ESC关闭', W / 2, H - 12);
        ctx.textAlign = 'left';
    }
}

/**
 * BattleRenderer - 战斗渲染器（纯渲染层）
 * 只负责将战斗数据绘制到 Canvas，不保存任何状态
 */
class BattleRenderer {
    constructor(ctx, canvas) {
        this.ctx = ctx;
        this.W = canvas.width;
        this.H = canvas.height;
    }

    /** 主渲染入口 */
    render(state, ui, creaturesManager) {
        if (!state || state.phase === 'idle') return;

        const ctx = this.ctx;
        const s = state; // 简写

        this._renderBackground(ctx);
        this._renderEnemyCreature(ctx, s.enemyCreature, s._shakeOffset, s._shakeTarget === 'enemy', creaturesManager);
        this._renderPlayerCreature(ctx, s.playerCreature, s._shakeOffset, s._shakeTarget === 'player', creaturesManager);
        this._renderEnemyInfo(ctx, s.enemyCreature, ui, creaturesManager);
        this._renderPlayerInfo(ctx, s.playerCreature, ui, creaturesManager);

        if (s.phase === 'menu') {
            this._renderMenu(ctx, state.menuIndex || 0);
        }
        if (s.phase === 'skillSelect') {
            this._renderSkillSelect(ctx, s.playerCreature, state.skillIndex || 0, creaturesManager);
        }

        this._renderLog(ctx, s.log);
        if (s.phase === 'result') {
            this._renderResult(ctx, s.result);
        }
    }

    // ─── 背景 ───
    _renderBackground(ctx) {
        const gradient = ctx.createLinearGradient(0, 0, 0, this.H);
        gradient.addColorStop(0, '#87CEEB');
        gradient.addColorStop(0.5, '#98FB98');
        gradient.addColorStop(1, '#228B22');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, this.W, this.H);

        // 远山
        ctx.fillStyle = '#5a8a4a';
        ctx.beginPath();
        ctx.moveTo(0, this.H * 0.45);
        ctx.lineTo(80, this.H * 0.3);
        ctx.lineTo(160, this.H * 0.42);
        ctx.lineTo(240, this.H * 0.28);
        ctx.lineTo(360, this.H * 0.38);
        ctx.lineTo(440, this.H * 0.32);
        ctx.lineTo(540, this.H * 0.4);
        ctx.lineTo(640, this.H * 0.35);
        ctx.lineTo(640, this.H * 0.5);
        ctx.lineTo(0, this.H * 0.5);
        ctx.fill();

        // 云朵
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.fillRect(60, 30, 40, 12);
        ctx.fillRect(50, 36, 60, 10);
        ctx.fillRect(55, 26, 30, 8);
        ctx.fillRect(350, 50, 50, 14);
        ctx.fillRect(340, 56, 70, 10);
        ctx.fillRect(355, 44, 40, 10);
        ctx.fillRect(520, 20, 35, 10);
        ctx.fillRect(512, 26, 50, 8);

        // 地面
        ctx.fillStyle = '#4a8c3f';
        ctx.fillRect(0, this.H * 0.6, this.W, this.H * 0.4);
        ctx.fillStyle = '#3d7a34';
        ctx.fillRect(20, this.H * 0.65, 30, 2);
        ctx.fillRect(100, this.H * 0.72, 40, 2);
        ctx.fillRect(300, this.H * 0.68, 35, 2);
        ctx.fillRect(450, this.H * 0.75, 25, 2);
    }

    // ─── 精灵 ───
    _renderEnemyCreature(ctx, creature, shakeOffset, isShaking, cm) {
        if (!creature) return;
        const ox = isShaking ? (shakeOffset.x || 0) : 0;
        const oy = isShaking ? (shakeOffset.y || 0) : 0;
        cm.renderCreature(ctx, creature.id, 420 + ox, 50 + oy, 96, true);
    }

    _renderPlayerCreature(ctx, creature, shakeOffset, isShaking, cm) {
        if (!creature) return;
        const ox = isShaking ? (shakeOffset.x || 0) : 0;
        const oy = isShaking ? (shakeOffset.y || 0) : 0;
        cm.renderCreature(ctx, creature.id, 80 + ox, 240 + oy, 112);
    }

    // ─── 信息框 ───
    _renderEnemyInfo(ctx, creature, ui, cm) {
        if (!creature) return;
        const c = creature;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(280, 20, 220, 55);
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 1;
        ctx.strokeRect(280, 20, 220, 55);

        ctx.fillStyle = '#FFF';
        ctx.font = 'bold 13px monospace';
        ctx.fillText(c.name, 290, 40);
        ctx.fillStyle = '#AAA';
        ctx.font = '12px monospace';
        ctx.fillText(`Lv.${c.level}`, 410, 40);

        ctx.fillStyle = cm.getTypeColor(c.type);
        ctx.font = '11px monospace';
        ctx.fillText(c.type, 290, 54);

        ui.renderHPBar(290, 58, 200, 10, c.currentHP, c.maxHP);

        ctx.fillStyle = '#AAA';
        ctx.font = '10px monospace';
        ctx.fillText(`${c.currentHP}/${c.maxHP}`, 410, 68);
    }

    _renderPlayerInfo(ctx, creature, ui, cm) {
        if (!creature) return;
        const c = creature;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(10, 280, 240, 60);
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 1;
        ctx.strokeRect(10, 280, 240, 60);

        ctx.fillStyle = '#FFF';
        ctx.font = 'bold 13px monospace';
        ctx.fillText(c.name, 20, 300);
        ctx.fillStyle = '#AAA';
        ctx.font = '12px monospace';
        ctx.fillText(`Lv.${c.level}`, 180, 300);

        ctx.fillStyle = cm.getTypeColor(c.type);
        ctx.font = '11px monospace';
        ctx.fillText(c.type, 20, 314);

        ui.renderHPBar(20, 320, 220, 12, c.currentHP, c.maxHP);

        ctx.fillStyle = '#AAA';
        ctx.font = '10px monospace';
        ctx.fillText(`${c.currentHP}/${c.maxHP}`, 180, 330);

        // 经验条
        if (c.expToNext > 0) {
            const expRatio = c.exp / c.expToNext;
            ctx.fillStyle = '#333';
            ctx.fillRect(20, 334, 220, 4);
            ctx.fillStyle = '#4169E1';
            ctx.fillRect(20, 334, 220 * expRatio, 4);
        }
    }

    // ─── 菜单 ───
    static MENU_ITEMS = ['攻击', '捕捉', '切换', '逃跑'];
    static get menuLayout() {
        return { x: 340, y: 300, w: 280, h: 120 };
    }

    _renderMenu(ctx, selectedIndex) {
        const { x: menuX, y: menuY } = BattleRenderer.menuLayout;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(menuX, menuY, 280, 120);
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 1;
        ctx.strokeRect(menuX, menuY, 280, 120);

        ctx.font = '14px monospace';
        const items = BattleRenderer.MENU_ITEMS;
        for (let i = 0; i < items.length; i++) {
            const col = i % 2;
            const row = Math.floor(i / 2);
            const ix = menuX + 15 + col * 130;
            const iy = menuY + 20 + row * 42;

            if (i === selectedIndex) {
                ctx.fillStyle = 'rgba(255, 215, 0, 0.2)';
                ctx.fillRect(ix - 5, iy - 12, 120, 30);
                ctx.fillStyle = '#FFD700';
                ctx.fillText('▶', ix, iy + 2);
            }

            ctx.fillStyle = i === selectedIndex ? '#FFF' : '#AAA';
            ctx.fillText(items[i], ix + 16, iy + 2);
        }
    }

    // ─── 技能选择 ───
    static get skillLayout() {
        return { x: 20, y: 380, w: 600, h: 65 };
    }

    _renderSkillSelect(ctx, creature, selectedIndex, cm) {
        if (!creature) return;
        const { x: boxX, y: boxY, w: boxW, h: boxH } = BattleRenderer.skillLayout;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        ctx.fillRect(boxX, boxY, boxW, boxH);
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 1;
        ctx.strokeRect(boxX, boxY, boxW, boxH);

        const skills = creature.skills;
        for (let i = 0; i < skills.length; i++) {
            const col = i % 2;
            const row = Math.floor(i / 2);
            const sx = boxX + 15 + col * 280;
            const sy = boxY + 15 + row * 25;

            if (i === selectedIndex) {
                ctx.fillStyle = 'rgba(255, 215, 0, 0.2)';
                ctx.fillRect(sx - 5, sy - 10, 265, 22);
                ctx.fillStyle = '#FFD700';
                ctx.fillText('▶', sx, sy + 2);
            }

            const skill = skills[i];
            ctx.fillStyle = skill.currentPP > 0 ? (i === selectedIndex ? '#FFF' : '#CCC') : '#666';
            ctx.font = '12px monospace';
            ctx.fillText(`${skill.name}`, sx + 16, sy + 2);

            ctx.fillStyle = cm.getTypeColor(skill.type);
            ctx.fillText(skill.type, sx + 90, sy + 2);

            ctx.fillStyle = '#888';
            ctx.fillText(`PP:${skill.currentPP}/${skill.pp}`, sx + 150, sy + 2);
        }

        ctx.fillStyle = '#888';
        ctx.font = '11px monospace';
        ctx.fillText('B返回', boxX + boxW - 60, boxY + boxH - 8);
    }

    // ─── 战斗日志 ───
    _renderLog(ctx, log) {
        if (!log || log.length === 0) return;
        const logX = 10, logY = 220;

        ctx.font = '11px monospace';
        const displayLogs = log.slice(-3);
        displayLogs.forEach((l, i) => {
            ctx.fillStyle = 'rgba(0,0,0,0.5)';
            ctx.fillRect(logX, logY + i * 16, ctx.measureText(l).width + 10, 14);
            ctx.fillStyle = '#FFF';
            ctx.fillText(l, logX + 5, logY + i * 16 + 11);
        });
    }

    // ─── 结果画面 ───
    static get resultButtonLayout() {
        const btnW = 120, btnH = 35;
        return {
            btnW, btnH,
            btnX: (640 - btnW) / 2,
            btnY: 480 / 2 + 40
        };
    }

    _renderResult(ctx, result) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, this.W, this.H);

        ctx.textAlign = 'center';
        ctx.font = 'bold 22px monospace';

        switch (result) {
            case 'win':
                ctx.fillStyle = '#FFD700';
                ctx.fillText('胜利！', this.W / 2, this.H / 2 - 20);
                break;
            case 'lose':
                ctx.fillStyle = '#F44336';
                ctx.fillText('战斗失败...', this.W / 2, this.H / 2 - 20);
                ctx.font = '14px monospace';
                ctx.fillStyle = '#AAA';
                ctx.fillText('回到最近的城镇...', this.W / 2, this.H / 2 + 15);
                break;
            case 'catch_success':
                ctx.fillStyle = '#4CAF50';
                ctx.fillText('捕获成功！', this.W / 2, this.H / 2 - 20);
                break;
            case 'run':
                ctx.fillStyle = '#AAA';
                ctx.fillText('成功逃跑！', this.W / 2, this.H / 2 - 20);
                break;
        }

        // 继续按钮
        const { btnX, btnY, btnW, btnH } = BattleRenderer.resultButtonLayout;
        ctx.fillStyle = 'rgba(255, 215, 0, 0.3)';
        ctx.fillRect(btnX, btnY, btnW, btnH);
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 2;
        ctx.strokeRect(btnX, btnY, btnW, btnH);

        ctx.fillStyle = '#FFD700';
        ctx.font = '14px monospace';
        ctx.fillText('点击继续', this.W / 2, btnY + 23);
        ctx.textAlign = 'left';
    }
}

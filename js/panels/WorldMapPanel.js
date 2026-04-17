/**
 * WorldMapPanel - 世界地图传送面板
 * 从 ExploreScene.js 提取：世界地图相关全部方法（411行）
 */
class WorldMapPanel {
    constructor(game) {
        this.game = game;
        this.open = false;
        this.index = 0;
        this._worldMapCache = null;

        // 回调：由 ExploreScene 注入
        this.onClose = null;
    }

    openMap() {
        this.open = true;
        this.index = 0;
    }

    closeMap() {
        this.open = false;
    }

    // ========== 世界地图布局定义 ==========

    /**
     * 世界地图布局定义 - V4 精确物理方向版
     *
     * 核心原则：卡片相对位置必须 = 游戏内实际行走方向！
     *
     *   上 屏幕上方 = 北 (North)   = 游戏中向上走
     *   下 屏幕下方 = 南 (South)   = 游戏中向下走
     *   右 屏幕右方 = 东 (East)    = 游戏中向右走
     *   左 屏幕左方 = 西 (West)    = 游戏中向左走
     */
    _getWorldMapLayout() {
        return {
            mapIds: [
                'qingye_town', 'route_001', 'bibo_forest', 'bibo_town',
                'mist_marsh', 'reef_route', 'redrock_path', 'lingyuan_chamber',
                'yanyang_city', 'abandoned_mine'
            ],
            nodes: null,
            cardW: 170,
            cardH: 64,
            // 连接边（基于实际 transfers 方向）
            edges: [
                { from: 'qingye_town', to: 'route_001' },
                { from: 'route_001', to: 'bibo_forest' },
                { from: 'bibo_forest', to: 'bibo_town' },
                { from: 'bibo_town', to: 'mist_marsh' },
                { from: 'bibo_town', to: 'reef_route' },
                { from: 'bibo_town', to: 'redrock_path' },
                { from: 'bibo_town', to: 'lingyuan_chamber' },
                { from: 'redrock_path', to: 'yanyang_city' },
                { from: 'yanyang_city', to: 'abandoned_mine' }
            ]
        };
    }

    /**
     * 计算卡片坐标（V4 精确物理版）
     */
    _buildWorldMapCardLayout() {
        const layout = this._getWorldMapLayout();
        if (layout.nodes) return layout;

        const CW = layout.cardW, CH = layout.cardH;
        const GAP_X = 24, GAP_Y = 18;

        const positions = {
            'qingye_town':      { row: 0, col: 0 },
            'route_001':        { row: 1, col: 0 },
            'bibo_forest':      { row: 1, col: 1 },
            'bibo_town':        { row: 1, col: 2 },
            'redrock_path':     { row: 1, col: 3 },
            'mist_marsh':       { row: 2, col: 1 },
            'reef_route':       { row: 2, col: 2 },
            'lingyuan_chamber': { row: 2, col: 3 },
            'yanyang_city':     { row: 3, col: 3 },
            'abandoned_mine':   { row: 4, col: 3 }
        };

        let maxRow = 0, maxCol = 0;
        for (const pos of Object.values(positions)) {
            maxRow = Math.max(maxRow, pos.row);
            maxCol = Math.max(maxCol, pos.col);
        }

        const MARGIN = 40;
        const nodes = {};
        for (const [id, pos] of Object.entries(positions)) {
            nodes[id] = {
                x: MARGIN + pos.col * (CW + GAP_X),
                y: MARGIN + pos.row * (CH + GAP_Y)
            };
        }

        layout.nodes = nodes;
        layout.canvasW = MARGIN * 2 + maxCol * (CW + GAP_X) + CW;
        layout.canvasH = MARGIN * 2 + maxRow * (CH + GAP_Y) + CH;
        return layout;
    }

    /** 道馆传送点定义（只有这些城镇可点击传送） */
    _getTeleportPoints() {
        return [
            { id: 'bibo_town',    name: '碧波镇',  badgeId: null,           badgeName: '（起始可达）',  leaderName: '澜汐' },
            { id: 'yanyang_city', name: '炎阳城',  badgeId: 'bibo_badge',   badgeName: '碧波徽章',     leaderName: '炎烈' }
        ];
    }

    /** 地图类型配置（颜色+标签） */
    _getMapTypeConfig(type) {
        const configs = {
            town:    { label: '城镇', color: '#FFD700', bg: 'rgba(255,215,0,0.12)', border: 'rgba(255,215,0,0.5)' },
            route:   { label: '道路', color: '#81C784', bg: 'rgba(129,199,132,0.10)', border: 'rgba(129,199,132,0.4)' },
            dungeon: { label: '副本', color: '#E57373', bg: 'rgba(229,115,115,0.10)', border: 'rgba(229,115,115,0.4)' },
            special: { label: '秘境', color: '#CE93D8', bg: 'rgba(206,147,216,0.10)', border: 'rgba(206,147,216,0.4)' }
        };
        return configs[type] || configs.route;
    }

    /**
     * V6 直绘版：计算世界地图在屏幕上的最终显示布局（无离屏canvas）
     */
    _getWorldMapDisplayLayout() {
        const g = this.game;
        const W = g.W, H = g.H;
        const layout = this._buildWorldMapCardLayout();
        if (!layout.nodes) return null;

        const TOP_MARGIN = 70, BOTTOM_MARGIN = 50, SIDE_MARGIN = 20;
        const availW = W - SIDE_MARGIN * 2;
        const availH = H - TOP_MARGIN - BOTTOM_MARGIN;

        const scale = Math.min(availW / layout.canvasW, availH / layout.canvasH, 2.0);

        const displayW = layout.canvasW * scale;
        const displayH = layout.canvasH * scale;
        const offsetX = Math.floor((W - displayW) / 2);
        const offsetY = Math.floor(TOP_MARGIN + (availH - displayH) / 2);

        const cardRegions = {};
        const CW = layout.cardW * scale;
        const CH = layout.cardH * scale;
        for (const [mapId, node] of Object.entries(layout.nodes)) {
            cardRegions[mapId] = {
                x: offsetX + node.x * scale,
                y: offsetY + node.y * scale,
                w: CW, h: CH
            };
        }

        const connLines = [];
        for (const edge of layout.edges) {
            const rFrom = cardRegions[edge.from];
            const rTo = cardRegions[edge.to];
            if (!rFrom || !rTo) continue;
            connLines.push({ from: edge.from, to: edge.to, rFrom, rTo });
        }

        return {
            offsetX, offsetY, scale,
            layout, cardRegions, connLines,
            areaX: offsetX, areaY: offsetY,
            areaW: displayW, areaH: displayH
        };
    }

    /** 辅助：绘制圆角矩形路径 */
    _roundRect(ctx, x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
    }

    /** 获取地图之间的传送点连接线数据（保留兼容） */
    _getMapConnections() {
        const g = this.game;
        const mm = g.mapManager;
        const conns = [];
        const seen = new Set();

        const allMapIds = [
            'qingye_town', 'route_001', 'bibo_forest', 'bibo_town',
            'mist_marsh', 'reef_route', 'redrock_path', 'lingyuan_chamber',
            'yanyang_city', 'abandoned_mine',
            'town1', 'wild', 'town2', 'cave'
        ];
        for (const id of allMapIds) {
            const map = mm.maps[id];
            if (!map || !map.transfers) continue;
            for (const t of map.transfers) {
                const key = [id, t.targetMap, t.x, t.y, t.targetX, t.targetY].join(',');
                if (!seen.has(key)) {
                    seen.add(key);
                    conns.push({
                        from: id, to: t.targetMap,
                        fx: t.x, fy: t.y,
                        tx: t.targetX, ty: t.targetY
                    });
                }
            }
        }
        return conns;
    }

    /** 获取世界地图显示参数（V6 直绘版） */
    _getWorldMapDisplayParams() {
        return this._getWorldMapDisplayLayout();
    }

    // ========== 更新与渲染 ==========

    update(now) {
        const g = this.game;

        // ESC关闭
        if (g.input.isCancelPressed()) { this.closeMap(); return; }

        // 点击检测
        if (g.input.hasPendingClick()) {
            const click = g.input.getClick();
            if (click) {
                // 返回按钮（与渲染一致）
                const backBtnW = 70, backBtnH = 28;
                const backBtnX = g.W - backBtnW - 15, backBtnY = 18;
                if (click.x >= backBtnX && click.x <= backBtnX + backBtnW &&
                    click.y >= backBtnY && click.y <= backBtnY + backBtnH) { this.closeMap(); return; }

                // 检测点击了哪张地图卡片（V6 直绘版：cardRegions 已是屏幕坐标）
                const params = this._getWorldMapDisplayParams();
                if (params) {
                    for (const [mapId, region] of Object.entries(params.cardRegions)) {
                        if (click.x >= region.x && click.x <= region.x + region.w &&
                            click.y >= region.y && click.y <= region.y + region.h) {
                            const tp = this._getTeleportPoints().find(p => p.id === mapId);
                            const canTeleport = tp && (tp.badgeId === null || g.creaturesManager.hasBadge(tp.badgeId));
                            if (canTeleport && mapId !== g.mapManager.currentMapId) {
                                this._teleportToMap(tp);
                            }
                            return;
                        }
                    }
                }
                // 点击空白区域关闭
                this.closeMap();
            }
        }
    }

    render() {
        const ctx = this.game.ctx;
        const W = this.game.W, H = this.game.H;
        const g = this.game;
        const currentMapId = g.mapManager.currentMapId;
        const teleportPoints = this._getTeleportPoints();

        // 全屏遮罩
        ctx.fillStyle = 'rgba(8,10,18,0.95)';
        ctx.fillRect(0, 0, W, H);

        // 标题栏背景（更宽）
        ctx.fillStyle = 'rgba(255,215,0,0.06)';
        ctx.fillRect(0, 0, W, 62);

        // 标题
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 26px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('世界地图', W / 2, 28);

        // 当前位置提示
        const currentMap = g.mapManager.getCurrentMap();
        ctx.font = '14px monospace';
        ctx.fillStyle = '#999';
        ctx.fillText(`当前位置: ${currentMap ? currentMap.name : '未知'}  |  击败道馆馆主解锁传送`, W / 2, 50);

        // 返回按钮
        const backBtnW = 70, backBtnH = 28;
        const backBtnX = W - backBtnW - 15, backBtnY = 18;
        ctx.fillStyle = 'rgba(255, 215, 0, 0.12)';
        this._roundRect(ctx, backBtnX, backBtnY, backBtnW, backBtnH, 5);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,215,0,0.5)';
        ctx.lineWidth = 1.5;
        this._roundRect(ctx, backBtnX, backBtnY, backBtnW, backBtnH, 5);
        ctx.stroke();
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 14px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('← 返回', backBtnX + backBtnW / 2, backBtnY + 19);

        // ===== V6 直绘：获取布局 =====
        const params = this._getWorldMapDisplayParams();
        if (!params) return;

        const now = performance.now();

        // ---- 1) 背景区域 ----
        ctx.fillStyle = '#0c0e18';
        this._roundRect(ctx, params.areaX, params.areaY, params.areaW, params.areaH, 10);
        ctx.fill();

        // 网格线
        ctx.strokeStyle = 'rgba(255,255,255,0.03)';
        ctx.lineWidth = 1;
        for (let x = params.areaX; x <= params.areaX + params.areaW; x += 30) { ctx.beginPath(); ctx.moveTo(x, params.areaY); ctx.lineTo(x, params.areaY + params.areaH); ctx.stroke(); }
        for (let y = params.areaY; y <= params.areaY + params.areaH; y += 30) { ctx.beginPath(); ctx.moveTo(params.areaX, y); ctx.lineTo(params.areaX + params.areaW, y); ctx.stroke(); }

        // ---- 2) 连接线（直接以屏幕坐标绘制）----
        ctx.lineWidth = 3; ctx.setLineDash([10, 6]);
        for (const conn of params.connLines) {
            const rf = conn.rFrom, rt = conn.rTo;
            const fx = rf.x + rf.w/2, fy = rf.y+rf.h/2, tx=rt.x+rt.w/2, ty=rt.y+rt.h/2;
            const dx=tx-fx, dy=ty-fy; if(Math.abs(dx)<1&&Math.abs(dy)<1) continue;
            const sfx=Math.abs(dx)>0.1?rf.w/2/Math.abs(dx):9999, sfy=Math.abs(dy)>0.1?rf.h/2/Math.abs(dy):9999, sf=Math.min(sfx,sfy);
            const sx=fx+dx*sf, sy=fy+dy*sf, ex=tx-dx*sf, ey=ty-dy*sf;
            const grad=ctx.createLinearGradient(sx,sy,ex,ey);
            grad.addColorStop(0,'rgba(100,180,255,0.7)');grad.addColorStop(0.5,'rgba(80,150,220,0.4)');grad.addColorStop(1,'rgba(100,180,255,0.7)');
            ctx.strokeStyle=grad; ctx.beginPath();ctx.moveTo(sx,sy);ctx.lineTo(ex,ey);ctx.stroke();
            const mx=(sx+ex)/2,my=(sy+ey)/2; ctx.setLineDash([]);
            ctx.fillStyle='rgba(120,170,240,0.65)';ctx.save();ctx.translate(mx,my);ctx.rotate(Math.atan2(dy,dx));
            ctx.beginPath();ctx.moveTo(8,0);ctx.lineTo(-4,-5);ctx.lineTo(-4,5);ctx.closePath();ctx.fill();ctx.restore();
            ctx.setLineDash([10,6]);
        }
        ctx.setLineDash([]);

        // ---- 3) 绘制每张卡片（V6 直绘：最终尺寸，文字清晰）----
        for (const mapId of params.layout.mapIds) {
            const reg = params.cardRegions[mapId]; if(!reg)continue;
            const map=g.mapManager.maps[mapId]; if(!map)continue;
            const x=reg.x,y=reg.y,cw=reg.w,ch=reg.h;
            const typeConf=this._getMapTypeConfig(map.type);

            // 阴影
            ctx.fillStyle='rgba(0,0,0,0.35)';
            this._roundRect(ctx,x+3,y+3,cw,ch,10);ctx.fill();
            // 卡片主体
            ctx.fillStyle='rgba(16,20,36,0.95)';
            this._roundRect(ctx,x,y,cw,ch,10);ctx.fill();
            // 边框
            ctx.strokeStyle=typeConf.border;ctx.lineWidth=2;
            this._roundRect(ctx,x,y,cw,ch,10);ctx.stroke();
            // 色条
            ctx.fillStyle=typeConf.color;
            this._roundRect(ctx,x+1,y+1,cw-2,6*params.scale,4);ctx.fill();
            // 类型标签
            const labelW=38*params.scale,labelH=18*params.scale,labelFont=Math.max(11,Math.round(12*params.scale));
            ctx.fillStyle=typeConf.bg;
            this._roundRect(ctx,x+8*params.scale,y+12*params.scale,labelW,labelH,4);ctx.fill();
            ctx.fillStyle=typeConf.color;ctx.font=`bold ${labelFont}px monospace`;ctx.textAlign='center';
            ctx.fillText(typeConf.label,x+8*params.scale+labelW/2,y+12*params.scale+labelH*0.68);
            // 地图名称（核心！直接用屏幕像素大小绘制）
            const nameFont=Math.max(15,Math.round(17*params.scale));
            ctx.fillStyle='#E8E8E8';ctx.font=`bold ${nameFont}px monospace`;ctx.textAlign='center';
            ctx.fillText(map.name,x+cw/2,y+ch/2+nameFont*0.38);
            // 底部装饰线
            ctx.strokeStyle=typeConf.border;ctx.globalAlpha=0.25;ctx.lineWidth=1;
            ctx.beginPath();ctx.moveTo(x+15*params.scale,y+ch-10*params.scale);ctx.lineTo(x+cw-15*params.scale,y+ch-10*params.scale);ctx.stroke();
            ctx.globalAlpha=1;
        }
        ctx.textAlign='left';

        // ---- 4) 当前位置高亮（使用 cardRegions 最终坐标）----
        const region=params.cardRegions[currentMapId];
        if(region){
            const rx=region.x,ry=region.y,rw=region.w,rh=region.h;
            const pulse1=0.25+0.2*Math.sin(now/300),pulse2=0.3+0.35*Math.sin(now/450),glowSize=6+3*Math.sin(now/400);
            ctx.strokeStyle=`rgba(76,175,80,${(pulse2*0.4).toFixed(2)})`;ctx.lineWidth=3;
            this._roundRect(ctx,rx-8-glowSize,ry-8-glowSize,rw+16+glowSize*2,rh+16+glowSize*2,14);ctx.stroke();
            ctx.strokeStyle=`rgba(76,175,80,${pulse2.toFixed(2)})`;ctx.lineWidth=2.5;
            this._roundRect(ctx,rx-6,ry-6,rw+12,rh+12,12);ctx.stroke();
            ctx.fillStyle=`rgba(76,175,80,${pulse1.toFixed(2)})`;
            this._roundRect(ctx,rx-3,ry-3,rw+6,rh+6,10);ctx.fill();
            ctx.strokeStyle='#4CAF50';ctx.lineWidth=3;
            this._roundRect(ctx,rx-2,ry-2,rw+4,rh+4,9);ctx.stroke();
            // 四角角标
            const cL=12,cO=4;ctx.strokeStyle='#69F0AE';ctx.lineWidth=2.5;
            [[rx-cO,ry-cO,1,1],[rx+rw+cO,ry-cO,-1,1],[rx-cO,ry+rh+cO,1,-1],[rx+rw+cO,ry+rh+cO,-1,-1]].forEach(([cx,cy,dx,dy])=>{
                ctx.beginPath();ctx.moveTo(cx,cy+dy*cL);ctx.lineTo(cx,cy);ctx.lineTo(cx+dx*cL,cy);ctx.stroke();
            });
            // 标签
            const tagText='📍 当前位置',tagFont=Math.max(13,Math.round(14*params.scale));
            ctx.font=`bold ${tagFont}px monospace`;const tagW=ctx.measureText(tagText).width+20,tagX=rx+rw/2,tagY=ry-20;
            ctx.fillStyle='rgba(76,175,80,0.92)';this._roundRect(ctx,tagX-tagW/2,tagY-14,tagW,24,6);ctx.fill();
            ctx.strokeStyle='#69F0AE';ctx.lineWidth=1.5;this._roundRect(ctx,tagX-tagW/2,tagY-14,tagW,24,6);ctx.stroke();
            ctx.fillStyle='#FFF';ctx.font=`bold ${tagFont}px monospace`;ctx.textAlign='center';ctx.fillText(tagText,tagX,tagY+4);
            ctx.fillStyle='#4CAF50';ctx.beginPath();ctx.moveTo(tagX,tagY+10);ctx.lineTo(tagX-6,tagY+16);ctx.lineTo(tagX+6,tagY+16);ctx.closePath();ctx.fill();
        }

        // ---- 5) 状态标签（当前地图始终显示）----
        for(const [mapId,reg] of Object.entries(params.cardRegions)){
            const map=g.mapManager.maps[mapId];if(!map)continue;
            const isCurrent=mapId===currentMapId;

            // 当前位置：无条件显示
            if(isCurrent){
                const statusText='当前位置',statusColor='#4CAF50';
                const statusFont=Math.max(11,Math.round(13*params.scale));
                ctx.font=`bold ${statusFont}px monospace`;ctx.textAlign='center';
                const stW=ctx.measureText(statusText).width+14,stX=reg.x+reg.w/2,stY=reg.y+reg.h+14*params.scale;
                ctx.fillStyle='rgba(76,175,80,0.18)';
                this._roundRect(ctx,stX-stW/2,stY-10*params.scale,stW,18*params.scale,4);ctx.fill();
                ctx.fillStyle=statusColor;ctx.fillText(statusText,stX,stY+3*params.scale);
                continue;
            }

            // 非当前地图：仅在传送点列表中才显示
            const tp=teleportPoints.find(p=>p.id===mapId);if(!tp)continue;
            const hasBadge=tp.badgeId===null||g.creaturesManager.hasBadge(tp.badgeId);
            const statusText=hasBadge?'可传送':`${tp.leaderName}（锁定）`;
            const statusColor=hasBadge?'#FFD700':'#F44336';
            const statusFont=Math.max(11,Math.round(13*params.scale));
            ctx.font=`bold ${statusFont}px monospace`;ctx.textAlign='center';
            const stW=ctx.measureText(statusText).width+14,stX=reg.x+reg.w/2,stY=reg.y+reg.h+14*params.scale;
            ctx.fillStyle=hasBadge?'rgba(255,215,0,0.15)':'rgba(244,67,54,0.15)';
            this._roundRect(ctx,stX-stW/2,stY-10*params.scale,stW,18*params.scale,4);ctx.fill();
            ctx.fillStyle=statusColor;ctx.fillText(statusText,stX,stY+3*params.scale);
        }

        // 图例
        ctx.textAlign = 'left';
        const legendY = H - 35;
        const legends = [
            { label: '城镇', color: '#FFD700' },
            { label: '道路', color: '#81C784' },
            { label: '副本', color: '#E57373' },
            { label: '秘境', color: '#CE93D8' }
        ];
        let legendX = 20;
        ctx.font = '12px monospace';
        for (const leg of legends) {
            ctx.fillStyle = leg.color;
            ctx.fillRect(legendX, legendY - 5, 8, 8);
            ctx.fillStyle = '#888';
            ctx.fillText(leg.label, legendX + 11, legendY + 3);
            legendX += ctx.measureText(leg.label).width + 22;
        }

        // 底部提示
        ctx.textAlign = 'center';
        ctx.fillStyle = '#555';
        ctx.font = '13px monospace';
        ctx.fillText('点击可传送的城镇传送  ESC关闭', W / 2, H - 12);
        ctx.textAlign = 'left';
    }

    /** 传送到指定地图的 playerStart 位置 */
    _teleportToMap(teleportPoint) {
        const g = this.game;
        const targetId = teleportPoint.id;

        if (!g.mapManager.maps[targetId]) {
            g.ui.showMessage('该地图尚未开放！');
            this.closeMap();
            return;
        }

        const switched = g.mapManager.switchMap(targetId);
        if (!switched) {
            g.ui.showMessage('传送失败，地图不存在！');
            this.closeMap();
            return;
        }
        const newMap = g.mapManager.getCurrentMap();
        if (newMap.playerStart) {
            g.player.setPosition(newMap.playerStart.x, newMap.playerStart.y);
        } else {
            g.player.setPosition(1, 1);
        }
        g.npcManager.loadNPCs(newMap.npcs);
        g.camera.snapTo(g.player.x, g.player.y, g.player.width, g.player.height, newMap.width * g.mapManager.tileSize, newMap.height * g.mapManager.tileSize);

        this.closeMap();
        g.ui.showMessage(`传送到了${newMap.name}`);
        try { g.saveManager.save(g, 0); } catch (e) { console.error('传送后保存失败:', e); }
    }
}

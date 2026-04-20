/**
 * Player - 玩家角色
 * 处理移动、碰撞检测、草丛遭遇判定、动画
 */
class Player {
    constructor(mapManager) {
        this.mapManager = mapManager;
        this.tileSize = mapManager.tileSize;
        // 网格位置（瓦片坐标）
        this.tileX = 10;
        this.tileY = 9;
        // 像素位置（用于平滑移动）
        this.x = this.tileX * this.tileSize;
        this.y = this.tileY * this.tileSize;
        // 目标位置
        this.targetX = this.x;
        this.targetY = this.y;
        // 移动速度
        this.speed = 4;
        // 是否正在移动
        this.moving = false;
        // 朝向：down, up, left, right
        this.direction = 'down';
        // 动画帧
        this.animFrame = 0;
        this.animTimer = 0;
        this.animInterval = 150; // 毫秒
        // 玩家尺寸
        this.width = this.tileSize;
        this.height = this.tileSize;
        // NPC碰撞检测回调
        this.onWildEncounter = null;
        // NPC碰撞检查回调
        this.checkNPCCollision = null;
    }

    /** 设置玩家位置（切换地图时使用） */
    setPosition(tileX, tileY) {
        this.tileX = tileX;
        this.tileY = tileY;
        this.x = tileX * this.tileSize;
        this.y = tileY * this.tileSize;
        this.targetX = this.x;
        this.targetY = this.y;
        this.moving = false;
    }

    /** 更新玩家状态 */
    update(deltaTime, direction) {
        // 更新动画
        this.animTimer += deltaTime;
        if (this.animTimer >= this.animInterval) {
            this.animTimer -= this.animInterval;
            this.animFrame = (this.animFrame + 1) % 4;
        }

        // 如果正在移动，继续移动到目标位置
        if (this.moving) {
            this._moveTowardsTarget();
            return null; // 移动中不接受新输入
        }

        // 处理方向输入
        if (direction) {
            this.direction = direction;
            const dx = direction === 'left' ? -1 : direction === 'right' ? 1 : 0;
            const dy = direction === 'up' ? -1 : direction === 'down' ? 1 : 0;
            const newTileX = this.tileX + dx;
            const newTileY = this.tileY + dy;

            // 碰撞检测
            const collision = this.mapManager.getCollision(newTileX, newTileY);
            if (collision === 1) {
                return null; // 不可通行
            }

            // NPC碰撞检测
            if (this.checkNPCCollision && this.checkNPCCollision(newTileX, newTileY)) {
                return null; // NPC阻挡
            }

            // 开始移动
            this.tileX = newTileX;
            this.tileY = newTileY;
            this.targetX = newTileX * this.tileSize;
            this.targetY = newTileY * this.tileSize;
            this.moving = true;

            // 草丛遭遇判定
            if (collision === 2) {
                // 10%概率遭遇
                if (Math.random() < 0.10) {
                    return 'wild_encounter';
                }
            }

            // 传送点检测
            if (collision === 3) {
                return 'transfer';
            }
        }

        return null;
    }

    /** 向目标位置移动 */
    _moveTowardsTarget() {
        const dx = this.targetX - this.x;
        const dy = this.targetY - this.y;

        if (Math.abs(dx) <= this.speed && Math.abs(dy) <= this.speed) {
            this.x = this.targetX;
            this.y = this.targetY;
            this.moving = false;
        } else {
            if (dx !== 0) this.x += Math.sign(dx) * this.speed;
            if (dy !== 0) this.y += Math.sign(dy) * this.speed;
        }
    }

    /** 渲染玩家角色（中国风侠客造型） */
    render(ctx) {
        const px = this.x;
        const py = this.y;
        const ts = this.tileSize;

        // ===== 广袖（在身体后面绘制）=====
        const sleeveSwing = this.moving ? (this.animFrame % 2 === 0 ? 1 : -1) : 0;
        ctx.fillStyle = '#3d5c3a'; // 袖子暗色
        ctx.fillRect(px + 4 + sleeveSwing, py + 14, 4, 10);  // 左袖
        ctx.fillRect(px + 24 - sleeveSwing, py + 14, 4, 10); // 右袖
        ctx.fillStyle = '#4a6741'; // 袖子主色
        ctx.fillRect(px + 5 + sleeveSwing, py + 15, 3, 8);
        ctx.fillRect(px + 24 - sleeveSwing, py + 15, 3, 8);

        // ===== 身体（交领右衽中式上衣）=====
        ctx.fillStyle = '#000';
        ctx.fillRect(px + 7, py + 13, 18, 16); // 身体轮廓
        ctx.fillStyle = '#4a6741'; // 青绿色上衣
        ctx.fillRect(px + 8, py + 14, 16, 14);

        // 交领（V字领口）
        ctx.fillStyle = '#8B0000'; // 暗红内衬
        ctx.fillRect(px + 12, py + 14, 2, 6);  // 左领线
        ctx.fillRect(px + 18, py + 14, 2, 6);  // 右领线
        ctx.fillRect(px + 13, py + 14, 6, 2);  // 领口横线
        ctx.fillRect(px + 14, py + 16, 4, 3);  // 领口内露

        // 腰带
        ctx.fillStyle = '#3d2b1f';
        ctx.fillRect(px + 8, py + 24, 16, 2);
        // 玉佩
        ctx.fillStyle = '#7FFFD4';
        ctx.fillRect(px + 15, py + 24, 2, 2);

        // 衣服下摆（略宽）
        ctx.fillStyle = '#3d5c3a';
        ctx.fillRect(px + 8, py + 26, 16, 2);

        // ===== 腿部 =====
        ctx.fillStyle = '#2c2c2c';
        if (this.moving) {
            const legOffset = this.animFrame % 2 === 0 ? 2 : -2;
            ctx.fillRect(px + 10 + legOffset, py + 27, 5, 3);
            ctx.fillRect(px + 17 - legOffset, py + 27, 5, 3);
            // 布鞋
            ctx.fillStyle = '#3d2b1f';
            ctx.fillRect(px + 9 + legOffset, py + 29, 6, 2);
            ctx.fillRect(px + 17 - legOffset, py + 29, 6, 2);
        } else {
            ctx.fillRect(px + 10, py + 27, 5, 3);
            ctx.fillRect(px + 17, py + 27, 5, 3);
            // 布鞋
            ctx.fillStyle = '#3d2b1f';
            ctx.fillRect(px + 9, py + 29, 6, 2);
            ctx.fillRect(px + 17, py + 29, 6, 2);
        }

        // ===== 头部 =====
        // 头发轮廓
        ctx.fillStyle = '#000';
        ctx.fillRect(px + 9, py + 1, 14, 14);
        // 脸
        ctx.fillStyle = '#FFE0BD';
        ctx.fillRect(px + 10, py + 2, 12, 12);

        // 头发（黑色，覆盖头顶和两侧）
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(px + 8, py, 16, 5);  // 头顶
        ctx.fillRect(px + 8, py + 5, 2, 4);  // 左鬓角
        ctx.fillRect(px + 22, py + 5, 2, 4); // 右鬓角（px+22=8+14, 但头宽14所以22=8+14不对，应该是px+20）
        // 修正右鬓角
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(px + 20, py + 5, 2, 3); // 右鬓角

        // 发髻（头顶圆形发髻）
        ctx.fillStyle = '#000';
        ctx.fillRect(px + 12, py - 3, 8, 5); // 发髻轮廓
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(px + 13, py - 2, 6, 4); // 发髻主体
        // 发带（金色）
        ctx.fillStyle = '#FFD700';
        ctx.fillRect(px + 11, py + 1, 10, 1); // 发带

        // ===== 面部（根据朝向）=====
        if (this.direction === 'down') {
            // 眼睛（东方细长眼）
            ctx.fillStyle = '#fff';
            ctx.fillRect(px + 11, py + 7, 3, 2); // 左眼白
            ctx.fillRect(px + 18, py + 7, 3, 2); // 右眼白
            ctx.fillStyle = '#3d2b1f';
            ctx.fillRect(px + 12, py + 7, 2, 2); // 左瞳孔
            ctx.fillRect(px + 19, py + 7, 2, 2); // 右瞳孔
            // 腮红
            ctx.fillStyle = '#FFB6C1';
            ctx.fillRect(px + 10, py + 10, 2, 1);
            ctx.fillRect(px + 20, py + 10, 2, 1);
            // 嘴巴
            ctx.fillStyle = '#c0392b';
            ctx.fillRect(px + 15, py + 11, 2, 1);
        } else if (this.direction === 'up') {
            // 背面：后脑勺头发
            ctx.fillStyle = '#1a1a2e';
            ctx.fillRect(px + 10, py + 2, 12, 8);
            // 发髻背面
            ctx.fillStyle = '#000';
            ctx.fillRect(px + 13, py - 2, 6, 3);
            ctx.fillStyle = '#1a1a2e';
            ctx.fillRect(px + 14, py - 1, 4, 2);
            // 发带背面
            ctx.fillStyle = '#FFD700';
            ctx.fillRect(px + 11, py + 1, 10, 1);
        } else if (this.direction === 'left') {
            // 左面：单眼
            ctx.fillStyle = '#fff';
            ctx.fillRect(px + 10, py + 7, 3, 2);
            ctx.fillStyle = '#3d2b1f';
            ctx.fillRect(px + 10, py + 7, 2, 2);
            // 腮红
            ctx.fillStyle = '#FFB6C1';
            ctx.fillRect(px + 9, py + 10, 2, 1);
            // 嘴巴
            ctx.fillStyle = '#c0392b';
            ctx.fillRect(px + 12, py + 11, 2, 1);
            // 侧面发髻
            ctx.fillStyle = '#000';
            ctx.fillRect(px + 14, py - 2, 5, 3);
            ctx.fillStyle = '#1a1a2e';
            ctx.fillRect(px + 14, py - 1, 4, 2);
        } else if (this.direction === 'right') {
            // 右面：单眼
            ctx.fillStyle = '#fff';
            ctx.fillRect(px + 19, py + 7, 3, 2);
            ctx.fillStyle = '#3d2b1f';
            ctx.fillRect(px + 20, py + 7, 2, 2);
            // 腮红
            ctx.fillStyle = '#FFB6C1';
            ctx.fillRect(px + 21, py + 10, 2, 1);
            // 嘴巴
            ctx.fillRect(px + 18, py + 11, 2, 1);
            ctx.fillStyle = '#c0392b';
            ctx.fillRect(px + 18, py + 11, 2, 1);
            // 侧面发髻
            ctx.fillStyle = '#000';
            ctx.fillRect(px + 13, py - 2, 5, 3);
            ctx.fillStyle = '#1a1a2e';
            ctx.fillRect(px + 14, py - 1, 4, 2);
        }
    }

    /** 获取玩家面前一格的位置 */
    getFacingTile() {
        const dx = this.direction === 'left' ? -1 : this.direction === 'right' ? 1 : 0;
        const dy = this.direction === 'up' ? -1 : this.direction === 'down' ? 1 : 0;
        return {
            x: this.tileX + dx,
            y: this.tileY + dy
        };
    }

    /** 尝试向指定方向移动（供点击移动使用） */
    tryMove(direction, mapManager, npcManager) {
        if (this.moving) return null;

        this.direction = direction;
        const dx = direction === 'left' ? -1 : direction === 'right' ? 1 : 0;
        const dy = direction === 'up' ? -1 : direction === 'down' ? 1 : 0;
        const newTileX = this.tileX + dx;
        const newTileY = this.tileY + dy;

        // 碰撞检测
        const collision = mapManager.getCollision(newTileX, newTileY);
        if (collision === 1) {
            return null; // 不可通行
        }

        // NPC碰撞检测
        if (npcManager && npcManager.getNPCAt(newTileX, newTileY)) {
            return null; // NPC阻挡
        }

        // 开始移动
        this.tileX = newTileX;
        this.tileY = newTileY;
        this.targetX = newTileX * this.tileSize;
        this.targetY = newTileY * this.tileSize;
        this.moving = true;

        // 草丛遭遇判定
        if (collision === 2) {
            if (Math.random() < 0.10) {
                return 'wild_encounter';
            }
        }

        // 传送点检测
        if (collision === 3) {
            return 'transfer';
        }

        return null;
    }
}

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

    /** 渲染玩家角色 */
    render(ctx) {
        const px = this.x;
        const py = this.y;
        const ts = this.tileSize;

        // 黑色轮廓线 - 身体
        ctx.fillStyle = '#000';
        ctx.fillRect(px + 7, py + 13, 18, 16);

        // 身体（红色衣服）
        ctx.fillStyle = '#e74c3c';
        ctx.fillRect(px + 8, py + 14, 16, 14);

        // 衣服细节 - 领口
        ctx.fillStyle = '#c0392b';
        ctx.fillRect(px + 12, py + 14, 8, 2);
        // 腰带
        ctx.fillStyle = '#2c3e50';
        ctx.fillRect(px + 8, py + 24, 16, 2);
        // 腰带扣
        ctx.fillStyle = '#FFD700';
        ctx.fillRect(px + 14, py + 24, 4, 2);

        // 黑色轮廓线 - 头
        ctx.fillStyle = '#000';
        ctx.fillRect(px + 9, py + 1, 14, 15);

        // 头
        ctx.fillStyle = '#FFDAB9';
        ctx.fillRect(px + 10, py + 2, 12, 13);

        // 黑色轮廓线 - 头发
        ctx.fillStyle = '#000';
        ctx.fillRect(px + 7, py - 1, 18, 8);

        // 头发
        ctx.fillStyle = '#2c3e50';
        ctx.fillRect(px + 8, py, 16, 6);
        // 发型高光线条
        ctx.fillStyle = '#3d566e';
        ctx.fillRect(px + 10, py + 1, 4, 2);
        ctx.fillRect(px + 18, py + 2, 3, 1);

        // 眼睛（根据朝向）- 更清晰的眼白和瞳孔
        if (this.direction === 'down') {
            // 眼白
            ctx.fillStyle = '#fff';
            ctx.fillRect(px + 11, py + 7, 4, 4);
            ctx.fillRect(px + 17, py + 7, 4, 4);
            // 瞳孔
            ctx.fillStyle = '#000';
            ctx.fillRect(px + 12, py + 8, 2, 3);
            ctx.fillRect(px + 18, py + 8, 2, 3);
            // 瞳孔高光
            ctx.fillStyle = '#fff';
            ctx.fillRect(px + 12, py + 8, 1, 1);
            ctx.fillRect(px + 18, py + 8, 1, 1);
        } else if (this.direction === 'up') {
            // 背面不画眼睛，显示后脑勺头发
            ctx.fillStyle = '#2c3e50';
            ctx.fillRect(px + 10, py + 2, 12, 6);
        } else if (this.direction === 'left') {
            ctx.fillStyle = '#fff';
            ctx.fillRect(px + 10, py + 7, 4, 4);
            ctx.fillStyle = '#000';
            ctx.fillRect(px + 10, py + 8, 2, 3);
            ctx.fillStyle = '#fff';
            ctx.fillRect(px + 10, py + 8, 1, 1);
        } else if (this.direction === 'right') {
            ctx.fillStyle = '#fff';
            ctx.fillRect(px + 18, py + 7, 4, 4);
            ctx.fillStyle = '#000';
            ctx.fillRect(px + 20, py + 8, 2, 3);
            ctx.fillStyle = '#fff';
            ctx.fillRect(px + 20, py + 8, 1, 1);
        }

        // 腿（行走动画）- 带鞋子细节
        ctx.fillStyle = '#2c3e50';
        if (this.moving) {
            const legOffset = this.animFrame % 2 === 0 ? 2 : -2;
            ctx.fillRect(px + 10 + legOffset, py + 26, 5, 4);
            ctx.fillRect(px + 17 - legOffset, py + 26, 5, 4);
            // 鞋子
            ctx.fillStyle = '#8B4513';
            ctx.fillRect(px + 9 + legOffset, py + 29, 6, 3);
            ctx.fillRect(px + 17 - legOffset, py + 29, 6, 3);
        } else {
            ctx.fillRect(px + 10, py + 26, 5, 4);
            ctx.fillRect(px + 17, py + 26, 5, 4);
            // 鞋子
            ctx.fillStyle = '#8B4513';
            ctx.fillRect(px + 9, py + 29, 6, 3);
            ctx.fillRect(px + 17, py + 29, 6, 3);
        }

        // 帽子 - 带帽檐阴影
        ctx.fillStyle = '#000';
        ctx.fillRect(px + 5, py - 3, 22, 5);
        ctx.fillStyle = '#e74c3c';
        ctx.fillRect(px + 6, py - 2, 20, 4);
        // 帽檐阴影
        ctx.fillStyle = '#c0392b';
        ctx.fillRect(px + 6, py + 1, 20, 1);
        // 帽子高光
        ctx.fillStyle = '#ff6b6b';
        ctx.fillRect(px + 8, py - 1, 6, 2);
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

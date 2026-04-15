/**
 * Camera - 跟随玩家的摄像机
 * 处理视口偏移和地图边界限制
 */
class Camera {
    constructor(canvasWidth, canvasHeight) {
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
        // 摄像机位置（左上角坐标）
        this.x = 0;
        this.y = 0;
        // 平滑跟随参数
        this.smoothing = 0.1;
        // 目标位置
        this.targetX = 0;
        this.targetY = 0;
    }

    /** 设置摄像机跟随目标 */
    follow(targetX, targetY, targetWidth, targetHeight, mapWidth, mapHeight) {
        // 目标位置：让目标居中
        this.targetX = targetX + targetWidth / 2 - this.canvasWidth / 2;
        this.targetY = targetY + targetHeight / 2 - this.canvasHeight / 2;

        // 地图边界限制
        this.targetX = Math.max(0, Math.min(this.targetX, mapWidth - this.canvasWidth));
        this.targetY = Math.max(0, Math.min(this.targetY, mapHeight - this.canvasHeight));

        // 如果地图比画布小，居中显示
        if (mapWidth < this.canvasWidth) {
            this.targetX = -(this.canvasWidth - mapWidth) / 2;
        }
        if (mapHeight < this.canvasHeight) {
            this.targetY = -(this.canvasHeight - mapHeight) / 2;
        }

        // 平滑移动
        this.x += (this.targetX - this.x) * this.smoothing;
        this.y += (this.targetY - this.y) * this.smoothing;

        // 取整避免像素模糊
        this.x = Math.round(this.x);
        this.y = Math.round(this.y);
    }

    /** 立即跳转到目标位置（无平滑） */
    snapTo(targetX, targetY, targetWidth, targetHeight, mapWidth, mapHeight) {
        this.targetX = targetX + targetWidth / 2 - this.canvasWidth / 2;
        this.targetY = targetY + targetHeight / 2 - this.canvasHeight / 2;

        this.targetX = Math.max(0, Math.min(this.targetX, mapWidth - this.canvasWidth));
        this.targetY = Math.max(0, Math.min(this.targetY, mapHeight - this.canvasHeight));

        if (mapWidth < this.canvasWidth) {
            this.targetX = -(this.canvasWidth - mapWidth) / 2;
        }
        if (mapHeight < this.canvasHeight) {
            this.targetY = -(this.canvasHeight - mapHeight) / 2;
        }

        this.x = Math.round(this.targetX);
        this.y = Math.round(this.targetY);
    }

    /** 应用摄像机变换到上下文 */
    applyTransform(ctx) {
        ctx.save();
        ctx.translate(-this.x, -this.y);
    }

    /** 恢复上下文变换 */
    restoreTransform(ctx) {
        ctx.restore();
    }
}

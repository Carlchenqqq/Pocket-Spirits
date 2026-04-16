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
        // 自动缩放（1.0 = 原始大小，>1 放大）
        this.zoom = 1.0;
    }

    /**
     * 设置自动缩放：让地图铺满画布（保持比例，类似星露谷物语）
     * @param {number} mapWidth - 地图实际像素宽度
     * @param {number} mapHeight - 地图实际像素高度
     */
    setAutoZoom(mapWidth, mapHeight) {
        if (!mapWidth || !mapHeight) { this.zoom = 1; return; }
        const scaleX = this.canvasWidth / mapWidth;
        const scaleY = this.canvasHeight / mapHeight;
        // 取较小值确保整个地图都能显示在画布内
        this.zoom = Math.min(scaleX, scaleY);
        // 限制缩放上限（避免过度放大导致画面太粗糙）
        if (this.zoom > 4) this.zoom = 4;
    }

    /** 设置摄像机跟随目标 */
    follow(targetX, targetY, targetWidth, targetHeight, mapWidth, mapHeight) {
        // 有效视口大小（考虑缩放）
        const viewW = this.canvasWidth / this.zoom;
        const viewH = this.canvasHeight / this.zoom;
        // 目标位置：让目标居中
        this.targetX = targetX + targetWidth / 2 - viewW / 2;
        this.targetY = targetY + targetHeight / 2 - viewH / 2;

        // 地图边界限制
        this.targetX = Math.max(0, Math.min(this.targetX, mapWidth - viewW));
        this.targetY = Math.max(0, Math.min(this.targetY, mapHeight - viewH));

        // 如果地图比视口小，居中显示
        if (mapWidth < viewW) {
            this.targetX = -(viewW - mapWidth) / 2;
        }
        if (mapHeight < viewH) {
            this.targetY = -(viewH - mapHeight) / 2;
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
        const viewW = this.canvasWidth / this.zoom;
        const viewH = this.canvasHeight / this.zoom;
        this.targetX = targetX + targetWidth / 2 - viewW / 2;
        this.targetY = targetY + targetHeight / 2 - viewH / 2;

        this.targetX = Math.max(0, Math.min(this.targetX, mapWidth - viewW));
        this.targetY = Math.max(0, Math.min(this.targetY, mapHeight - viewH));

        if (mapWidth < viewW) {
            this.targetX = -(viewW - mapWidth) / 2;
        }
        if (mapHeight < viewH) {
            this.targetY = -(viewH - mapHeight) / 2;
        }

        this.x = Math.round(this.targetX);
        this.y = Math.round(this.targetY);
    }

    /** 应用摄像机变换到上下文（含缩放） */
    applyTransform(ctx) {
        ctx.save();
        // 先缩放，再平移（世界坐标 → 屏幕坐标）
        ctx.scale(this.zoom, this.zoom);
        ctx.translate(-this.x, -this.y);
    }

    /** 恢复上下文变换 */
    restoreTransform(ctx) {
        ctx.restore();
    }
}

/**
 * config.js - 游戏全局常量配置
 */
const CONFIG = {
    // 画布尺寸（与CSS显示1:1匹配，原生像素渲染）
    CANVAS_W: 960,
    CANVAS_H: 720,
    // 瓦片大小
    TILE_SIZE: 32,
    // 移动冷却（毫秒）
    MOVE_COOLDOWN: 150,
    // 动作冷却（毫秒）
    ACTION_COOLDOWN: 200,
    // 摄像机平滑系数
    CAMERA_SMOOTHING: 0.1,
    // 最大队伍数量
    MAX_PARTY: 6,
    // 对话打字速度（毫秒/字）
    DIALOG_SPEED: 30,
    // 消息显示时长（毫秒）
    MESSAGE_DURATION: 2000,
    // 资源版本号（更新地图/数据时递增，防止浏览器缓存）
    ASSET_VERSION: 41,
};

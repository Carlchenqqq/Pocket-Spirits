/**
 * main.js - 游戏入口文件
 * 初始化所有模块，加载数据，启动游戏循环
 */

// 等待DOM加载完成
window.addEventListener('DOMContentLoaded', () => {
    // 创建游戏管理器
    const game = new GameManager();

    // 初始化并启动游戏
    game.init().catch(err => {
        console.error('游戏初始化失败:', err);
    });
});

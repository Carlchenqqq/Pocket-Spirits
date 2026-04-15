/**
 * SceneManager - 场景管理器
 * 管理游戏状态和场景切换
 */
class SceneManager {
    constructor(game) {
        this.game = game;
        this.scenes = new Map();
        this.currentScene = null;
        this.sceneStack = [];
        this.isTransitioning = false;
    }

    /** 注册场景 */
    register(id, scene) {
        this.scenes.set(id, scene);
    }

    /** 切换场景 */
    switchTo(id, params = {}) {
        if (this.isTransitioning) return;
        
        const newScene = this.scenes.get(id);
        if (!newScene) {
            console.error(`SceneManager: Scene "${id}" not found`);
            return;
        }

        this.isTransitioning = true;

        // 退出当前场景
        if (this.currentScene) {
            this.currentScene.onExit();
        }

        // 进入新场景
        this.currentScene = newScene;
        this.sceneStack = [id];
        newScene.onEnter(params);

        this.isTransitioning = false;
    }

    /** 压栈场景（暂停当前） */
    push(id, params = {}) {
        if (this.isTransitioning) return;
        
        const newScene = this.scenes.get(id);
        if (!newScene) {
            console.error(`SceneManager: Scene "${id}" not found`);
            return;
        }

        this.isTransitioning = true;

        // 暂停当前场景
        if (this.currentScene) {
            this.currentScene.onPause();
            this.sceneStack.push(id);
        } else {
            this.sceneStack = [id];
        }

        // 进入新场景
        this.currentScene = newScene;
        newScene.onEnter(params);

        this.isTransitioning = false;
    }

    /** 出栈场景（恢复上一个） */
    pop() {
        if (this.isTransitioning || this.sceneStack.length <= 1) return;

        this.isTransitioning = true;

        // 退出当前场景
        if (this.currentScene) {
            this.currentScene.onExit();
        }

        // 恢复上一个场景
        this.sceneStack.pop();
        const prevId = this.sceneStack[this.sceneStack.length - 1];
        this.currentScene = this.scenes.get(prevId);
        
        if (this.currentScene) {
            this.currentScene.onResume();
        }

        this.isTransitioning = false;
    }

    /** 获取当前场景ID */
    getCurrentSceneId() {
        return this.sceneStack[this.sceneStack.length - 1];
    }

    /** 更新 */
    update(deltaTime) {
        if (this.currentScene) {
            this.currentScene.update(deltaTime);
        }
    }

    /** 渲染 */
    render(ctx) {
        if (this.currentScene) {
            this.currentScene.render(ctx);
        }
    }
}

/**
 * Scene - 场景基类
 */
class Scene {
    constructor(game) {
        this.game = game;
        this.id = 'base';
    }

    /** 进入场景 */
    onEnter(params = {}) {}

    /** 退出场景 */
    onExit() {}

    /** 暂停场景 */
    onPause() {}

    /** 恢复场景 */
    onResume() {}

    /** 更新 */
    update(deltaTime) {}

    /** 渲染 */
    render(ctx) {}
}

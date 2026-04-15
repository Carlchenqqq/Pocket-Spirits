/**
 * EventBus - 全局事件总线
 * 模块间解耦通信的核心
 */
class EventBus {
    constructor() {
        this.listeners = new Map();
    }

    /** 订阅事件 */
    on(eventName, handler, context = null) {
        if (!this.listeners.has(eventName)) {
            this.listeners.set(eventName, []);
        }
        this.listeners.get(eventName).push({ handler, context });
        // 返回取消订阅函数
        return () => this.off(eventName, handler);
    }

    /** 一次性订阅 */
    once(eventName, handler, context = null) {
        const wrapper = (...args) => {
            this.off(eventName, wrapper);
            handler.apply(context, args);
        };
        return this.on(eventName, wrapper, context);
    }

    /** 取消订阅 */
    off(eventName, handler) {
        const handlers = this.listeners.get(eventName);
        if (!handlers) return;
        const index = handlers.findIndex(h => h.handler === handler);
        if (index !== -1) {
            handlers.splice(index, 1);
        }
    }

    /** 发送事件 */
    emit(eventName, ...args) {
        const handlers = this.listeners.get(eventName);
        if (!handlers) return;
        handlers.forEach(({ handler, context }) => {
            try {
                handler.apply(context, args);
            } catch (e) {
                console.error(`EventBus: Error in handler for "${eventName}"`, e);
            }
        });
    }

    /** 清除所有监听器 */
    clear() {
        this.listeners.clear();
    }
}

// 全局事件常量
const GameEvents = {
    // 战斗事件
    BATTLE_START: 'battle:start',
    BATTLE_END: 'battle:end',
    BATTLE_TURN: 'battle:turn',
    
    // 对话事件
    DIALOG_START: 'dialog:start',
    DIALOG_END: 'dialog:end',
    DIALOG_NEXT: 'dialog:next',
    
    // 地图事件
    MAP_TRANSFER: 'map:transfer',
    MAP_LOADED: 'map:loaded',
    
    // NPC事件
    NPC_INTERACT: 'npc:interact',
    NPC_DEFEATED: 'npc:defeated',
    
    // 精灵事件
    CREATURE_CAUGHT: 'creature:caught',
    CREATURE_LEVEL_UP: 'creature:levelup',
    
    // 道具事件
    ITEM_USE: 'item:use',
    ITEM_BUY: 'item:buy',
    
    // 存档事件
    SAVE_COMPLETE: 'save:complete',
    SAVE_LOAD: 'save:load',
    
    // UI事件
    UI_MENU_OPEN: 'ui:menu_open',
    UI_MENU_CLOSE: 'ui:menu_close',
    UI_MESSAGE: 'ui:message',
};

/**
 * DialogEngine - 对话引擎
 * 统一管理对话流程、选项、回调
 */
class DialogEngine {
    constructor(eventBus) {
        this.eventBus = eventBus;
        this.state = {
            active: false,
            speaker: null,
            pages: [],
            currentPage: 0,
            displayedText: '',
            charIndex: 0,
            choices: null,
            selectedChoice: 0,
            callback: null,
            speed: 30, // ms per char
            lastUpdate: 0
        };
    }

    /** 开始对话 */
    start(config) {
        this.state = {
            active: true,
            speaker: config.speaker || null,
            pages: Array.isArray(config.text) ? config.text : [config.text],
            currentPage: 0,
            displayedText: '',
            charIndex: 0,
            choices: config.choices || null,
            selectedChoice: 0,
            callback: config.callback || null,
            speed: config.speed || 30,
            lastUpdate: performance.now()
        };
        this.eventBus.emit(GameEvents.DIALOG_START, this.state);
        return this.state;
    }

    /** 更新打字机效果 */
    update(timestamp) {
        if (!this.state.active) return;
        if (this.state.charIndex >= this._getCurrentPage().length) return;
        
        if (timestamp - this.state.lastUpdate >= this.state.speed) {
            this.state.charIndex++;
            this.state.displayedText = this._getCurrentPage().substring(0, this.state.charIndex);
            this.state.lastUpdate = timestamp;
        }
    }

    /** 获取当前页文本 */
    _getCurrentPage() {
        return this.state.pages[this.state.currentPage] || '';
    }

    /** 是否当前页显示完毕 */
    isPageComplete() {
        return this.state.charIndex >= this._getCurrentPage().length;
    }

    /** 是否有更多页 */
    hasMorePages() {
        return this.state.currentPage < this.state.pages.length - 1;
    }

    /** 是否有选项 */
    hasChoices() {
        return this.state.choices !== null && this.isPageComplete() && !this.hasMorePages();
    }

    /** 下一页/完成 */
    next() {
        if (!this.state.active) return;
        
        // 如果打字未完成，立即显示全部
        if (!this.isPageComplete()) {
            this.state.charIndex = this._getCurrentPage().length;
            this.state.displayedText = this._getCurrentPage();
            return 'typing';
        }
        
        // 如果有选项，不自动继续
        if (this.hasChoices()) {
            return 'choices';
        }
        
        // 还有更多页
        if (this.hasMorePages()) {
            this.state.currentPage++;
            this.state.charIndex = 0;
            this.state.displayedText = '';
            this.eventBus.emit(GameEvents.DIALOG_NEXT, this.state);
            return 'next';
        }
        
        // 对话结束
        this.end();
        return 'end';
    }

    /** 选择选项 */
    selectChoice(index) {
        if (!this.hasChoices()) return;
        this.state.selectedChoice = index;
    }

    /** 确认选择 */
    confirmChoice() {
        if (!this.hasChoices()) return;
        const choice = this.state.choices[this.state.selectedChoice];
        const callback = this.state.callback;
        this.end();
        if (callback) {
            callback(this.state.selectedChoice, choice);
        }
        return this.state.selectedChoice;
    }

    /** 结束对话 */
    end() {
        const callback = this.state.callback;
        this.state.active = false;
        this.eventBus.emit(GameEvents.DIALOG_END);
        return callback;
    }

    /** 获取状态 */
    getState() {
        return this.state;
    }

    /** 是否激活 */
    isActive() {
        return this.state.active;
    }
}

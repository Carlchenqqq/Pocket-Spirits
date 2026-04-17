/**
 * DialogEngine - 对话引擎（纯逻辑层）
 * 统一管理对话流程、打字机效果、分页系统、选项回调
 * 不包含任何渲染或输入
 */
class DialogEngine {
    constructor(eventBus) {
        this.eventBus = eventBus;
        this.state = this._createEmptyState();
    }

    /** 创建空状态 */
    _createEmptyState() {
        return {
            active: false,
            speaker: null,
            pages: [],
            currentPage: 0,
            displayedText: '',
            charIndex: 0,
            choices: null,       // string[] | null
            selectedChoice: 0,
            callback: null,
            speed: 30,           // ms/char
            lastUpdate: 0,
            // 额外元数据（渲染用）
            avatarId: null,      // 头像ID
            boxStyle: 'default'  // 'default' | 'narrator' | 'system'
        };
    }

    // ════════════════════════════════════
    //   启动对话
    // ════════════════════════════════════

    /**
     * 开始一段对话
     * @param {object} config - { speaker, text, choices, callback, speed, avatarId, boxStyle }
     */
    start(config) {
        const text = config.text || '';
        this.state = {
            active: true,
            speaker: config.speaker || null,
            pages: Array.isArray(text) ? text : [text],
            currentPage: 0,
            displayedText: '',
            charIndex: 0,
            choices: config.choices || null,
            selectedChoice: 0,
            callback: config.callback || null,
            speed: config.speed || 30,
            lastUpdate: performance.now(),
            avatarId: config.avatarId || null,
            boxStyle: config.boxStyle || 'default'
        };
        this.eventBus.emit(GameEvents.DIALOG_START, this.state);
        return this.state;
    }

    // ════════════════════════════════════
    //   打字机更新
    // ════════════════════════════════════

    /**
     * 更新打字机动画
     * @param {number} timestamp - 当前时间戳（performance.now()）
     */
    update(timestamp) {
        if (!this.state.active) return;
        if (this._isPageComplete()) return;

        if (timestamp - this.state.lastUpdate >= this.state.speed) {
            this.state.charIndex++;
            this.state.displayedText = this._getCurrentText().substring(0, this.state.charIndex);
            this.state.lastUpdate = timestamp;
        }
    }

    /** 立即完成当前页打字 */
    skipTyping() {
        if (this._isPageComplete()) return false;
        const text = this._getCurrentText();
        this.state.charIndex = text.length;
        this.state.displayedText = text;
        return true; // 表示确实执行了跳过
    }

    // ════════════════════════════════════
    //   页面导航
    // ════════════════════════════════════

    _getCurrentText() {
        return this.state.pages[this.state.currentPage] || '';
    }

    _isPageComplete() {
        return this.state.charIndex >= this._getCurrentText().length;
    }

    hasMorePages() {
        return this.state.currentPage < this.state.pages.length - 1;
    }

    hasChoices() {
        return this.state.choices !== null &&
               this.state.choices.length > 0 &&
               this._isPageComplete() &&
               !this.hasMorePages();
    }

    /**
     * 下一步操作
     * @returns {string} 'typing'|'choices'|'next'|'end'
     */
    next() {
        if (!this.state.active) return 'end';

        if (!this._isPageComplete()) {
            this.skipTyping();
            return 'typing';
        }

        if (this.hasChoices()) {
            return 'choices';
        }

        if (this.hasMorePages()) {
            this.state.currentPage++;
            this.state.charIndex = 0;
            this.state.displayedText = '';
            this.eventBus.emit(GameEvents.DIALOG_NEXT, this.state);
            return 'next';
        }

        this.end();
        return 'end';
    }

    // ════════════════════════════════════
    //   选项系统
    // ════════════════════════════════════

    getChoices() { return this.state.choices; }
    getSelectedChoiceIndex() { return this.state.selectedChoice; }

    selectChoice(index) {
        if (!this.hasChoices()) return;
        const count = this.state.choices.length;
        this.state.selectedChoice = Math.max(0, Math.min(count - 1, index));
    }

    moveChoiceUp() {
        if (!this.hasChoices()) return;
        const idx = this.state.selectedChoice;
        this.selectChoice(idx > 0 ? idx - 1 : this.state.choices.length - 1);
    }

    moveChoiceDown() {
        if (!this.hasChoices()) return;
        const idx = this.state.selectedChoice;
        this.selectChoice(idx < this.state.choices.length - 1 ? idx + 1 : 0);
    }

    /**
     * 确认当前选项并结束对话
     * @returns {number} 选中的选项索引
     */
    confirmChoice() {
        if (!this.hasChoices()) return -1;
        const choice = this.state.choices[this.state.selectedChoice];
        const cb = this.state.callback;
        const selectedIdx = this.state.selectedChoice;
        this.end();
        if (cb) cb(selectedIdx, choice);
        return selectedIdx;
    }

    // ════════════════════════════════════
    //   结束
    // ════════════════════════════════════

    end() {
        const cb = this.state.callback;
        this.state.active = false;
        this.eventBus.emit(GameEvents.DIALOG_END);
        return cb;
    }

    isActive() { return this.state.active; }

    getState() { return this.state; }

    // ─── 快捷方法 ───

    /**
     * 快速显示一行文本后关闭（用于系统提示等）
     */
    showQuickMessage(text, callback = null, duration = 1500) {
        this.start({
            text,
            speed: 10, // 打字更快
            boxStyle: 'system',
            callback
        });
        // 自动快速打完 + 延时关闭
        setTimeout(() => {
            this.skipTyping();
            setTimeout(() => this.end(), Math.max(100, duration));
        }, 200);
    }
}

/**
 * InputManager - 键盘/点击输入管理
 * 支持键盘操作和鼠标/触摸点击移动
 */
class InputManager {
    constructor(canvas) {
        // 按键状态
        this.keys = {};
        // 上一次按键状态
        this.prevKeys = {};
        // 移动冷却时间（毫秒）
        this.moveCooldown = 150;
        this.lastMoveTime = 0;
        // A键冷却
        this.actionCooldown = 200;
        this.lastActionTime = 0;

        // 点击/触摸相关
        this.canvas = canvas;
        this.clickX = -1;       // 点击的画布坐标 X
        this.clickY = -1;       // 点击的画布坐标 Y
        this.hasClick = false;  // 是否有待处理的点击
        this.clickConsumed = false; // 点击是否已被消费

        this._initKeyboard();
        this._initClick();
    }

    /** 初始化键盘监听 */
    _initKeyboard() {
        window.addEventListener('keydown', (e) => {
            if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space','Enter','Escape'].includes(e.code)) {
                e.preventDefault();
            }
            this.keys[e.code] = true;
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
    }

    /** 初始化点击/触摸事件 */
    _initClick() {
        const getCanvasPos = (clientX, clientY) => {
            const rect = this.canvas.getBoundingClientRect();
            const scaleX = this.canvas.width / rect.width;
            const scaleY = this.canvas.height / rect.height;
            return {
                x: (clientX - rect.left) * scaleX,
                y: (clientY - rect.top) * scaleY
            };
        };

        // 鼠标点击
        this.canvas.addEventListener('mousedown', (e) => {
            const pos = getCanvasPos(e.clientX, e.clientY);
            this.clickX = pos.x;
            this.clickY = pos.y;
            this.hasClick = true;
            this.clickConsumed = false;
        });

        // 触摸
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const pos = getCanvasPos(touch.clientX, touch.clientY);
            this.clickX = pos.x;
            this.clickY = pos.y;
            this.hasClick = true;
            this.clickConsumed = false;
        });
    }

    /** 获取并消费点击坐标（返回 {x, y} 或 null） */
    getClick() {
        if (this.hasClick && !this.clickConsumed) {
            this.clickConsumed = true;
            return { x: this.clickX, y: this.clickY };
        }
        return null;
    }

    /** 检查是否有未消费的点击 */
    hasPendingClick() {
        return this.hasClick && !this.clickConsumed;
    }

    /** 查看点击坐标但不消费（可多次调用） */
    peekClick() {
        if (this.hasClick && !this.clickConsumed) {
            return { x: this.clickX, y: this.clickY };
        }
        return null;
    }

    /** 清除点击状态 */
    clearClick() {
        this.hasClick = false;
        this.clickConsumed = false;
    }

    /** 每帧结束时调用 */
    update() {
        // 清除已处理的点击
        if (this.clickConsumed) {
            this.hasClick = false;
            this.clickConsumed = false;
        }

        for (const key in this.keys) {
            this.prevKeys[key] = this.keys[key];
        }
        for (const key in this.prevKeys) {
            if (!(key in this.keys)) {
                delete this.prevKeys[key];
            }
        }
    }

    /** 检测按键是否刚被按下 */
    isJustPressed(code) {
        return this.keys[code] === true && this.prevKeys[code] !== true;
    }

    /** 检测按键是否持续按下 */
    isPressed(code) {
        return this.keys[code] === true;
    }

    /** 获取方向输入（带冷却）- 仅键盘 */
    getDirection(now) {
        if (now - this.lastMoveTime < this.moveCooldown) return null;

        let dir = null;
        if (this.keys['ArrowUp'] || this.keys['KeyW']) dir = 'up';
        else if (this.keys['ArrowDown'] || this.keys['KeyS']) dir = 'down';
        else if (this.keys['ArrowLeft'] || this.keys['KeyA']) dir = 'left';
        else if (this.keys['ArrowRight'] || this.keys['KeyD']) dir = 'right';

        if (dir) {
            this.lastMoveTime = now;
        }
        return dir;
    }

    /** 获取确认键输入（带冷却） */
    isConfirmPressed(now) {
        if (now - this.lastActionTime < this.actionCooldown) return false;
        if (this.isJustPressed('Space') || this.isJustPressed('Enter')) {
            this.lastActionTime = now;
            return true;
        }
        return false;
    }

    /** 获取取消键输入 */
    isCancelPressed() {
        return this.isJustPressed('Escape') || this.isJustPressed('KeyX');
    }

    /** 检测任意键按下 */
    anyKeyPressed() {
        for (const key in this.keys) {
            if (this.keys[key] && !this.prevKeys[key]) return true;
        }
        return false;
    }

    /** 清除所有按键状态 */
    clearAll() {
        this.keys = {};
        this.prevKeys = {};
        this.hasClick = false;
        this.clickConsumed = false;
    }
}

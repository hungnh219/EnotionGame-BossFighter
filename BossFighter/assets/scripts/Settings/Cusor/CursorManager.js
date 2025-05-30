cc.Class({
    extends: cc.Component,

    properties: {
        canvasNode: cc.Node,           // Kéo thả Canvas hoặc node gốc UI
        cursorBackground: cc.Node,     // Sprite con trỏ nền
        cursorOnButton: cc.Node,       // Sprite con trỏ khi hover button
    },

    onLoad() {
        if (!this.canvasNode) {
            cc.error('Bạn chưa gán canvasNode!');
            return;
        }

        // Ẩn con trỏ hệ thống luôn
        if (!cc.sys.isNative) {
            cc.game.canvas.style.cursor = 'none';
        }

        // Lắng nghe sự kiện MOUSE_MOVE trên toàn Canvas
        this.canvasNode.on(cc.Node.EventType.MOUSE_MOVE, this.onMouseMove, this);

        // Mặc định bật con trỏ nền, tắt con trỏ tay
        this.showBackgroundCursor();
        this.hideButtonCursor();
    },

    onMouseMove(event) {
        let pos = event.getLocation();
        let localPos = this.node.convertToNodeSpaceAR(pos);

        this.cursorBackground.position = localPos;
        this.cursorOnButton.position = localPos;

        // Đảm bảo con trỏ luôn trên cùng
        this.node.setSiblingIndex(this.node.parent.children.length - 1);
        this.cursorBackground.setSiblingIndex(this.cursorBackground.parent.children.length - 1);
        this.cursorOnButton.setSiblingIndex(this.cursorOnButton.parent.children.length - 1);
    },

    // Gọi khi hover vào button để đổi con trỏ sang tay
    showButtonCursor() {
        this.cursorOnButton.active = true;
        this.cursorBackground.active = false;
    },

    // Gọi khi rời button để trả về con trỏ nền
    hideButtonCursor() {
        this.cursorOnButton.active = false;
        this.cursorBackground.active = true;
    },

    showBackgroundCursor() {
        this.cursorBackground.active = true;
    },

    hideBackgroundCursor() {
        this.cursorBackground.active = false;
    }
});

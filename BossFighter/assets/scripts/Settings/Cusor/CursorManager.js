cc.Class({
    extends: cc.Component,

    properties: {
        canvasNode: cc.Node,           
        cursorBackground: cc.Node,     
        cursorOnButton: cc.Node,       
    },

    onLoad() {
        if (!this.canvasNode) {
            cc.error('Bạn chưa gán canvasNode!');
            return;
        }

        // Ẩn con trỏ hệ thống 
        if (!cc.sys.isNative) {
            cc.game.canvas.style.cursor = 'none';
        }

        this.canvasNode.on(cc.Node.EventType.MOUSE_MOVE, this.onMouseMove, this);

        this.showBackgroundCursor();
        this.hideButtonCursor();
    },

    onMouseMove(event) {
        let pos = event.getLocation();
        let localPos = this.node.convertToNodeSpaceAR(pos);

        this.cursorBackground.position = localPos;
        this.cursorOnButton.position = localPos;
    },

    showButtonCursor() {
        this.cursorOnButton.active = true;
        this.cursorBackground.active = false;
    },

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

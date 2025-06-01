cc.Class({
    extends: cc.Component,

    properties: {
        cursorManager: cc.Node,
    },

    onLoad() {
        this.node.on(cc.Node.EventType.MOUSE_ENTER, this.onMouseEnter, this);
        this.node.on(cc.Node.EventType.MOUSE_LEAVE, this.onMouseLeave, this);
    },

    onMouseEnter() {
        let cursorManager = this.cursorManager.getComponent('CursorManager');
        if (cursorManager) {

            cursorManager.hideBackgroundCursor();
            cursorManager.showButtonCursor();

        }
    },

    onMouseLeave() {
        let cursorManager = this.cursorManager.getComponent('CursorManager');
        if (cursorManager) {
            cursorManager.showBackgroundCursor();
            cursorManager.hideButtonCursor();

        }
    }
});

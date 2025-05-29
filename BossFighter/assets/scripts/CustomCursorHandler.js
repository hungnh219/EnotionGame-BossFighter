cc.Class({
    extends: cc.Component,

    properties: {
        handCursorSprite: cc.Node,  
    },

    onLoad() {
        this.handCursorSprite.active = false;

        this.node.on(cc.Node.EventType.MOUSE_ENTER, this.onMouseEnter, this);
        this.node.on(cc.Node.EventType.MOUSE_LEAVE, this.onMouseLeave, this);
        this.node.on(cc.Node.EventType.MOUSE_MOVE, this.onMouseMove, this);
    },

    onMouseEnter() {
        if (!cc.sys.isNative) {
            cc.game.canvas.style.cursor = 'none';
        }
        
        this.handCursorSprite.active = true;
    },

    onMouseLeave() {
       if (!cc.sys.isNative) {
            cc.game.canvas.style.cursor = 'default';
        }

        this.handCursorSprite.active = false;
    },

    onMouseMove(event) {
       if (!this.handCursorSprite) return;
        let pos = event.getLocation();
        this.handCursorSprite.position = this.node.parent.convertToNodeSpaceAR(pos);
    }
});

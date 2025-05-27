cc.Class({
    extends: cc.Component,

    properties: {
        cameraNode: cc.Node,  
    },

    onLoad() {
        this.node.on(cc.Node.EventType.TOUCH_MOVE, this.onTouchMove, this);
    },

    onTouchMove(event) {
        let delta = event.getDelta();

        if (this.cameraNode) {
            this.cameraNode.x -= delta.x;
            this.cameraNode.y -= delta.y;
        }
    },
});

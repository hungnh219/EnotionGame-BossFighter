// const { default: EventBus } = require("./EventBus");
import EventBus from "./EventBus";

cc.Class({
    extends: cc.Component,

    properties: {
     
    },

    // LIFE-CYCLE CALLBACKS:

    onLoad () {
        this.node.on(cc.Node.EventType.TOUCH_END, () => {
            EventBus.emit(EventBus.events.MOVE_TO_WALKABLE_TILE, null, this.node);
        }, this)
    },

    start () {

    },

    // update (dt) {},
});

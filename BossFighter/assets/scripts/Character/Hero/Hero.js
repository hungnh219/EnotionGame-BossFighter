// import EventBus from "../EventBus";
import EventBus from "../../EventBus";

cc.Class({
    extends: cc.Component,

    properties: {

    },

    // LIFE-CYCLE CALLBACKS:    

    onLoad () {
        this.node.on(cc.Node.EventType.TOUCH_END, () => {
            EventBus.emit(EventBus.events.CLICK_TO_MOVE, this.node);
        }, this);
    },

    start () {

    },

    // update (dt) {},
});

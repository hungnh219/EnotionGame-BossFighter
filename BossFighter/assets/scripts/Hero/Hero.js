import EventBus from "../EventBus";

cc.Class({
    extends: cc.Component,

    properties: {

    },

    // LIFE-CYCLE CALLBACKS:    

    onLoad () {
        console.log('hero script onload')
        // Lắng nghe sự kiện click chuột
        this.node.on(cc.Node.EventType.TOUCH_END, () => {
            EventBus.emit(EventBus.events.CLICK_TO_MOVE, this.node);
        }, this);
    },

    start () {

    },

    // update (dt) {},
});

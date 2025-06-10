// import EventBus from "../EventBus";
import EventBus from "../../EventBus";
import SocketIOManager from "../../SocketIO/SocketIOManager";
cc.Class({
    extends: cc.Component,

    properties: {

    },

    // LIFE-CYCLE CALLBACKS:    

    onLoad () {
        this.SocketIOManager = SocketIOManager.getInstance() || new SocketIOManager();

        this.node.on(cc.Node.EventType.TOUCH_END, async () => {
            let isPlayerTurn = await this.SocketIOManager.turn.isPlayerTurn();
            if (!isPlayerTurn) {
                console.warn("It's not the player's turn to click");
                return;
            }
            EventBus.emit(EventBus.events.CLICK_TO_MOVE, this.node);
        }, this);
    },

    start () {

    },

    // update (dt) {},
});

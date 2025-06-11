// import EventBus from "../EventBus";
import EventBus from "../../EventBus";
import SocketIOManager from "../../SocketIO/SocketIOManager";
cc.Class({
    extends: cc.Component,

    properties: {

    },

    // LIFE-CYCLE CALLBACKS:    

    onLoad () {
        this.socketIOManager = SocketIOManager.getInstance() || new SocketIOManager();

        this.node.on(cc.Node.EventType.TOUCH_END, async () => {
            let isPlayerTurn = await this.socketIOManager.turn.isPlayerTurn();
            if (!isPlayerTurn) {
                console.warn("It's not the player's turn to click");
                return;
            }
            EventBus.emit(EventBus.events.CLICK_TO_MOVE, this.node);
        }, this);
    },

    start () {

    },

    health(characterId) {
        this.socketIOManager.game.heal(characterId);

        if (this.node.mainScript && typeof this.node.mainScript.updateHpBar === 'function') {
            this.node.mainScript.updateHpBar();
        } else {
            console.error("Main script or health method not found on node");
        }
    }

    // update (dt) {},
});

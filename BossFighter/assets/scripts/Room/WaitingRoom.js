import SocketIOManager from "../SocketIOManager";

cc.Class({
    extends: cc.Component,

    properties: {
        prefabPlayer: cc.Prefab,
        gridPlayer: cc.Node
    },

    // LIFE-CYCLE CALLBACKS:

    onLoad() {
        this.socketIOManager = SocketIOManager.getInstance() || new SocketIOManager;
    },

    start() {
        // this.socketIOManager.getRoomInformation();
        this.socket = this.socketIOManager.getSocketIO();
        this.getAllPlayer()
    },

    getAllPlayer() {
        this.gridPlayer.removeAllChildren()
        this.nodePlayer = cc.instantiate(this.prefabPlayer);
        this.labelNode = this.nodePlayer.getChildByName("New Label");
        this.labelComp = this.labelNode.getComponent(cc.Label);
        this.labelComp.string = this.socket.id
        this.gridPlayer.addChild(this.nodePlayer)
        console.log(this.socket.id)
    }

    // update (dt) {},
});
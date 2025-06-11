// const RoomModule = require('RoomModule');
import RoomModule from "./RoomModule";
import GameModule from "./GameModule";
import SelectHeroModule from "./SelectHeroModule";
import ScoreTableModule from "./ScoreTableModule";
import TurnModule from "./TurnModule";

const SocketIOManager = cc.Class({
    extends: cc.Component,

    statics: {
        getInstance() {
            if (!this.instance) {
                this.instance = new SocketIOManager();
            }
            return this.instance;
        }
    },

    properties: {
    },


    onLoad() {

    },

    start() {

    },

    connectToSocketIOServer(url) {
        console.log("Kết nối đến Socket.IO server tại...:", url);
        if (this.socketIO && this.socketIO.connected) {
            console.warn("socketIO đã kết nối rồi.");
            return;
        }

        this.socketIO = io(url, {
            transports: ['websocket', 'polling'],
            cors: {
                origin: "*",
                methods: ["GET", "POST"]
            },
            reconnection: true,
            reconnectionAttempts: 5, 
            reconnectionDelay: 2000,
        });

        this.room = RoomModule(this.socketIO);
        this.selectHero = SelectHeroModule(this.socketIO);
        this.game = GameModule(this.socketIO);
        this.scoreTable = ScoreTableModule(this.socketIO)
        this.turn = TurnModule(this.socketIO);

    },

    getSocketIO() {
        return this.socketIO
    },
});

export default SocketIOManager;
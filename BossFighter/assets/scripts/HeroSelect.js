import GameController from "./GameController";
import GameScene from "./GameScene";

cc.Class({
    extends: cc.Component,

    properties: {
        mapPicked: cc.Label
    },

    // LIFE-CYCLE CALLBACKS:

    onLoad () {
        this.gameController = GameController.getInstance();

        this.mapPicked.string = this.gameController.getMapPicked();
        console.log('this.mapPicked.string',this.mapPicked.string)
    },

    start () {

    },

    // update (dt) {},
    playGame() {
        console.log("playGame");
        cc.director.loadScene(GameScene.GAME);
    }
});

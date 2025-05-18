import GameController from "./GameController";
import GameScene from "./GameScene";

cc.Class({
    extends: cc.Component,

    properties: {

    },

    // LIFE-CYCLE CALLBACKS:

    onLoad () {
        // if (GameController.instance === null) {
        //     GameController.instance = this;
        //     cc.game.addPersistRootNode(this.node);
        // } else {
        //     this.node.destroy();
        // }
        const gameController = GameController.getInstance();
        if (gameController) {
            this.gameController = gameController;
        } else {
            this.gameController = new GameController();
            cc.game.addPersistRootNode(this.node);
        }

        console.log("gameController", this.gameController);

    },

    start () {

    },

    // update (dt) {},
    map1Picked () {
        console.log("map1Picked");
        this.gameController.setMapPicked("map1");
        cc.director.loadScene(GameScene.HERO_SELECT);
    },

    map2Picked () {
        console.log("map2Picked");
        this.gameController.setMapPicked("map2");
        cc.director.loadScene(GameScene.HERO_SELECT);
    }
});

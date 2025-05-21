import GameController from "./GameController";
import GAME_DATA from "./GameData";

cc.Class({
    extends: cc.Component,

    properties: {
    },

    // LIFE-CYCLE CALLBACKS:

    onLoad () {
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
        console.log('test', this.gameController.getWonMap())
        if (this.gameController.getWonMap() < GAME_DATA.GameMapIndex.MAP_1 || this.gameController.getWonMap() == undefined || this.gameController.getWonMap() == null) return;
        console.log("map1Picked");
        this.gameController.setMapPicked(GAME_DATA.GameMapIndex.MAP_1);
        cc.director.loadScene(GAME_DATA.GameScene.HERO_SELECT);
    },

    map2Picked () {
        console.log('test', this.gameController.getWonMap())
        if (this.gameController.getWonMap() < GAME_DATA.GameMapIndex.MAP_2 || this.gameController.getWonMap() == undefined || this.gameController.getWonMap() == null) return;
        console.log("map2Picked");
        this.gameController.setMapPicked(GAME_DATA.GameMapIndex.MAP_2);
        cc.director.loadScene(GAME_DATA.GameScene.HERO_SELECT);
    },

    map3Picked () {
        if (this.gameController.getWonMap() < GAME_DATA.GameMapIndex.MAP_3 || this.gameController.getWonMap() == undefined || this.gameController.getWonMap() == null) return;
        console.log("map3Picked");
        this.gameController.setMapPicked(GAME_DATA.GameMapIndex.MAP_3);
        cc.director.loadScene(GAME_DATA.GameScene.HERO_SELECT);
    }
});

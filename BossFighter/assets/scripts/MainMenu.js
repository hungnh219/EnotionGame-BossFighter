import GameScene from "./GameData";

cc.Class({
    extends: cc.Component,

    properties: {

    },

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {},

    start () {

    },

    // update (dt) {},

    playSoloMode() {
        console.log("playSoloMode");
        cc.director.loadScene(GameScene.MAP_SELECT);
    }
});

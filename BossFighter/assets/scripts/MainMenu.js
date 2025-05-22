import GAME_DATA from "./GameData";

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
        cc.director.loadScene(GAME_DATA.GAME_SCENE.MAP_SELECT);
    }
});

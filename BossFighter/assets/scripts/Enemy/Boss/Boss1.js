// Learn cc.Class:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/class.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/life-cycle-callbacks.html
// import Character from "../../Character"
import Character from "../../Character";

cc.Class({
    extends: Character,

    properties: {
  
    },

    // LIFE-CYCLE CALLBACKS:

    onLoad () {
        console.log("Boss1 onLoad");
    },

    start () {

    },

    // update (dt) {},
});

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
        characterId: "boss001",
    },

    // LIFE-CYCLE CALLBACKS:

    onLoad () {
        console.log("Boss1 onLoad");
    },

    start () {
        this.initData(this.characterId);
    },

    initData(characterNameId) {
        this._super(characterNameId);
        console.log("Boss1 initData with characterId:", characterNameId);
    },

    // update (dt) {},
});

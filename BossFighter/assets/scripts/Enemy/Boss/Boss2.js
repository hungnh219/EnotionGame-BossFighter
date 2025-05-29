// Learn cc.Class:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/class.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/life-cycle-callbacks.html
import Character from "../../Character";

cc.Class({
    extends: Character,

    properties: {
        characterId: "boss003",
    },

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {},

    start () {
        this.initData(this.characterId);
    },

    initData(characterNameId) {
        this._super(characterNameId);
    }
    // update (dt) {},
});

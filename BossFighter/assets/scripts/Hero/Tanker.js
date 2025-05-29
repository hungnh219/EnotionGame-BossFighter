import Character from "../Character";

cc.Class({
    extends: Character,

    properties: {
        characterId: "hero004",
    },

    // LIFE-CYCLE CALLBACKS:

    onLoad () {
        this.initData(this.characterId);
    },

    start () {
        
    },

    ultimate() {

    },
    initData(characterNameId) {
        this._super(characterNameId);
    }

    // update (dt) {},
});

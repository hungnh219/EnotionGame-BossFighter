// Learn cc.Class:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/class.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/life-cycle-callbacks.html

cc.Class({
    extends: cc.Component,

    properties: {
        tankerPrefab: cc.Prefab,
        adcPrefab: cc.Prefab,
        bruiserPrefab: cc.Prefab,
        magePrefab: cc.Prefab,
    },

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {},

    start () {

    },

    // update (dt) {},

    getAllPrefab() {
        return [
            this.tankerPrefab,
            this.adcPrefab,
            this.bruiserPrefab,
            this.magePrefab
        ]
    }
});

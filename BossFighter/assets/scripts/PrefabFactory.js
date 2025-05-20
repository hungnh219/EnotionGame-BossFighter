// Learn cc.Class:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/class.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/life-cycle-callbacks.html

cc.Class({
    extends: cc.Component,

    properties: {
        characterPrefab: cc.Prefab,
        enemyPrefab: cc.Prefab,
        tankerPrefab: cc.Prefab,
    },

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {},

    start () {

    },

    // update (dt) {},

    getAllPrefab() {
        return [
            this.characterPrefab,
            // this.enemyPrefab,
            this.tankerPrefab,
            this.tankerPrefab,
            this.tankerPrefab,
            this.tankerPrefab,
            this.tankerPrefab,
            this.tankerPrefab,
            this.tankerPrefab,
        ]
    }
});

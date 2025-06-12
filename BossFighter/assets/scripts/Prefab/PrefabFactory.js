// Learn cc.Class:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/class.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/life-cycle-callbacks.html
import PoolingManager from './PoolingManager';

cc.Class({
    extends: cc.Component,

    properties: {
        adcPrefab: cc.Prefab,
        bruiserPrefab: cc.Prefab,
        tankerPrefab: cc.Prefab,
        vampirePrefab: cc.Prefab,
    },

    // LIFE-CYCLE CALLBACKS:

    onLoad () {
        this.poolingManager = PoolingManager.getInstance();

        if (!this.poolingManager) {
            cc.error('PoolingManager instance not found. Please ensure it is initialized before PrefabFactory.');
            return;
        }

        // this.poolingManager.resgisterPrefab('AdcHero', this.adcPrefab, 1, 2);
        // this.poolingManager.resgisterPrefab('BruiserHero', this.bruiserPrefab, 1, 2);
        // this.poolingManager.resgisterPrefab('TankerHero', this.tankerPrefab, 1, 2);
        // this.poolingManager.resgisterPrefab('VampireHero', this.vampirePrefab, 1, 2);

        this.poolingManager.resgisterPrefab('Enemy', this.enemyPrefab, 3, 5);
        



    },

    spawnHero() {

    },

    spawnBoss() {

    },

    // spawnObjectMap

    despawnHero() {

    },

    start () {

    },

    // update (dt) {},

    getAllPrefab() {
        return [
            this.adcPrefab,
            this.bruiserPrefab,
            this.tankerPrefab,
            this.vampirePrefab,
        ]
    }
});

// Learn cc.Class:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/class.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/life-cycle-callbacks.html

cc.Class({
    extends: cc.Component,

    properties: {
        playerPrefab: cc.Prefab,
        enemyPrefab: cc.Prefab,
        playerSpawn: cc.Node,
        enemySpawn: cc.Node,
    },

    // LIFE-CYCLE CALLBACKS:

    onLoad() {
        // Spawn player
        const player = cc.instantiate(this.playerPrefab);
        player.setPosition(this.playerSpawn.position);
        this.node.addChild(player);

        // Spawn enemy
        const enemy = cc.instantiate(this.enemyPrefab);
        enemy.setPosition(this.enemySpawn.position);
        this.node.addChild(enemy);

        window.enemyList = [enemy.getComponent('Enemy')];
    },

    // spawnEnemies() {
    //     this.spawnPoints.forEach(spawnPoint => {
    //         const enemy = cc.instantiate(this.enemyPrefab);
    //         enemy.setPosition(spawnPoint.position);
    //         this.node.addChild(enemy);
    //     });
    // },

    start() {

    },

    // update(dt) {
    //     for (let i = 0; i < window.enemyList.length; i++) {
    //         const enemy = window.enemyList[i];
    //         if (enemy.hp <= 0) continue;
    //     }
    // },
});

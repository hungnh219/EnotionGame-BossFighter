
const PoolPrefab = cc.Class({
    extends: cc.Component,

    statics: {
        _instance: null,

        getInstance() {
            return this._instance;
        }
    },

    properties: {
        walkableGridPrefab: cc.Prefab,
    },

    // LIFE-CYCLE CALLBACKS:

    onLoad () {
        if (PoolPrefab._instance) {
            this.node.destroy();
            return;
        }

        PoolPrefab._instance = this;
        cc.game.addPersistRootNode(this.node);

        // initialize pool
        this.walkableGridPool = {};
        for (let index = 0; index < 5 * 5; index++) {
            this.walkableGridPool[index] = new cc.NodePool();
        }
    },

    start () {

    },

    getWalkableGrid(index, holder) {

    },

    putWalkableGrid(node) {

    },

    _getNodeFromPool(pool, prefab, holder) {
        let node;
        if (pool.size() > 0) {
            node = pool.get();
        } else {
            node = cc.instantiate(prefab);
        }
        node.parent = holder;
        return node;
    },

    _putNodeToPool(pool, node) {
        if (pool && node) {
            pool.put(node);
        }
    },

    clearPools() {
        for (let key in this.walkableGridPool) {
            this.walkableGridPool[key].clear();
        }
    }

    // update (dt) {},
});

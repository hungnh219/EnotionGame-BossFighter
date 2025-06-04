const PoolingManager = cc.Class({
    extends: cc.Component,

    statics: {
        _instance: null,

        getInstance() {
            return this._instance;
        }
    },
    properties: {
        AdcPrefab: cc.Prefab,
        BruiserPrefab: cc.Prefab,
        TankerPrefab: cc.Prefab,
        VampirePrefab: cc.Prefab,

        Boss1Prefab: cc.Prefab,
        Boss2Prefab: cc.Prefab,
        Boss3Prefab: cc.Prefab,

        EnemyPrefab: cc.Prefab,

        HeroSkillPrefabs: [cc.Prefab],
        BossSkillPrefabs: [cc.Prefab],
    },

    // LIFE-CYCLE CALLBACKS:

    onLoad () {
        if (PoolingManager._instance) {
            this.node.destroy();
            return;
        }

        PoolingManager._instance = this;
        cc.game.addPersistRootNode(this.node)


        _prefabDict = {}; // Dictionary to hold prefabs
        _activeCount = {}; // Dictionary to hold active counts
    },

    start () {

    },
    
    // =================== Resgister: Start ===================
    resgisterPrefab(key, prefab, initialSize = 5, maxSize = 10) {
        if (this._prefabDict[key]) {
            cc.error(`Prefab with key ${key} is already registered.`);
            return;
        }

        const pool = new cc.NodePool();

        for (let i = 0; i < initialSize; i++) {
            const node = cc.instantiate(prefab);
            pool.put(node);
        }

        this._prefabDict[key] = {
            pool: pool,
            maxSize: maxSize,
            prefab: prefab,
        }

        this._activeCount[key] = 0;
    },

    // =================== Resgister: End ===================

    spawn(key, parent = null) {
        const prefabData = this._prefabDict[key];

        if (!prefabData) {
            cc.error(`Prefab with key ${key} is not registered.`);
            return null;
        }

        if (this._activeCount[key] >= prefabData.maxSize) {
            cc.warn(`Maximum active count reached for prefab with key ${key}.`);
            return null;
        }

        let node = null;

        if (prefabData.pool.size() > 0) {
            node = prefabData.pool.get();
        } else {
            node = cc.instantiate(prefabData.prefab);
        }

        this._activeCount[key]++;
        if (parent) {
            parent.addChild(node);
        }

        return node;
    },

    despawn(key, node) {
        const prefabData = this._prefabDict[key];
        
        if (!prefabData) {
            cc.error(`Prefab with key ${key} is not registered.`);
            return;
        }

        this._activeCount[key]--;

        if (this._activeCount[key] < 0) {
            cc.error(`Active count for prefab with key ${key} is negative.`);
            this._activeCount[key] = 0;
        }

        prefabData.pool.put(node);
        node.removeFromParent();
    },

    clearAll() {
        for (const key in this._prefabDict) {
            const prefabData = this._prefabDict[key];
            prefabData.pool.clear();
            this._activeCount[key] = 0;
        }
    }

    // update (dt) {},



   
        
});

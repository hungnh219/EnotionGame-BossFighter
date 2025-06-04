// DataManager.js
const DataManager = cc.Class({
    extends: cc.Component,

    statics: {
        _instance: null,
        getInstance() {
            return this._instance;
        }
    },

    properties: {
        defaultDataJson: cc.JsonAsset // Kéo JSON từ Assets vào đây
    },

    onLoad() {
        if (DataManager._instance) {
            this.destroy();
            return;
        }
        DataManager._instance = this;
        cc.game.addPersistRootNode(this.node); // Giữ qua các scene

        this._data = null;
        this._initData();
    },

    _initData() {
        
    },

    getData() {
        return this._data;
    },

    setData(newData) {
        this._data = newData;
    },

    save() {
      
    },
});

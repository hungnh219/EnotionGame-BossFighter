// class dùng để đọc và lưu trữ dữ liệu của game
// sử dụng singleton để đảm bảo chỉ có một instance duy nhất
// có nên chia dữ liệu thành nhiều file json nhỏ hơn không?

const DataManager = cc.Class({
    extends: cc.Component,

    statics: {
        _instance: null,
        getInstance() {
            return this._instance;
        }
    },

    properties: {
        defaultDataJson: cc.JsonAsset
    },

    onLoad() {
        if (DataManager._instance) {
            this.destroy();
            return;
        }
        DataManager._instance = this;
        cc.game.addPersistRootNode(this.node);

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

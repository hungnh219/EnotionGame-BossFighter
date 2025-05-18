const GameController = cc.Class({
    extends: cc.Component,
    
    statics: {
        instance: null,
        getInstance: function () {
            if (GameController.instance === null) {
                GameController.instance = new GameController();
            }
            return GameController.instance;
        },
        destroyInstance: function () {
            if (GameController.instance !== null) {
                GameController.instance = null;
            }
        },
    },

    properties: {

    },

    // LIFE-CYCLE CALLBACKS:

    onLoad () {
        if (GameController.instance === null) {
            GameController.instance = this;
            cc.game.addPersistRootNode(this.node);
        } else {
            this.node.destroy();
        }


        this.mapPick = null;
        this.heroPick = [];
    },

    start () {

    },

    // update (dt) {},
    testChangeScene () {
        console.log("testChangeScene");
        cc.director.loadScene("map");
    },

    testPrintScene (word) {
        console.log("testPrintScene", word);
        cc.director.getScene().name;
    },

    getEditBoxValue (string) {
        console.log("getEditBoxValue", string);
        this.editBoxString = string;
    },

    printEditBoxValue () {
        console.log("printEditBoxValue", this.editBoxString);
    },

    setMapPicked (mapPick) {
        this.mapPick = mapPick;
    },

    getMapPicked () {
        return this.mapPick;
    },

    setHeroPick (heroPick) {
        this.heroPick = heroPick;
    },

    getHeroPick () {
        return this.heroPick;
    },
});

export default GameController;

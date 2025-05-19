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

        // variables
        this.mapPick = null;
        this.heroPick = [];
        this.selectedHeroPrefabs = [];
        this.listenMoveNode = null;
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

    /* select hero */
    addSelectedHeroPrefab(prefab) {
        if (!this.selectedHeroPrefabs) this.selectedHeroPrefabs = []; 
        console.log(this.selectedHeroPrefabs)
        console.log('hero prefab', prefab)
        this.selectedHeroPrefabs.push(prefab);
    },

    getHeroPrefabs() {
        return this.selectedHeroPrefabs;
    },

    setTileSize(tileWidth, tileHeight) {
        this.mapTileWidth = tileWidth;
        this.mapTileHeight = tileHeight;
    },
    listenKeyDown(listenNode) {
        console.log(this.mapTileWidth, this.mapTileHeight, '2131231')
        if (this.mapTileWidth == undefined) {
            this.mapTileWidth = 64;
        }

        if (this.mapTileHeight == undefined) {
            this.mapTileHeight = 64;
        }
        this.listenMoveNode = listenNode;
        this.pressedKeys = new Set();
        cc.systemEvent.on(cc.SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);
        cc.systemEvent.on(cc.SystemEvent.EventType.KEY_UP, this.onKeyUp, this);
    },
    onKeyDown(event) {
        this.pressedKeys.add(event.keyCode);

        // delay to wait set of keys down
        this.scheduleOnce(() => {
            this.checkMove();
        }, 0.1);
    },
    onKeyUp(event) {
        this.pressedKeys.delete(event.keyCode);
    },
    checkMove() {
        if (this.isMoving) return;

        let dx = 0;
        let dy = 0;

        if (this.pressedKeys.has(cc.macro.KEY.w) || this.pressedKeys.has(cc.macro.KEY.up)) {
            dy += 1;
        }
        if (this.pressedKeys.has(cc.macro.KEY.s) || this.pressedKeys.has(cc.macro.KEY.down)) {
            dy -= 1;
        }
        if (this.pressedKeys.has(cc.macro.KEY.a) || this.pressedKeys.has(cc.macro.KEY.left)) {
            dx -= 1;
        }
        if (this.pressedKeys.has(cc.macro.KEY.d) || this.pressedKeys.has(cc.macro.KEY.right)) {
            dx += 1;
        }

        if (dx !== 0 || dy !== 0) {
            this.moveCharacter(dx, dy);
        }
    },
    moveCharacter (dx, dy) {
        const newX = this.listenMoveNode.x + dx * this.mapTileWidth;
        const newY = this.listenMoveNode.y + dy * this.mapTileHeight;

        console.log(newX, newY, '1232131')

        // check if the new position is walkable
        // if (newX < 0 || newX >= this.mapWidth * this.mapTileWidth) return;

        this.isMoving = true;
        const moveAction = cc.moveTo(0.5, newX, newY);
        // const moveAction = cc.moveTo(0.5, newX, newY).easing(cc.easeCubicActionOut());
        const finishCallback = cc.callFunc(() => {
            this.isMoving = false;
            this.checkMove();
        });
        const sequence = cc.sequence(moveAction, finishCallback);
        this.listenMoveNode.runAction(sequence);

    },
});

export default GameController;

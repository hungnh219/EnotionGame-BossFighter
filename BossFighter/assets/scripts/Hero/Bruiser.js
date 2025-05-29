import Character from "../Character";

cc.Class({
    extends: Character,

    properties: {
        characterId: "hero001",
        ultimatePrefab: cc.Prefab
    },

    // LIFE-CYCLE CALLBACKS:

    onLoad () {
        this.initData(this.characterId);

    },

    start () {
    },

    initData(characterNameId) {
        this._super(characterNameId);
    },

    ultimate(targetTile, gameCtrl) {
        // const newPos = targetTile

        const newPosX = gameCtrl.firstTile.x + targetTile.x * gameCtrl.tileWidth + gameCtrl.tileWidth / 2;
        const newPosY = gameCtrl.firstTile.y + targetTile.y * gameCtrl.tileHeight + gameCtrl.tileHeight / 2;

        const oldPosX = this.node.x;
        const oldPosY = this.node.y;

        const oldGridX = Math.floor((oldPosX - gameCtrl.firstTile.x) / gameCtrl.tileWidth);
        const oldGridY = Math.floor((oldPosY - gameCtrl.firstTile.y) / gameCtrl.tileHeight);
        
        const ultimate = cc.instantiate(this.ultimatePrefab);
        ultimate.setPosition(this.node.getPosition());
        this.node.parent.addChild(ultimate);

        this.scheduleOnce(() => {
            this.node.x = newPosX;
            this.node.y = newPosY;

            const ultimate = cc.instantiate(this.ultimatePrefab);
            ultimate.setPosition(this.node.getPosition());
            this.node.parent.addChild(ultimate);
            gameCtrl.updateWalkable(targetTile.x, targetTile.y,1 , false);
            gameCtrl.updateWalkable(oldGridX, oldGridY, 1, true);
        }, 0.5);
        
    }

    // update (dt) {},
});

import GameController from "./GameController";
import GAME_DATA from "./GameData";

cc.Class({
    extends: cc.Component,

    properties: {
        gameMapPageView: cc.PageView,
    },

    // LIFE-CYCLE CALLBACKS:

    onLoad() {
        const gameController = GameController.getInstance();
        if (gameController) {
            this.gameController = gameController;
        } else {
            this.gameController = new GameController();
            cc.game.addPersistRootNode(this.node);
        }

        console.log("gameController", this.gameController);

        const currentMap = this.gameController.getWonMap();
        if (
            typeof currentMap === "number" &&
            this.gameMapPageView &&
            this.gameMapPageView.getPages &&
            this.gameMapPageView.getPages().length > 0
        ) {
            // Clamp index to available pages
            const pageCount = this.gameMapPageView.getPages().length;
            const pageIndex = Math.max(0, Math.min(currentMap, pageCount - 1));
            this.gameMapPageView.scrollToPage(pageIndex, 0.2); // 0.2 seconds for smooth scroll
        }
    },

    start() {
        this.hideLockedMaps();
    },


    hideLockedMaps() {
        const wonIndex = this.gameController.getWonMap();


        // hardcode
        const viewNode = this.gameMapPageView.node.getChildByName("view");
        if (!viewNode || wonIndex == undefined || wonIndex == null || wonIndex < 0) {
            return;
        }

        const contentNode = viewNode.getChildByName("content");
        if (!contentNode) {
            return;
        }

        contentNode.children.forEach((pageNode, index) => {
            if (wonIndex >= index) {
                const lockNode = pageNode.getChildByName("LockMapSprite");
                if (lockNode) {
                    lockNode.active = false;
                }
            }
        });
    },

    // update (dt) {},
    map1Picked() {
        console.log('test', this.gameController.getWonMap())
        if (this.gameController.getWonMap() < GAME_DATA.GAME_MAP_INDEX.MAP_1 || this.gameController.getWonMap() == undefined || this.gameController.getWonMap() == null) return
        console.log("map1Picked");
        this.gameController.setMapPicked(GAME_DATA.GAME_MAP_INDEX.MAP_1);
        cc.director.loadScene(GAME_DATA.GAME_SCENE.HERO_SELECT);
    },

    map2Picked() {
        console.log('test', this.gameController.getWonMap())
        if (this.gameController.getWonMap() < GAME_DATA.GAME_MAP_INDEX.MAP_2 || this.gameController.getWonMap() == undefined || this.gameController.getWonMap() == null) return;
        console.log("map2Picked");
        this.gameController.setMapPicked(GAME_DATA.GAME_MAP_INDEX.MAP_2);
        cc.director.loadScene(GAME_DATA.GAME_SCENE.HERO_SELECT);
    },

    map3Picked() {
        if (this.gameController.getWonMap() < GAME_DATA.GAME_MAP_INDEX.MAP_3 || this.gameController.getWonMap() == undefined || this.gameController.getWonMap() == null) return;
        console.log("map3Picked");
        this.gameController.setMapPicked(GAME_DATA.GAME_MAP_INDEX.MAP_3);
        cc.director.loadScene(GAME_DATA.GAME_SCENE.HERO_SELECT);
    },

    backToMainMenu() {
        console.log("backToMainMenu");
        cc.director.loadScene(GAME_DATA.GAME_SCENE.MAIN_MENU);
    }
});

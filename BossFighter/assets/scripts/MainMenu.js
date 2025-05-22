import GAME_DATA from "./GameData";
import GameController from "./GameController";

cc.Class({
    extends: cc.Component,

    properties: {
        soundOnButton: cc.Button,
        soundOffButton: cc.Button,
    },

    // LIFE-CYCLE CALLBACKS:

    onLoad () {
        const gameController = GameController.getInstance();
        if (gameController) {
            this.gameController = gameController;
        } else {
            this.gameController = new GameController();
            cc.game.addPersistRootNode(this.node);
        }

        let isTurnOnMusic = this.gameController.getTurnOnMusic();

        if (isTurnOnMusic) {
            this.soundOnButton.node.active = true;
            this.soundOffButton.node.active = false;

            cc.audioEngine.setMusicVolume(0.5);
            cc.audioEngine.setEffectsVolume(0.5);

        } else {
            this.soundOnButton.node.active = false;
            this.soundOffButton.node.active = true;

            cc.audioEngine.setMusicVolume(0);
            cc.audioEngine.setEffectsVolume(0);
        }
    },

    start () {

    },

    // update (dt) {},

    playSoloMode() {
        console.log("playSoloMode");
        cc.director.loadScene(GAME_DATA.GAME_SCENE.MAP_SELECT);
    },

    toggleSound() {
        let isPlay = this.gameController.getTurnOnMusic();

        console.log("toggleSound", isPlay);
        if (isPlay) {
            this.soundOnButton.node.active = false;
            this.soundOffButton.node.active = true;

            // cc.audioEngine.setMusicVolume(0);
            // cc.audioEngine.setEffectsVolume(0);
            this.node.getComponent(cc.AudioSource).stop();
            this.gameController.setIsTurnOnMusic(false);
        } else {
            this.soundOnButton.node.active = true;
            this.soundOffButton.node.active = false;

            // this.node.getComponent(cc.AudioSource).play();
            this.node.getComponent(cc.AudioSource).play();
            // cc.audioEngine.setMusicVolume(0.5);
            // cc.audioEngine.setEffectsVolume(0.5);

            this.gameController.setIsTurnOnMusic(true);
        }
    }
});

import GameController from "../Game/GameController";
cc.Class({
    extends: cc.Component,

    properties: {
        slider: cc.Slider,
        musicId: -1,
    },

    onLoad() {
        this.musicId = cc.audioEngine.playMusic(this.yourMusicClip, true);

       
        this.slider.node.on('slide', this.onSliderChanged, this);
        const gameController = GameController.getInstance();
        console.log('MainMenu onLoad', gameController);
        if (gameController) {
            this.gameController = gameController;
        } else {
            this.gameController = new GameController();
            cc.game.addPersistRootNode(this.node);
        }

    },

    onSliderChanged() {
        let volume = this.slider.progress; 
        cc.audioEngine.setMusicVolume(volume);
    },
});

import GAME_DATA from "../Game/GameData";
import GameController from "../Game/GameController";

cc.Class({
    extends: cc.Component,

    properties: {
        settingPanel: cc.Node,
        volumeSlider: cc.Slider,
    },

    onLoad() {
        this.settingPanel.active = false;
        this.gameController = GameController.getInstance() || new GameController();

        if (this.volumeSlider) {
            this.volumeSlider.node.on('slide', this.onSliderChanged, this);
        }

        this.updateUI();
    },

    updateUI() {
        const soundMgr = require("SoundManager").instance;
        if (!soundMgr) return;

        if (this.volumeSlider) this.volumeSlider.progress = soundMgr.currentVolume || 0.5;
    },

    onSliderChanged() {
        const soundMgr = require("SoundManager").instance;
        if (soundMgr) {
            soundMgr.setVolume(this.volumeSlider.progress);
            this.gameController.setIsTurnOnMusic(soundMgr.isPlaying());
            this.updateUI();
        }
    },

    toggleSound() {
        const soundMgr = require("SoundManager").instance;
        if (!soundMgr) return;

        soundMgr.toggleMusic();
        this.gameController.setIsTurnOnMusic(soundMgr.isPlaying());
        this.updateUI();
    },

    showSettingPanel() {
        this.settingPanel.active = true;
    },

    closeSettingPanel() {
        this.settingPanel.active = false;
    },

    playSoloMode() {
        cc.director.loadScene(GAME_DATA.GAME_SCENE.MAP_SELECT);
    },
});

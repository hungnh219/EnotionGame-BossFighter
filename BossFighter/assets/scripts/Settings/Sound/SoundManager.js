const SoundManager = cc.Class({
    extends: cc.Component,

    properties: {
        bgmAudioSource: cc.AudioSource,
        initialVolume: 0.5
    },

    statics: {
        instance: null,
        getInstance: function () {
            if (SoundManager.instance === null) {
                SoundManager.instance = new SoundManager();
                cc.game.addPersistRootNode(this.node);
            }
            return SoundManager.instance;
        },
        destroyInstance: function () {
            if (SoundManager.instance !== null) {
                SoundManager.instance = null;
            }
        },
    },

    onLoad() {

        if (SoundManager.instance === null) {
            SoundManager.instance = this;
            cc.game.addPersistRootNode(this.node);
        } else {
            this.node.destroy();
        }

        this.currentVolume = this.initialVolume;
        this.isMusicOn = true;

        if (this.bgmAudioSource) {
            this.bgmAudioSource.volume = this.currentVolume;
            this.bgmAudioSource.play();
        }
    },

    setVolume(volume) {
        this.currentVolume = Math.min(Math.max(volume, 0), 1);
        if (this.bgmAudioSource) {
            this.bgmAudioSource.volume = this.currentVolume;
            if (this.currentVolume > 0 && !this.bgmAudioSource.isPlaying) {
                this.bgmAudioSource.play();
                this.isMusicOn = true;
            } else if (this.currentVolume === 0 && this.bgmAudioSource.isPlaying) {
                this.bgmAudioSource.pause();
                this.isMusicOn = false;
            }
        }
    },

    toggleMusic() {
        if (!this.bgmAudioSource) return;
        if (this.isMusicOn) {
            this.bgmAudioSource.pause();
            this.isMusicOn = false;
        } else {
            this.bgmAudioSource.play();
            this.isMusicOn = true;
        }
    },

    isPlaying() {
        return this.isMusicOn;
    }
});

// module.exports = SoundManager;

export default SoundManager;

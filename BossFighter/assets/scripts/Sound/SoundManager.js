let instance = null;

cc.Class({
    extends: cc.Component,

    properties: {
        bgmAudioSource: cc.AudioSource,
        sfxAudioSource: cc.AudioSource,
    },

    statics: {
        getInstance() {
            if (!instance) {
                let node = new cc.Node('SoundManager');
                instance = node.addComponent(this);
                cc.game.addPersistRootNode(node);
            }
            return instance;
        }
    },

    onLoad() {
        this.bgmVolume = parseFloat(cc.sys.localStorage.getItem('bgmVolume')) ?? 1;
        this.sfxVolume = parseFloat(cc.sys.localStorage.getItem('sfxVolume')) ?? 1;
        this.bgmMuted = cc.sys.localStorage.getItem('bgmMuted') === 'true' || false;
        this.sfxMuted = cc.sys.localStorage.getItem('sfxMuted') === 'true' || false;

        this.updateAudioStates();
    },

    updateAudioStates() {
        this.bgmAudioSource.volume = this.bgmMuted ? 0 : this.bgmVolume;
        this.sfxAudioSource.volume = this.sfxMuted ? 0 : this.sfxVolume;

        if (this.bgmMuted) {
            this.bgmAudioSource.pause();
        } else {
            if (!this.bgmAudioSource.isPlaying) {
                this.bgmAudioSource.play();
            }
        }
    },

    playBGM(audioClip, loop = true) {
        if (!audioClip) return;
        this.bgmAudioSource.clip = audioClip;
        this.bgmAudioSource.loop = loop;
        this.updateAudioStates();
    },

    stopBGM() {
        this.bgmAudioSource.stop();
    },

    playSFX(audioClip) {
        if (!audioClip) return;
        if (!this.sfxMuted) {
            this.sfxAudioSource.playOneShot(audioClip, this.sfxVolume);
        }
    },

    setBGMVolume(volume) {
        this.bgmVolume = volume;  // Lưu giá trị âm lượng vào biến
        cc.sys.localStorage.setItem('bgmVolume', volume);  // Lưu giá trị vào localStorage

        // Cập nhật âm lượng cho AudioSource
        this.bgmAudioSource.volume = volume;
    }
    ,

    setSFXVolume(volume) {
        this.sfxVolume = volume;
        cc.sys.localStorage.setItem('sfxVolume', volume);
    },

    muteBGM(mute) {
        this.bgmMuted = mute;
        cc.sys.localStorage.setItem('bgmMuted', mute);
        this.updateAudioStates();
    },

    muteSFX(mute) {
        this.sfxMuted = mute;
        cc.sys.localStorage.setItem('sfxMuted', mute);
    },
});

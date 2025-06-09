// Learn cc.Class:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/class.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/life-cycle-callbacks.html
// import Character from "../../Character"
import Character from "../../Character";
import SocketIOManager from "../../../SocketIO/SocketIOManager"
import EventBus from "../../../EventBus/EventBus";

const BOSS1_ANIMATION = {
    "attack_front": "boss1-front-attack",
    "attack_left": "boss1-left-attack",
    "attack_back": "boss1-back-attack",
    "attack_right": "boss1-right-attack",


    "walk_front": "boss1-back-run",
    "walk_back": "boss1-front-run",
    "walk_left": "boss1-left-run",
    "walk_right": "boss1-right-run",
}

cc.Class({
    extends: Character,

    properties: {
        characterId: "boss001",
    },

    // LIFE-CYCLE CALLBACKS:

    onLoad () {
        this.initData(this.characterId);
    },

    start () {
    },

    async initData(characterNameId) {
        await this._super(characterNameId);
    },

    playAnimation(animationName, moveTime) {
        const clipName = BOSS1_ANIMATION[animationName];
        if (!clipName) {
            cc.error("Invalid animation name:", animationName);
            return;
        }
        const imageNode = this.node.getChildByName('Image');
        if (!imageNode) {
            cc.error("Không tìm thấy node con image.");
            return;
        }
        const anim = imageNode.getComponent(cc.Animation);
        if (!anim) {
            cc.error("Node 'image' không có component cc.Animation.");
            return;
        }
        const clip = anim.getClips().find(c => c.name === clipName);
        if (!clip) {
            cc.error("Không tìm thấy animation clip:", clipName);
            return;
        }
        if (moveTime && clip.duration > 0) {
            anim.speed = clip.duration / moveTime;
        } else {
            anim.speed = 1;
        }

        anim.play(clipName);
    }

    // update (dt) {},
});

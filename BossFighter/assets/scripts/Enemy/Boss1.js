const ANIMATION_NAME = {
    IDLE: 'boss1-idle',
    MELEE_ATTACK_1: 'boss1-attack',
    MELEE_ATTACK_2: 'boss1-attack2',
    CAST_SKILL: 'boss1-fly',
    HURT: 'boss1-hurt',
    DEATH: 'boss1-death',

}

import EventBus from "../EventBus"

cc.Class({
    extends: cc.Component,

    properties: {
        maxHp: 100,
        hpBar: cc.ProgressBar,
        normalAttackPower: 10,

        imageSprite: cc.Sprite,
    },

    // LIFE-CYCLE CALLBACKS:

    onLoad() {
        this.hp = this.maxHp;
        this.imageSprite.node.scaleX = 1.5;
        this.imageSprite.node.scaleY = 1.5;
        EventBus.on(EventBus.events.TAKE_DAME, this.takeDamage, this);
    },

    attackAnimation() {
        this.playAnimation(ANIMATION_NAME.MELEE_ATTACK_1, false);
    },

    takeDamage(damage) {
        this.hp -= damage;
        this.hp = Math.max(this.hp, 0);
        if (this.hpBar) {
            this.playAnimation(ANIMATION_NAME.HURT, false);
            this.hpBar.progress = this.hp / this.maxHp;
        }


        if (this.hp <= 0) {
            this.playAnimation(ANIMATION_NAME.DEATH, false);
            this.die();
        }
    },

    getAttackDame() {
        this.attackAnimation();
        return this.normalAttackPower;
    },
    die() {
        this.node.destroy();
    },

    getHp() {
        return this.hp;
    },
    start() {

    },
    playAnimation(animationName, loop = false) {
        if (!this.anim) {
            this.anim = this.imageSprite.node.getComponent(cc.Animation);
        }

        this.anim.play(animationName);

        if (loop) {
            this.anim.once('finished', () => {
                this.playAnimation(animationName);
            });
        }
    }

    // update (dt) {},
});

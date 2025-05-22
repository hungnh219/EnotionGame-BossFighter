const ANIMATION_NAME = {
    IDLE: 'boss1-idle',
    MELEE_ATTACK_1: 'boss1-attack',
    MELEE_ATTACK_2: 'boss1-attack2',
    CAST_SKILL: 'boss1-fly',
    HURT: 'boss1-hurt',
    DEATH: 'boss1-death',

}

cc.Class({
    extends: cc.Component,

    properties: {
        maxHp: 100,
        hpBar: cc.ProgressBar,

        imageSprite: cc.Sprite,
    },

    // LIFE-CYCLE CALLBACKS:

    onLoad() {
        this.hp = this.maxHp;
        this.imageSprite.node.scaleX = 1.5;
        this.imageSprite.node.scaleY = 1.5;
    },

    takeDamage(damage) {
        this.hp -= damage;
        this.hp = Math.max(this.hp, 0);
        if (this.hpBar) {
            console.log("Animation Name HURT:", ANIMATION_NAME.HURT);
            this.playAnimation(ANIMATION_NAME.HURT, false);
            this.hpBar.progress = this.hp / this.maxHp;
        }


        if (this.hp <= 0) {
            this.playAnimation(ANIMATION_NAME.DEATH, false);
            this.die();
        }
    },

    castSkill() {

    },
    die() {
        this.node.destroy();
    },
    attack() {
        // animation skill
        this.playAnimation(ANIMATION_NAME.CAST_SKILL, false);
        return 10; // dame
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

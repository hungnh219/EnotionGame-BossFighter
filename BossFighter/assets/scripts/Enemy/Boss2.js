const ANIMATION_NAME = {
    INTRO: 'boss2-intro',
    MELEE_ATTACK: 'boss2-melee-attack',
    HURT: 'boss2-hurt',
    DEATH: 'boss2-death',
    CAST_SKILL: 'boss2-cast-skill',
}

cc.Class({
    extends: cc.Component,

    properties: {
        maxHp: 100,
        hpBar: cc.ProgressBar,
        normalAttackPower: 10,
        imageSprite: cc.Sprite,
        animations: [cc.Animation]
    },

    // LIFE-CYCLE CALLBACKS:

    onLoad() {
        this.hp = this.maxHp;
        this.imageSprite.node.scaleX = 1.5;
        this.imageSprite.node.scaleY = 1.5;
    },

    attackAnimation() {
        this.playAnimation(ANIMATION_NAME.MELEE_ATTACK, false);
    },

    takeDamage(damage) {
        this.hp -= damage;
        this.hp = Math.max(this.hp, 0);
        if (this.hpBar) this.hpBar.progress = this.hp / this.maxHp;

        if (this.hp <= 0) {
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

const ANIMATION_NAME = {
    IDLE: 'boss1-idle',
    MELEE_ATTACK_1: 'boss1-attack',
    MELEE_ATTACK_2: 'boss1-attack2',
    FLY: 'boss1-fly',
    // DIE: 'boss1-die',
}

cc.Class({
    extends: cc.Component,

    properties: {
        maxHp: 100,
        hpBar: cc.ProgressBar,

        imageSprite: cc.Sprite,
    },

    // LIFE-CYCLE CALLBACKS:

    onLoad () {
        this.hp = this.maxHp;
        this.imageSprite.node.scaleX = 1.5;
        this.imageSprite.node.scaleY = 1.5;
    },

    takeDamage(damage){
        this.hp -= damage;
        this.hp = Math.max(this.hp, 0);
        if(this.hpBar) this.hpBar.progress = this.hp / this.maxHp;

        if(this.hp <= 0){
            this.die();
        }
    },

    castSkill() {

    },
    die(){
        // this.onDestroy.destroy();
    },
    attack() {
        // animation skill
        this.playAnimation(ANIMATION_NAME.FLY, false);
        return 10; // dame
    },
    getHp() {
        return this.hp;
    },
    start () {

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

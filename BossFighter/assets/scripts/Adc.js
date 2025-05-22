// Learn cc.Class:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/class.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/life-cycle-callbacks.html

cc.Class({
    extends: cc.Component,

    properties: {
        role: 'Adc',

        maxHp: 100,
        maxMana: 100,
        moveSpeed: 200,
        attackRange: 200,
        normalAttackPower: 5,
        manaPerAttack: 10,
        imageSprite: cc.Sprite,

        skillCost: 30,
        ultimateCost: 80,
        skillCooldown: 5,
        ultimateCooldown: 12,

        hpBar: cc.ProgressBar,
    },

    // LIFE-CYCLE CALLBACKS:

    onLoad () {
        this.hp = this.maxHp;
    },

    attack() {
        this.attackAnimation();
    },
    attackAnimation() {
        const sprite = this.node.getChildByName('Image')
        const animation = sprite.getComponent(cc.Animation);
        animation.play('bottom-attack');
    },

    moveAnimation(event) {
        const sprite = this.node.getChildByName('Image')
        const animation = sprite.getComponent(cc.Animation);
        if (event === cc.macro.KEY.w) {
            animation.play('adc-top-walk');
        } else if (event === cc.macro.KEY.s) {
            animation.play('adc-bottom-walk');
        } else if (event === cc.macro.KEY.a) {
            animation.play('adc-left-walk');
        } else if (event === cc.macro.KEY.d) {
            animation.play('adc-right-walk');
        } else if (event === cc.macro.KEY.w && event === cc.macro.KEY.a) {
            animation.play('adc-top-left-walk');
        } else if (event === cc.macro.KEY.w && event === cc.macro.KEY.d) {
            animation.play('adc-top-right-walk');
        } else if (event === cc.macro.KEY.s && event === cc.macro.KEY.a) {
            animation.play('adc-bottom-left-walk');
        } else if (event === cc.macro.KEY.s && event === cc.macro.KEY.d) {
            animation.play('adc-bottom-right-walk');
        } else {
            animation.stop();
        }
    },

    skillAnimation() {
        const sprite = this.node.getChildByName('Image')
        const animation = sprite.getComponent(cc.Animation);
        animation.play('bottom-skill');
    },

    affectDamage() {
        return this.normalAttackPower * 3;
    },

    takeDamage(damage) {
        console.log('tanker takeDamage', damage);
        this.hp -= damage;
        this.hp = Math.max(this.hp, 0);
        if (this.hpBar) this.hpBar.progress = this.hp / this.maxHp;

        if (this.hp <= 0) {
            console.log('tanker die');
        }
    },

    die(){
        this.onDestroy.destroy();
    },

    getCurrentHp() {
        return this.hp;
    },

    getAttackRange() {
        return this.attackRange;
    },

    getCharacterInfo() {
        return {
            name: this.node.name,
            description: 'hihi hehe',
            imageSprite: this.imageSprite,
            health: this.maxHp,
            mana: this.maxMana,
            attackRange: this.attackRange,
            role: this.role,
        }
    },

    start () {

    },

    // update (dt) {},
});

// Learn cc.Class:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/class.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/life-cycle-callbacks.html

cc.Class({
    extends: cc.Component,

    properties: {
        role: 'Tanker',

        maxHp: 100,
        maxMana: 100,
        moveSpeed: 200,
        attackRange: 150,
        normalAttackPower: 10,
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
        // const sprite = this.node.getChildByName('Image')
        // const animation = sprite.getComponent(cc.Animation);
        // if (animation) {
        //     const intervalId = setInterval(() => {
        //         animation.play('bottom-attack'); 
        //     }, 1000); 
        // }
        this.hp = this.maxHp;
    },

    start () {

    },

    attackAnimation() {
        const sprite = this.node.getChildByName('Image')
        const animation = sprite.getComponent(cc.Animation);
        animation.play('bottom-attack'); 
    },

    moveAnimation(event) {
        const sprite = this.node.getChildByName('Image')
        const animation = sprite.getComponent(cc.Animation);
        console.log('moveAnimation', event);
        if (event === cc.macro.KEY.w) {
            animation.play('top-walk');
        } else if (event === cc.macro.KEY.s) {
            animation.play('bottom-walk');
        } else if (event === cc.macro.KEY.a) {
            animation.play('left-walk');
        } else if (event === cc.macro.KEY.d) {
            animation.play('right-walk');
        }
    },

    skillAnimation(){
        const sprite = this.node.getChildByName('Image')
        const animation = sprite.getComponent(cc.Animation);
        animation.play('bottom-skill');
    },

    affectDamage() {
        return this.normalAttackPower * 2;
    },

    takeDamage(damage) {
        console.log('tanker takeDamage', damage);
        this.hp -= damage;
        this.hp = Math.max(this.hp, 0);
        if (this.hpBar) this.hpBar.progress = this.hp / this.maxHp;

        if (this.hp <= 0) {
            // this.die();
        }
    },
    getCurrentHp() {
        return this.hp;
    },

    die() {
        this.onDestroy.destroy();
        // console.log('die');
        // const sprite = this.node.getChildByName('Image')
        // const animation = sprite.getComponent(cc.Animation);
        // animation.play('bottom-die'); 
    },

    // update (dt) {},
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
    }
});

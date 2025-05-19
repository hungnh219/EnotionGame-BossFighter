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
        manaBar: cc.ProgressBar,
    },

    // LIFE-CYCLE CALLBACKS:

    onLoad () {
        const sprite = this.node.getChildByName('Image')
        const animation = sprite.getComponent(cc.Animation);
        this.setInte
        if (animation) {
            const intervalId = setInterval(() => {
                animation.play('bottom-attack'); 
            }, 1000); 
        }
    },

    start () {

    },

    normalAttach() {
        const sprite = this.node.getChildByName('Sprite')
        const animation = sprite.getComponent(cc.Animation);
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

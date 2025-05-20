// Learn cc.Class:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/class.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/life-cycle-callbacks.html

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

    die(){
        // this.onDestroy.destroy();
    },
    attack() {

    },
    getHp() {
        return this.hp;
    },
    start () {

    },

    // update (dt) {},
});

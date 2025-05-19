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

    onLoad() {
        this.hp = this.maxHp;
        this.registerEnemy();
    },

    registerEnemy() {
        if (!window.enemyList) window.enemyList = [];
        window.enemyList.push(this);
    },

    onDestroy() {
        if (window.enemyList) {
            const index = window.enemyList.indexOf(this);
            if(index !== -1){
                window.enemyList.splice(index, 1);
            }
        }
    },

    takeDamage(amount){
        this.hp -= amount;
        this.hp = Math.max(this.hp, 0);
        if(this.hpBar) this.hpBar.progress = this.hp / this.maxHp;

        if(this.hp <= 0){
            this.die();
        }
    },

    die(){
        this.onDestroy.destroy();
    },

    start() {

    },

    // update (dt) {},
    attack() {

    },
    getCharacterInfo() {
        return {
            name: this.node.name,
            description: 'hihi hehe',
            imageSprite: this.imageSprite,
        }
    }
});
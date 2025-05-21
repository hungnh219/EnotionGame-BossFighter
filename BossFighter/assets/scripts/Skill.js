// Learn cc.Class:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/class.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/life-cycle-callbacks.html

cc.Class({
    extends: cc.Component,

    properties: {
        damage: 10,
    },

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {},

    onCollisionEnter: function (other, self) {
        console.log('Chiêu va chạm với:', other.node.name);

        if (other.node.getComponent('Boss')) {
            other.node.getComponent('Boss').takeDamage(this.damage);
        }

        this.node.destroy();
    },

    onCollisionStay: function (other, self) {
        console.log('on collision stay');
    },

    onCollisionExit: function (other, self) {
        console.log('on collision exit');
    },

    start () {

    },

    update(dt) {
        this.node.x += 300 * dt;  
    }
});

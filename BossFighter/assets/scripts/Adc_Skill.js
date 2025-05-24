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

    direction: null,

    initDirection(targetPos) {
        // Tính vector hướng từ skill đến boss
        const from = this.node.getPosition();
        const to = targetPos;
        const dir = cc.v2(to.x - from.x, to.y - from.y).normalize();
        this.direction = dir;
    },

    onCollisionEnter: function (other, self) {
        // console.log('Chiêu va chạm với:', other.node.name);

        if (other.node.getComponent('Boss')) {
            // console.log('Chiêu va chạm với boss:', other.node.name);
            // other.node.getComponent('Boss1').takeDamage(this.damage);
        }else if (other.node.getComponent('Boss2')) {
            console.log('Chiêu va chạm với boss:', other.node.name);
            // other.node.getComponent('Boss2').takeDamage(this.damage);
        }
        else if (other.node.getComponent('Boss3')) {
            console.log('Chiêu va chạm với boss:', other.node.name);
            // other.node.getComponent('Boss3').takeDamage(this.damage);
        }

        this.node.destroy();
    },

    onCollisionStay: function (other, self) {
        console.log('on collision stay');
    },

    onCollisionExit: function (other, self) {
        console.log('on collision exit');
    },

    start() {

    },

    update(dt) {
        if (this.direction) {
            // Di chuyển theo hướng đã tính
            this.node.x += this.direction.x * 300 * dt;
            this.node.y += this.direction.y * 300 * dt;
        } else {
            // Nếu chưa có hướng thì mặc định bắn lên trên
            this.node.y += 300 * dt;
        }
    }
});

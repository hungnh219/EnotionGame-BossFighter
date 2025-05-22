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

        if (other.node.getComponent('Boss1')) {
            other.node.getComponent('Boss1').takeDamage(this.damage);
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

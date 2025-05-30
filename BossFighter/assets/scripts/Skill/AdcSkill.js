// Learn cc.Class:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/class.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/life-cycle-callbacks.html

cc.Class({
    extends: cc.Component,

    properties: {
        // damage: 10,
    },

    // LIFE-CYCLE CALLBACKS:

    onLoad() {
        this.direction = null; // Khởi tạo biến direction

        // this.initDirection
    },

    // direction: null,

    initDirection(targetPos, dame) {
        this.damage = dame;
        // Tính vector hướng từ skill đến boss
        const from = this.node.getPosition();
        console.log('vi tri tuong', from.x, from.y)
        const to = targetPos;
        console.log('vi tri boss', to.x, to.y)
        const dir = cc.v2(to.x - from.x, to.y - from.y).normalize();
        this.direction = dir;

        const angle = Math.atan2(dir.y, dir.x) * 180 / Math.PI;
        this.node.angle = angle;
        console.log('Direction initialized:', this.direction);
    },

    onCollisionEnter: function (other, self) {
        console.log('other', other)
        other.mainScript = other.node.getComponents(cc.Component).find(c => typeof c.takeDame === 'function');

        if (other.mainScript) {
            other.mainScript.takeDame(this.damage);
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

        // this.node.size
        // incease size of the skill by 0.1 each frame
        this.node.width += 0.5;
        this.node.height += 0.5;
    }
});

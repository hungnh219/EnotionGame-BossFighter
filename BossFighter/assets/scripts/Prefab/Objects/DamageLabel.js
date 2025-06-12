cc.Class({
    extends: cc.Component,

    properties: {
        label: cc.Label,
    },

    onLoad() {
        cc.tween(this.node)
            .by(0.8, { position: cc.v2(0, 50), opacity: -255 })
            .call(() => this.node.destroy())
            .start();
    },

    setDamage(value) {
        this.label.string = '-' + value;
    }
});

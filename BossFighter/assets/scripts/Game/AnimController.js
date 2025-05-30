const ANIM_MAP = {
    'idle': 'Idle',
    'walk': {
        'front': 'walk_front',
        'back': 'walk_back',
        'left': 'walk_left',
        'right': 'walk_right',
    }, 
    'attack': {
        'front': 'attack_front',
        'back': 'attack_back',
        'left': 'attack_left',
        'right': 'attack_right',
    }
}

cc.Class({
    extends: cc.Component,

    properties: {
        // foo: {
        //     // ATTRIBUTES:
        //     default: null,        // The default value will be used only when the component attaching
        //                           // to a node for the first time
        //     type: cc.SpriteFrame, // optional, default is typeof default
        //     serializable: true,   // optional, default is true
        // },
        // bar: {
        //     get () {
        //         return this._bar;
        //     },
        //     set (value) {
        //         this._bar = value;
        //     }
        // },
    },

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {},

    start () {

    },

    playAnimation(node, actionName, direction) {
        node.mainScript = node.getComponents(cc.Component).find(c => typeof c.playAnimation === 'function');
        if (!node.mainScript) {
            cc.error("Node does not have a main script with playAnimation method");
            return;
        }

        let animationName = ANIM_MAP[actionName][direction];
        if (!animationName) {
            cc.error("Invalid action name or direction:", actionName, direction);
            return;
        }

        node.mainScript.playAnimation(animationName, 0.4);
    },
    // update (dt) {},
});

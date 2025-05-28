import Character from "../Character";

cc.Class({
    extends: Character,

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
        ultimatePrefab: cc.Prefab,
    },

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {},

    start () {

    },

    ultimate(enemy) {
        if (this.ultimatePrefab) {
            const ultimate = cc.instantiate(this.ultimatePrefab);
            ultimate.setPosition(this.node.getPosition());
            this.node.parent.addChild(ultimate);
            ultimate.mainScript = ultimate.getComponents(cc.Component).find(c => typeof c.initDirection === 'function');

            if (ultimate.mainScript) {
                ultimate.mainScript.initDirection(enemy);
            }
        } else {
            cc.error("Ultimate prefab is not set for ADC.");
        }
    }

    // update (dt) {},
});

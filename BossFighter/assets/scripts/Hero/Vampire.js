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
        damage: 50, // Damage dealt by the ultimate skill
        range: 1, // Range of the ultimate skill
        ultimatePrefab: cc.Prefab, // Prefab for the ultimate skill effect
    },

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {},

    start () {

    },

    ultimate(centerGridPos, dealDameAoeCallback, spawnAnimationCallback) {
        console.log('Vampire ultimate skill used at position:', centerGridPos);
        const affactedTile = [];
        for (let i = -this.range; i <= this.range; i++) {
            for (let j = -this.range; j <= this.range; j++) {
                // const tilePos = cc.v2(centerGridPos.x + i, centerGridPos.y + j);
                const tile = {
                    x: centerGridPos.x + i,
                    y: centerGridPos.y + j
                }
                affactedTile.push(tile);
                let times = (i == 0 && j == 0) ? 5 : 3;

                spawnAnimationCallback(this.ultimatePrefab ,tile, times, this.damage);
            }
        }
        dealDameAoeCallback(affactedTile, this.damage);
    }

    // update (dt) {},
});

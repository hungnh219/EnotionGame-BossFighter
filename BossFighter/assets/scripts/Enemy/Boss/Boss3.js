// Learn cc.Class:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/class.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/life-cycle-callbacks.html
import Character from "../../Character";

cc.Class({
    extends: Character,

    properties: {
        characterId: "boss003",

    },

    // LIFE-CYCLE CALLBACKS:

    onLoad () {
        // this.initData(this.characterId);
    },

    start () {
        this.initData(this.characterId);
    },

    initData(characterNameId) {
        this._super(characterNameId);
        console.log("Boss3 initData with characterId:", characterNameId);
    },

    // handle collision with skills
    // onCollisionEnter: function (other, self) {
    //     console.log('Boss3 collided with:', other.node.name);
        
    //     // Check if the other node has a skill component
    //     if (other.node.getComponent('AdcSkill')) {
    //         console.log('Boss3 hit by ADC skill:', other.node.name);
    //         // Call takeDamage on the boss with the skill's damage
    //         this.takeDamage(other.node.getComponent('AdcSkill').damage);
    //     }
    // }

    // update (dt) {},
});

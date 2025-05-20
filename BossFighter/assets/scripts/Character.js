// Learn cc.Class:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/class.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/life-cycle-callbacks.html

cc.Class({
    extends: cc.Component,

    properties: {
        role: 'Fighter',

        maxHp: 100,
        maxMana: 100,
        moveSpeed: 200,
        attackRange: 100,
        normalAttackPower: 10,
        manaPerAttack: 10,
        imageSprite: cc.Sprite,

        skillCost: 30,
        ultimateCost: 80,
        skillCooldown: 5,
        ultimateCooldown: 12,

        hpBar: cc.ProgressBar,
    },

    // LIFE-CYCLE CALLBACKS:

    onLoad() {
        this.hp = this.maxHp;
        this.mana = 0;
        this.skillReady = true;
        this.ultimateReady = true;

        this.keyboardInput = {};
        this.initInput();
    },

    initInput() {
        cc.systemEvent.on(cc.SystemEvent.EventType.KEY_DOWN, e => this.keyboardInput[e.keyCode] = true, this);
        cc.systemEvent.on(cc.SystemEvent.EventType.KEY_UP, e => this.keyboardInput[e.keyCode] = false, this);
    },

    start() {
        console.log('Initial position:', this.node.position);

    },

    // update(dt) {
    //     let dir = cc.v2(0, 0);
    //     console.log('this.keyboardInput', this.keyboardInput);
    //     if (this.keyboardInput[cc.macro.KEY.w]) dir.y += 1;
    //     if (this.keyboardInput[cc.macro.KEY.s]) dir.y -= 1;
    //     if (this.keyboardInput[cc.macro.KEY.a]) dir.x -= 1;
    //     if (this.keyboardInput[cc.macro.KEY.d]) dir.x += 1;

    //     const sprite = this.node.getChildByName('Sprite')
    //     const animation = sprite.getComponent(cc.Animation);

    //     if (dir.mag() == 0) {
    //         if (this.currentAnimation !== 'Intro') {
    //             animation.play('Intro');
    //             this.currentAnimation = 'Intro'
    //         }
    //         return;
    //     }

    //     dir = dir.normalizeSelf();

    //     let animName = '';

    //     const angle = Math.atan2(dir.y, dir.x) * 180 / Math.PI; // độ

    //     if (angle >= -22.5 && angle < 22.5) {
    //         animName = 'right-walk';
    //     } else if (angle >= 22.5 && angle < 67.5) {
    //         animName = 'top-right-walk';
    //     } else if (angle >= 67.5 && angle < 112.5) {
    //         animName = 'top-walk';
    //     } else if (angle >= 112.5 && angle < 157.5) {
    //         animName = 'top-left-walk';
    //     } else if (angle >= 157.5 || angle < -157.5) {
    //         animName = 'left-walk';
    //     } else if (angle >= -157.5 && angle < -112.5) {
    //         animName = 'bottom-left';
    //     } else if (angle >= -112.5 && angle < -67.5) {
    //         animName = 'bottom-walk';
    //     } else if (angle >= -67.5 && angle < -22.5) {
    //         animName = 'bottom-right';
    //     }

    //     if (this.currentAnimation !== animName) {
    //         animation.play(animName);
    //         this.currentAnimation = animName;
    //     }

    //     this.move(dir, dt);
    //     this.updateBars();
    // },

    updateBars() {
        if (this.hpBar) this.hpBar.progress = this.hp / this.maxHp;
        if (this.manaBar) this.manaBar.progress = this.mana / this.maxMana;
    },

    move(dir, dt) {
        console.log('dir', dir)
        let nextPos = this.node.position.add(dir.mul(this.moveSpeed * dt));
        console.log('nextPos:', nextPos);
        console.log('canMoveTo:', this.canMoveTo(nextPos));
        if (this.canMoveTo(nextPos)) {
            this.node.setPosition(nextPos);
        }
    },

    canMoveTo(pos) {
        const canvas = cc.find("Canvas");
        const size = canvas.getContentSize();

        const halfWidth = size.width / 2;
        const halfHeight = size.height / 2;

        const minX = -halfWidth;
        const maxX = halfWidth;
        const minY = -halfHeight;
        const maxY = halfHeight;

        if (pos.x < minX || pos.x > maxX || pos.y < minY || pos.y > maxY) return false;

        for (let enemy of enemyList) {
            if (!enemy || !enemy.node) continue;
            if (enemy.node.getBoundingBox().contains(pos)) return false;
        }
        return true;
    },

    rotateTo(targetPos) {
        const dir = targetPos.sub(this.node.position);
        const angle = Math.atan2(dir.y, dir.x) * 180 / Math.PI;
        this.node.angle = -angle;
    },

    normalAttach(target) {
        if (!target) return;

        this.rotateTo(target.position);
        target.getComponent('Enemy').takeDamage(this.normalAttachPower);

        this.mana = Math.min(this.mana + this.manaPerAttack, this.maxMana);
    },

    castSkill(target) {
        if (!this.skillReady || this.name < this.skillCost) return;

        this.skillReady = false;
        this.mana -= this.skillCost;

        this.createSkillEffect(target);

        this.scheduleOnce(() => {
            this.skillReady = true;
        }, this.skillCooldown);
    },

    createSkillEffect(target) {
        console.log(`${this.role} dùng kỹ năng lên ${target.name}`);
    },

    castUltimate(target) {
        if (!this.ultimateReady || this.name < this.ultimateCost) return;

        this.ultimateReady = false;
        this.mana -= this.ultimateCost;

        this.createUltimateEffect(target);

        this.scheduleOnce(() => {
            this.ultimateReady = true;
        }, this.ultimateCooldown);
    },

    createUltimateEffect(target) {
        switch (this.role) {
            case 'Tank':
                this.hp = Math.min(this.hp + 50, this.maxHp);
                this.hp += 50;
                break;
            case 'Fighter':
                target.getComponent('Enemy').takeDamage(40);
                break;
            case 'Support':
                this.hp = Math.min(this.hp + 20, this.maxHp);
                this.mana = Math.min(this.mana + 30, this.maxMana);
                break;
            case 'Mage':
                target.getComponent('Enemy').takeDamage(50);
                break;
            case 'ADC':
                target.getComponent('Enemy')?.takeDamage(60);
                break;
        }
    },

    attack() {

    },

    takeDamage(damage) {
        console.log('takeDamage', damage);
        this.hp -= damage;
        this.hp = Math.max(this.hp, 0);
        if (this.hpBar) this.hpBar.progress = this.hp / this.maxHp;

        if (this.hp <= 0) {
            // this.die();
        }
    },
    die() {
        // this.onDestroy.destroy();
    },

    getCurrentHp() {
        return this.hp;
    },
    getAttackRange() {
        return this.attackRange;
    },
    getCharacterInfo() {
        return {
            name: this.node.name,
            description: 'hihi hehe',
            imageSprite: this.imageSprite,
            health: this.maxHp,
            mana: this.maxMana,
            attackRange: this.attackRange,
            role: this.role,
        }
    }
});
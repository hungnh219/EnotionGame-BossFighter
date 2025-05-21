import GameScene from "./GameScene";

const GameController = cc.Class({
    extends: cc.Component,

    statics: {
        instance: null,
        getInstance: function () {
            if (GameController.instance === null) {
                GameController.instance = new GameController();
            }
            return GameController.instance;
        },
        destroyInstance: function () {
            if (GameController.instance !== null) {
                GameController.instance = null;
            }
        },
    },

    properties: {

    },

    // LIFE-CYCLE CALLBACKS:

    onLoad() {
        if (GameController.instance === null) {
            GameController.instance = this;
            cc.game.addPersistRootNode(this.node);
        } else {
            this.node.destroy();
        }

        // variables
        this.mapPick = null;
        this.heroPick = [];
        this.selectedHeroPrefabs = [];
        this.listenMoveNode = null;

        this.focusedHero = null;
        this.heros = []; // hero in game
        this.gridMap = [];
        this.winner = null; // 'boss', 'player'
    },

    start() {
    },

    // update (dt) {},
    testChangeScene() {
        console.log("testChangeScene");
        cc.director.loadScene("map");
    },

    testPrintScene(word) {
        console.log("testPrintScene", word);
        cc.director.getScene().name;
    },

    getEditBoxValue(string) {
        console.log("getEditBoxValue", string);
        this.editBoxString = string;
    },

    printEditBoxValue() {
        console.log("printEditBoxValue", this.editBoxString);
    },

    setMapPicked(mapPick) {
        this.mapPick = mapPick;
    },

    getMapPicked() {
        return this.mapPick;
    },

    setHeroPick(heroPick) {
        this.heroPick = heroPick;
    },

    getHeroPick() {
        return this.heroPick;
    },

    /* select hero */
    addSelectedHeroPrefab(prefab) {
        if (!this.selectedHeroPrefabs) this.selectedHeroPrefabs = [];
        console.log(this.selectedHeroPrefabs)
        this.selectedHeroPrefabs.push(prefab);
    },

    getHeroPrefabs() {
        return this.selectedHeroPrefabs;
    },

    setTileSize(tileWidth, tileHeight) {
        this.mapTileWidth = tileWidth;
        this.mapTileHeight = tileHeight;
    },

    listenKeyDown(listenNode) {
        if (this.mapTileWidth == undefined) {
            this.mapTileWidth = 64;
        }

        if (this.mapTileHeight == undefined) {
            this.mapTileHeight = 64;
        }
        this.listenMoveNode = listenNode;
        this.pressedKeys = new Set();
        cc.systemEvent.on(cc.SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);
        cc.systemEvent.on(cc.SystemEvent.EventType.KEY_UP, this.onKeyUp, this);
    },
    onKeyDown(event) {
        this.pressedKeys.add(event.keyCode);

        // delay to wait set of keys down
        this.scheduleOnce(() => {
            this.checkMove();
        }, 0.1);
    },
    onKeyUp(event) {
        this.pressedKeys.delete(event.keyCode);
    },
    checkMove() {
        if (this.isMoving) return;
        if (this.heros.length == 0) return;

        let dx = 0;
        let dy = 0;

        if (this.pressedKeys.has(cc.macro.KEY.w) || this.pressedKeys.has(cc.macro.KEY.up)) {
            dy += 1;
        }
        if (this.pressedKeys.has(cc.macro.KEY.s) || this.pressedKeys.has(cc.macro.KEY.down)) {
            dy -= 1;
        }
        if (this.pressedKeys.has(cc.macro.KEY.a) || this.pressedKeys.has(cc.macro.KEY.left)) {
            dx -= 1;
        }
        if (this.pressedKeys.has(cc.macro.KEY.d) || this.pressedKeys.has(cc.macro.KEY.right)) {
            dx += 1;
        }

        if (dx !== 0 || dy !== 0) {
            this.moveCharacter(dx, dy);
        }
    },
    moveCharacter(dx, dy) {
        const newX = this.listenMoveNode.x + dx * this.mapTileWidth;
        const newY = this.listenMoveNode.y + dy * this.mapTileHeight;

        // check if the new position is walkable use newX, newY, firstCellPos and lastCellPos
        if (newX < this.firstCellPos.x || newX > this.lastCellPos.x || newY < this.firstCellPos.y || newY > this.lastCellPos.y) {
            return;
        }

        // check if the new position is walkable
        const gridX = Math.floor((newX - this.firstCellPos.x) / this.mapTileWidth);
        const gridY = Math.floor((newY - this.firstCellPos.y) / this.mapTileHeight);
        if (this.gridMap[gridX][gridY] == false) {
            return;
        }

        // move the character
        this.isMoving = true;
        const moveAction = cc.moveTo(0.5, newX, newY);
        // const moveAction = cc.moveTo(0.5, newX, newY).easing(cc.easeCubicActionOut());
        const finishCallback = cc.callFunc(() => {
            this.isMoving = false;
            this.checkMove();
        });
        const sequence = cc.sequence(moveAction, finishCallback);
        this.listenMoveNode.runAction(sequence);

        // set old position to walkable and new position to not walkable
        const oldGridX = Math.floor((this.listenMoveNode.x - this.firstCellPos.x) / this.mapTileWidth);
        const oldGridY = Math.floor((this.listenMoveNode.y - this.firstCellPos.y) / this.mapTileHeight);
        if (this.gridMap[oldGridX][oldGridY] !== undefined) {
            this.gridMap[oldGridX][oldGridY] = true;
            this.gridMap[gridX][gridY] = false;
        }
    },


    /* game scene */
    setFocusedHero(heroIndex) {
        this.focusedHero = this.heros[heroIndex];
        this.listenKeyDown(this.focusedHero);
        // set the other heroes scale to 1
        for (let i = 0; i < this.heros.length; i++) {
            if (i == heroIndex) {
                this.heros[i].scale = 1.5;
            } else {
                this.heros[i].scale = 1;
            }
        }
    },
    getFocusedHero() {
        return this.focusedHero;
    },

    addHero(hero) {
        if (this.heros == undefined) this.heros = [];
        this.heros.push(hero);
    },
    addBoss(boss) {
        this.boss = boss;
    },
    heroAttack() {
        if (this.checkAttackRangeHero(this.focusedHero) && this.focusedHero) {
            const hero = this.getFocusedHero();
            hero.mainScript = hero.getComponents(cc.Component).find(c => typeof c.attackAnimation === 'function');
            if (hero.mainScript) {
                hero.mainScript.attackAnimation();

                this.boss.mainScript = this.boss.getComponents(cc.Component).find(c => typeof c.takeDamage === 'function');
                if (this.boss.mainScript) {
                    this.boss.mainScript.takeDamage(10);

                    // boss die
                    if (this.boss.mainScript.getHp() == 0) {
                        // player win
                        this.winner = 'player';
                    }
                } else {
                    console.log('no takeDamage function');
                }

            } else {
                console.log('no attack function');
            }
        }
    },
    checkAttackRangeHero(hero) {
        let boss = this.boss;

        const distance = cc.v2(boss.x - hero.x, boss.y - hero.y).mag();
        hero.mainScript = hero.getComponents(cc.Component).find(c => typeof c.attack === 'function');

        if (distance <= hero.mainScript.getAttackRange()) {
            return true;
        }

        return false;
    },


    heroMoveAnimation(event) {
        if (this.focusedHero) {
            const hero = this.getFocusedHero();
            hero.mainScript = hero.getComponents(cc.Component).find(c => typeof c.skillAnimation === 'function');
            if (hero.mainScript) {
                // if(event.keyCode == cc.macro.KEY.w){
                //     hero.mainScript.moveAnimation(event.keyCode);
                // }
                hero.mainScript.moveAnimation(event.keyCode);
            }

        }
    },

    heroSkill() {
        if (this.focusedHero) {
            const hero = this.getFocusedHero();
            hero.mainScript = hero.getComponents(cc.Component).find(c => typeof c.skillAnimation === 'function');
            if (hero.mainScript) {
                hero.mainScript.skillAnimation();
                this.boss.mainScript = this.boss.getComponents(cc.Component).find(c => typeof c.takeDamage === 'function');
                if (this.boss.mainScript) {
                    const damage = hero.mainScript.affectDamage();
                    this.boss.mainScript.takeDamage(damage);
                } else {
                    console.log('no takeDamage function');
                }

            } else {
                console.log('no skill function');
            }
        }
    },

    updateWalkable(x, y, walkable) {
        if (!this.gridMap) this.gridMap = [];
        if (this.gridMap[x] == undefined) {
            this.gridMap[x] = [];
        }

        this.gridMap[x][y] = walkable;

    },

    setCellPosition(firstCellPos, lastCellPos) {
        this.firstCellPos = firstCellPos;
        this.lastCellPos = lastCellPos;
    },

    getBoss() {
        return this.boss;
    },

    // boss attack nearest hero
    bossAttack() {
        // calculate the distance between the boss and the heroes, take the nearest hero
        const boss = this.boss;
        const heroes = this.heros;
        let nearestHero = null;
        let minDistance = Infinity;

        for (let i = 0; i < heroes.length; i++) {
            const hero = heroes[i];
            const distance = cc.v2(boss.x - hero.x, boss.y - hero.y).mag();

            if (distance < minDistance) {
                minDistance = distance;
                nearestHero = hero;
            }
        }

        if (nearestHero) {
            // attack the nearest hero
            boss.mainScript = boss.getComponents(cc.Component).find(c => typeof c.attack === 'function');
            if (boss.mainScript) {
                boss.mainScript.attack();

                nearestHero.mainScript = nearestHero.getComponents(cc.Component).find(c => typeof c.takeDamage === 'function');
                if (nearestHero.mainScript) {
                    nearestHero.mainScript.takeDamage(20);

                    if (nearestHero.mainScript.getCurrentHp() <= 0) {
                        // remove hero from the list
                        this.heros.splice(this.heros.indexOf(nearestHero), 1);
                        this.focusedHero.scale = 1;

                        // this.focusedHero = this.heros[0]
                        // console.log('focus hero', this.focusedHero);
                        this.setFocusedHero(0);

                        if (this.heros.length == 0) {
                            this.winner = 'boss';

                            return;
                        }

                    }
                } else {
                    console.log('no takeDamage function');
                }
            } else {
                console.log('no attack function');
            }
        }

    },

    // moveBossToNearestHero() {
    //     if (!this.boss || this.heros.length === 0) return;

    //     let bossPos = cc.v2(this.boss.x, this.boss.y);
    //     let nearestHero = null;
    //     let minDistance = Infinity;

    //     // find the nearest hero
    //     for (let hero of this.heros) {
    //         let heroPos = cc.v2(hero.x, hero.y);
    //         let distance = bossPos.sub(heroPos).mag();
    //         if (distance < minDistance) {
    //             minDistance = distance;
    //             nearestHero = hero;
    //         }
    //     }

    //     if (!nearestHero) return;

    //     let heroPos = cc.v2(nearestHero.x, nearestHero.y);
    //     let direction = heroPos.sub(bossPos).normalize();

    //     console.log('boss pos', bossPos);
    //     console.log('hero pos', heroPos);
    //     console.log('boss move to hero', direction);
    //     // calculate the step size based on the direction
    //     let stepX = direction.x * this.mapTileWidth;
    //     let stepY = direction.y * this.mapTileHeight;
    //     console.log('map tile', this.mapTileWidth, this.mapTileHeight);
    //     console.log('step', stepX, stepY);

    //     // move the boss to the new position
    //     let newX = bossPos.x + stepX;
    //     let newY = bossPos.y + stepY;

    //     let moveAction = cc.moveTo(0.5, newX, newY);
    //     this.boss.runAction(moveAction);
    // },


    moveCharacterBot(heroBot, dx, dy) {
        // if (!heroBot || heroBot.isMoving) return false;  

        const newX = heroBot.x + dx * this.mapTileWidth;
        const newY = heroBot.y + dy * this.mapTileHeight;

        if (newX < this.firstCellPos.x || newX > this.lastCellPos.x || newY < this.firstCellPos.y || newY > this.lastCellPos.y) {
            return false;
        }

        const gridX = Math.floor((newX - this.firstCellPos.x) / this.mapTileWidth);
        const gridY = Math.floor((newY - this.firstCellPos.y) / this.mapTileHeight);

        if (!this.gridMap[gridX] || !this.gridMap[gridX][gridY] || this.gridMap[gridX][gridY] === false) {
            return false;
        }

        // move the character
        heroBot.isMoving = true;

        const oldGridX = Math.floor((heroBot.x - this.firstCellPos.x) / this.mapTileWidth);
        const oldGridY = Math.floor((heroBot.y - this.firstCellPos.y) / this.mapTileHeight);

        const moveAction = cc.moveTo(0.5, newX, newY);
        const finishCallback = cc.callFunc(() => {
            heroBot.isMoving = false;
            this.gridMap[oldGridX][oldGridY] = true;
            this.gridMap[gridX][gridY] = false;
        });

        const sequence = cc.sequence(moveAction, finishCallback);
        heroBot.runAction(sequence);

        return true;
    },

    moveHeroNotFocusesToBoss() {
        if (!this.boss || this.heros.length === 0) return;

        let bossPos = cc.v2(this.boss.x, this.boss.y);

        this.heros.forEach((hero, index) => {
            if (hero === this.focusedHero) return;
            if (hero.isMoving) return;

            let heroPos = cc.v2(hero.x, hero.y);
            let dx = 0;
            let dy = 0;

            const diffX = bossPos.x - heroPos.x;
            const diffY = bossPos.y - heroPos.y;

            if (Math.abs(diffX) > Math.abs(diffY)) {
                dx = diffX > 0 ? 1 : -1;
            } else if (diffY !== 0) {
                dy = diffY > 0 ? 1 : -1;
            }
            console.log('move hero with index', hero.name, index, dx, dy);
            this.moveCharacterBot(hero, dx, dy);
        });
    },

    nonFocusedHeroesAttackBoss() {
        if (!this.boss || this.heros.length === 0) return;

        this.heros.forEach(hero => {
            if (hero === this.focusedHero) return;

            let heroScript = hero.getComponents(cc.Component).find(c => typeof c.attackAnimation === 'function');
            if (!heroScript) {
                console.log('Hero không có hàm attackAnimation');
                return;
            }

            if (this.checkAttackRangeHero(hero)) {
                heroScript.attackAnimation();

                let bossScript = this.boss.getComponents(cc.Component).find(c => typeof c.takeDamage === 'function');
                if (bossScript) {
                    bossScript.takeDamage(2);

                    if (bossScript.getHp() <= 0) {
                        this.winner = 'player';
                    }
                } else {
                    console.log('Boss không có hàm takeDamage');
                }
            }
        });
    },


    getWinner() {
        if (this.winner != undefined) {
            return this.winner;
        }
    },

    getNumberOfHero() {
        return this.heros.length;
    },


    /* game system */
    newGame() {
        // reset varialbe
        this.heros = [];
        // this.focusedHero = null;
        // this.selectedHeroPrefabs = [];
    }
});

export default GameController;

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

    onLoad () {
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

    start () {

    },

    // update (dt) {},
    testChangeScene () {
        console.log("testChangeScene");
        cc.director.loadScene("map");
    },

    testPrintScene (word) {
        console.log("testPrintScene", word);
        cc.director.getScene().name;
    },

    getEditBoxValue (string) {
        console.log("getEditBoxValue", string);
        this.editBoxString = string;
    },

    printEditBoxValue () {
        console.log("printEditBoxValue", this.editBoxString);
    },

    setMapPicked (mapPick) {
        this.mapPick = mapPick;
    },

    getMapPicked () {
        return this.mapPick;
    },

    setHeroPick (heroPick) {
        this.heroPick = heroPick;
    },

    getHeroPick () {
        return this.heroPick;
    },

    /* select hero */
    addSelectedHeroPrefab(prefab) {
        if (!this.selectedHeroPrefabs) this.selectedHeroPrefabs = []; 
        console.log(this.selectedHeroPrefabs)
        console.log('hero prefab', prefab)
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
        console.log(this.mapTileWidth, this.mapTileHeight, '2131231')
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
    moveCharacter (dx, dy) {
        const newX = this.listenMoveNode.x + dx * this.mapTileWidth;
        const newY = this.listenMoveNode.y + dy * this.mapTileHeight;

        // check if the new position is walkable use newX, newY, firstCellPos and lastCellPos
        if (newX < this.firstCellPos.x || newX > this.lastCellPos.x || newY < this.firstCellPos.y || newY > this.lastCellPos.y) {
            console.log('out of map');
            return;
        }

        // check if the new position is walkable
        const gridX = Math.floor((newX - this.firstCellPos.x) / this.mapTileWidth);
        const gridY = Math.floor((newY - this.firstCellPos.y) / this.mapTileHeight);
        if (this.gridMap[gridX][gridY] == false) {
            console.log('not walkable');
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
        console.log(this.checkAttackRangeHero(this.focusedHero))
        if (this.checkAttackRangeHero(this.focusedHero) && this.focusedHero) {
            const hero = this.getFocusedHero();
            hero.mainScript = hero.getComponents(cc.Component).find(c => typeof c.attack === 'function');
            if (hero.mainScript) {
                hero.mainScript.attack();

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

    updateWalkable(x, y, walkable) {
        if (!this.gridMap) this.gridMap = [];
        if (this.gridMap[x] == undefined) {
            this.gridMap[x] = [];
        }

        console.log(this.gridMap[x][y], 'before updateWalkable', x, y);
        this.gridMap[x][y] = walkable;
        console.log(this.gridMap[x][y], 'after updateWalkable', x, y);

    },

    setCellPosition(firstCellPos, lastCellPos) {
        this.firstCellPos = firstCellPos;
        this.lastCellPos = lastCellPos;
        console.log(this.firstCellPos, this.lastCellPos, 'setCellPosition');
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
                        console.log('nearest hero is dead');
                        // remove hero from the list
                        this.heros.splice(this.heros.indexOf(nearestHero), 1);
                        this.focusedHero.scale = 1;

                        console.log('heros', this.heros);
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

    getWinner() {
        if (this.winner != undefined) {
            return this.winner;
        }
    },

    getNumberOfHero() {
        return this.heros.length;
    }

});

export default GameController;

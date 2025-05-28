const DEFAULT_DATA = {
    MOVEMENT_DELAY_TIME: 0.4, // time to move between cells
}

import EventBus from '../EventBus';
import GAME_DATA from './GameData'

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

    // properties: {
    //     gameWonIndex: 0,
    //     playerTurnCount: 1,
    //     isPlayerTurn: true,
    //     bossTurnCount: 1,
    // },

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
        this.heroes = []; // hero in game
        this.gridMap = [];
        this.winner = null; // 'boss', 'player'
        this.isAutoMode = false;
        this.isUsingSkill = false;
        this.enemies = [];
        this.bosses = [];
        this.isTurnOnMusic = true;

        this.mapHeight = null;
        this.mapWidth = null;
        this.mapTileWidth = null;
        this.mapTileHeight = null;
        
    },

    consumePlayerTurn() {
        this.playerTurnCount--;
        this.updateTurnLabels();
        if (this.playerTurnCount <= 0) {
            this.isPlayerTurn = false;
            // this.enemyAutoMode();
            EventBus.emit(EventBus.events.BOSS2_SPAWN_ENEMY);
            this.bossAttack();
        }
    },


    start() {
    },

    setCellPosition(firstCellPos, lastCellPos) {
        this.firstCellPos = firstCellPos;
        this.lastCellPos = lastCellPos;
    },
    setMapSetting(mapHeight, mapWidth, mapTileWidth, mapTileHeight, endGameCallback) {
        this.mapHeight = mapHeight;
        this.mapWidth = mapWidth;
        this.mapTileWidth = mapTileWidth;
        this.mapTileHeight = mapTileHeight;
        this.endGameCallback = endGameCallback;
    },

    getPlayerTurnCount() {
        if (this.playerTurnCount == undefined || this.playerTurnCount == null) this.playerTurnCount = 3;
        return this.playerTurnCount;
    },

    // update (dt) {},
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

    getMapSetting() {
        return {
            mapHeight: this.mapHeight,
            mapWidth: this.mapWidth,
            mapTileWidth: this.mapTileWidth,
            mapTileHeight: this.mapTileHeight,
        };
    },
    // =================== Enemy Logic: Start ===================
    setNewEmemy(newEnemy) {
        if (this.enemies == null || this.enemies == undefined) this.enemies = [];


        this.enemies.push(newEnemy);
    },

    getEnemy() {
        return this.enemies;
    },

    // each enemy moves to nearest hero and attack if their attack range is enough
    // execute in boss turn, before boss attack
    enemyAutoMode() {
        if (this.enemies == undefined || this.enemies == null) return;
        if (this.enemies.length == 0) return;

        this.enemies.forEach((enemy, index) => {
            // check attack range hero
            // if enough -> attack
            // else -> move
            let nearestHero = this.findNearestHero(enemy);
            if (!nearestHero) return;

            // distance between enemy and nearest hero
            let enemyPos = this.positionToGrid(enemy);
            let heroPos = this.positionToGrid(nearestHero);
            if (!enemyPos || !heroPos) return;
            const dx = Math.abs(enemyPos.x - heroPos.x);
            const dy = Math.abs(enemyPos.y - heroPos.y);


            // let enemyAttackRange = this.getAttackRange(enemies);
            let enemyAttackRange = 1;

            if (dx + dy <= enemyAttackRange) {
                // attack
                console.log('attack')
                enemy.mainScript = enemy.getComponents(cc.Component).find(c => typeof c.dealDame === 'function');

                if (enemy.mainScript) {
                    enemy.mainScript.dealDame(nearestHero, 20);

                    // check if hero is dead
                    nearestHero.mainScript = nearestHero.getComponents(cc.Component).find(c => typeof c.getCurrentHp === 'function');
                    if (nearestHero.mainScript && nearestHero.mainScript.getCurrentHp() <= 0) {
                        this.handleHeroDie(nearestHero);
                    }

                }
            } else {
                // move to nearest hero
                EventBus.emit(EventBus.events.ENEMY_AUTO_MODE, enemy, nearestHero);
            }
        })
    },

    findNearestHero(enemy) {
        if (!this.heroes || this.heroes.length === 0) return null;

        let nearestHero = null;

        let minDistance = Infinity;

        this.heroes.forEach(hero => {
            const distance = cc.v2(enemy.x - hero.x, enemy.y - hero.y).mag();
            
            if (distance < minDistance) {
                minDistance = distance;
                nearestHero = hero;
            }
        });
        return nearestHero;
    },
    // =================== Enemy Logic: End ===================
    heroClick(node) {
        this.setFocusedHero(this.heroes.indexOf(node));
        EventBus.emit(EventBus.events.DISPLAY_WALKABLE_AREA, this.firstCellPos, this.lastCellPos, this.gridMap, node);
    },



    /* select hero */
    addSelectedHeroPrefab(prefab) {
        if (!this.selectedHeroPrefabs) this.selectedHeroPrefabs = [];
        this.selectedHeroPrefabs.push(prefab);
    },

    getHeroPrefabs() {
        return this.selectedHeroPrefabs;
    },

    bossAttack() {
        // if (!this.boss) return;

        // // update the turn labels
        // this.updateTurnLabels();
        // // calculate the distance between the boss and the heroes, take the nearest hero
        // const boss = this.boss;
        // const heroes = this.heroes;
        // let nearestHero = null;
        // let minDistance = Infinity;

        // for (let i = 0; i < heroes.length; i++) {
        //     const hero = heroes[i];
        //     const distance = cc.v2(boss.x - hero.x, boss.y - hero.y).mag();

        //     if (distance < minDistance) {
        //         minDistance = distance;
        //         nearestHero = hero;
        //     }
        // }

        // boss.mainScript = boss.getComponents(cc.Component).find(c => typeof c.getAttackRange === 'function');
        // if (boss.mainScript && minDistance > boss.mainScript.getAttackRange()) {
        //     // this.boss
        //     this.boss.mainScript = this.boss.getComponents(cc.Component).find(c => typeof c.secondarySkill === 'function');

        //     if (this.boss.mainScript) {
        //         // use secondary skill
        //         this.boss.mainScript.secondarySkill();
                
        //         // update the cooldown UI
        //         if (this.gameScript && typeof this.gameScript.updateCooldownUI === 'function') {
        //             this.gameScript.updateCooldownUI(this.getFocusedHero());
        //         }
        //     }
        // } else {
        //     if (nearestHero) {
        //         // attack the nearest hero
        //         boss.mainScript = boss.getComponents(cc.Component).find(c => typeof c.attackAnimation === 'function');
        //         if (boss.mainScript) {
        //             let dame = boss.mainScript.getAttackDame();
        //             // handle the case when dame is 0 or undefined
        //             if (nearestHero.mainScript === undefined) {
        //                 nearestHero.mainScript = nearestHero.getComponents(cc.Component).find(c => typeof c.takeDamage === 'function');
        //             }
        //             if (nearestHero.mainScript) {
        //                 nearestHero.mainScript.takeDamage(dame);

        //                 if (this.gameScript && typeof this.gameScript.updateHeroInfoUI === 'function') {
        //                     this.gameScript.updateHeroInfoUI(nearestHero);
        //                 }
        //                 // check if hero is dead
        //                 if (nearestHero.mainScript.getCurrentHp() <= 0) {
        //                     this.handleHeroDie(nearestHero);
        //                 }
        //             }
        //             this.checkWin();
        //         }
        //     }
        // }

        

        // // after boss attack, set isPlayerTurn to true
        // this.scheduleOnce(() => {
        //     this.startPlayerTurn();
        // }, 1); // wait 1 second before next player turn
    },

    startPlayerTurn() {
        this.isPlayerTurn = true;
        this.playerTurnCount = 3;

        // Giảm cooldown lượt của tất cả hero
        this.heroes.forEach(hero => {
            if (hero.mainScript && typeof hero.mainScript.startTurn === 'function') {
                hero.mainScript.startTurn();
            }
        });

        this.updateTurnLabels();

        if (this.gameScript && typeof this.gameScript.updateCooldownUI === 'function') {
        this.gameScript.updateCooldownUI(this.getFocusedHero());
    }
    },


    updateTurnLabels() {
        if (this.gameScript) {
            this.gameScript.updatePlayerTurnLabel(this.playerTurnCount);
            this.gameScript.updateBossTurnLabel(this.isPlayerTurn ? 0 : this.bossTurnCount);
        }
    },



    /* game scene */
    setFocusedHero(heroIndex) {
        this.focusedHero = this.heroes[heroIndex];
        // this.listenKeyDown(this.focusedHero);
        // set the other heroes scale to 1
        for (let i = 0; i < this.heroes.length; i++) {
            if (i == heroIndex) {
                this.heroes[i].focusEffect.active = true;
            } else {
                this.heroes[i].focusEffect.active = false;
            }
        }

        // update the hero info UI
        if (this.gameScript && typeof this.gameScript.updateHeroInfoUI === 'function') {
            this.gameScript.updateHeroInfoUI(this.focusedHero);
        }
    },


    getFocusedHero() {
        return this.focusedHero;
    },

    addHero(hero) {
        if (this.heroes == undefined) this.heroes = [];
        this.heroes.push(hero);
    },
    addBoss(boss, size) {
        // this.boss = boss;
        if (this.bosses == undefined) this.bosses = [];
        this.bosses.push({
            node: boss,
            size: size || 1,
        });
    },

    // =================== Hero Attack: Start ===================
    heroAttack(hero) {
        if (hero == null || hero == undefined) hero = this.focusedHero;

        hero.mainScript = hero.getComponents(cc.Component).find(c => typeof c.dealDame === 'function');

        if (hero.mainScript) {
            let enemiesInRange = this.checkAttackRangeHero(hero);
            if (enemiesInRange.length == 0) {
                console.log('no enemy in range');
                return;
            }
            
            this.showEnemySelection(enemiesInRange, (selectedEnemy) => {
                this.heroAttackTarget(hero, selectedEnemy);
            });
        }
    },
    heroAttackTarget(hero, enemy) {
        if (!hero || !enemy || !hero.mainScript) {
            console.warn("Thiếu hero hoặc enemy hoặc mainScript");
            return;
        }

        hero.mainScript.dealDame(enemy, 20);
        enemy.mainScript = enemy.getComponents(cc.Component).find(c => typeof c.getCurrentHp === 'function');

        if (enemy.mainScript && enemy.mainScript.getCurrentHp() <= 0) {
            let isBoss = this.bosses.some(b => b.node === enemy);
            if (isBoss) {
                console.log('boss die');
                this.handleBossDie(enemy);
            } else {
                console.log('enemy die', this.bosses, enemy);
                this.enemies.splice(this.enemies.indexOf(enemy), 1);
            }

            // if (this.bosses.includes(enemy)) {
            //     console.log('boss die');
            //     this.handleBossDie(enemy);
            // } else {
            //     console.log('enemy die', this.bosses, enemy);
            //     this.enemies.splice(this.enemies.indexOf(enemy), 1);
            // }
        }
        

        this.consumePlayerTurn();
        this.checkWin();
    },

    // highlight enemy when selected to attack
    showEnemySelection(enemies, onEnemySelected) {
        enemies.forEach(enemy => {
            this.highlightEnemy(enemy);

            enemy.once(cc.Node.EventType.TOUCH_END, () => {
                this.clearEnemyHighlights(enemies);
                cc.systemEvent.off(cc.Node.EventType.TOUCH_END, this._onCancelEnemySelect, this);
                onEnemySelected(enemy);
            });
        });

        this._onCancelEnemySelect = (event) => {
            if (!enemies.some(enemy => enemy === event.target)) {
                this.clearEnemyHighlights(enemies);
                cc.systemEvent.off(cc.Node.EventType.TOUCH_END, this._onCancelEnemySelect, this);
            }
        };

        // Listen for touch end event to cancel enemy selection
        cc.systemEvent.on(cc.Node.EventType.TOUCH_END, this._onCancelEnemySelect, this);
    },
    highlightEnemy(enemy) {
        enemy.scale = enemy.scale * 1.5;
    },
    clearEnemyHighlights(enemies) {
        enemies.forEach(enemy => {
            enemy.scale = enemy.scale / 1.5; // reset scale
            enemy.off(cc.Node.EventType.TOUCH_END);
        });
        // this._highlightedEnemies = null;
    },

    checkAttackRangeHero(hero) {
        let enemiesInRange = [];
        if (hero == undefined || hero == null) hero = this.getFocusedHero();
        if (this.enemies == undefined || this.enemies == null) this.enemies = [];
        hero.mainScript = hero.getComponents(cc.Component).find(c => typeof c.getAttackRange === 'function');
        if (!hero.mainScript) {
            console.log('no getAttackRange function');
            return enemiesInRange;
        }

        let attackRange = hero.mainScript.getAttackRange();

        if (attackRange <= 0) {
            console.log('attack range is 0');
            return enemiesInRange;
        }

        this.enemies.forEach((enemy) => {
            let enemyPos = this.positionToGrid(enemy);
            let heroPos = this.positionToGrid(hero);
            if (!enemyPos || !heroPos) return;

            const dx = Math.abs(enemyPos.x - heroPos.x);
            const dy = Math.abs(enemyPos.y - heroPos.y);

            if (dx + dy <= attackRange) {
                enemiesInRange.push(enemy);
            }
        })


        this.bosses.forEach((boss) => {
            let bossPos = this.bossStartPositionToGrid(boss);
            let heroPos = this.positionToGrid(hero);
            if (!bossPos || !heroPos) return;
            for (let i = 0; i < boss.size; i++) {
                for (let j = 0; j < boss.size; j++) {
                    const dx = Math.abs(bossPos.x + i - heroPos.x);
                    const dy = Math.abs(bossPos.y + j - heroPos.y);
                    if (dx + dy <= attackRange) {
                        enemiesInRange.push(boss.node);
                        break; // no need to check other cells in the boss area
                    }
                }
            }
        });
        console.log('enemies in range: ', enemiesInRange);

        return enemiesInRange;
    },

    getAttackRange(object) {
        if (object == undefined || object == null) return 0;

        object.mainScript = object.getComponents(cc.Component).find(c => typeof c.getAttackRange === 'function');

        if (object.mainScript) {
            let attackRange = object.mainScript.getAttackRange();
            if (attackRange > 0) {
                return attackRange;
            }
        }

        return 0;
    },
    // =================== Hero Attack: End ===================


    // =================== Hero Ultimate: Start ===================
    setHighlightTilePrefab(highlightTilePrefab) {
        this.highlightTilePrefab = highlightTilePrefab;
    },

    setRootNode(node) {
        this.rootNode = node;
    },
    heroUltimate(hero) {
        if (hero == null || hero == undefined) hero = this.focusedHero;

        hero.mainScript = hero.getComponents(cc.Component).find(c => typeof c.ultimate === 'function');
        if (hero.mainScript) {

            // enemiesInRange = bosses + enemies
            let enemiesInRange = [];
            // this.enemies.forEach((enemy) => {

            if (this.enemies == undefined || this.enemies == null) this.enemies = [];
            if (this.bosses == undefined || this.bosses == null) this.bosses = [];
            this.enemies.forEach((enemy) => {
                enemiesInRange.push(enemy);
            })

            this.bosses.forEach((boss) => {
                enemiesInRange.push(boss.node);
            });

            this.showEnemySelection(enemiesInRange, (selectedEnemy) => {
                this.heroUltimateEnemy(hero, selectedEnemy);
            });
        }
    },

    testVampireUltimate(hero) {
        if (hero == null || hero == undefined) hero = this.focusedHero;

        console.log('test vampire ultimate');

        hero.mainScript = hero.getComponents(cc.Component).find(c => typeof c.ultimate === 'function');
        if (hero.mainScript) {
            console.log('hero main script', hero.mainScript);
            this.showTileSelection((startTile) => {
                hero.mainScript.ultimate(startTile, (affactedTile, dame) => {
                    // console.log('affactedTile', affactedTile, 'dame', dame);
                    // this.dealDameAoe(affactedTile, dame);
                }, (animPrefab, tile, times, dame) => {
                    this.spawnUltimateAnimation(animPrefab, tile, times, dame);
                });
            });

        }
        

    },

    showTileSelection(onTileSelected) {

        console.log('show tile selection');
        if (!this.highlightTiles) this.highlightTiles = [];
        for (let x = 0; x < this.mapWidth; x++) {
            for (let y = 0; y < this.mapHeight; y++) {
                let highlight = cc.instantiate(this.highlightTilePrefab);
                // highlight.parent = this.mapNode;
                this.rootNode.addChild(highlight);
                highlight.setPosition(
                    this.firstCellPos.x + x * this.mapTileWidth + this.mapTileWidth / 2,
                    this.firstCellPos.y + y * this.mapTileHeight + this.mapTileHeight / 2
                );
                highlight.on(cc.Node.EventType.TOUCH_END, () => {
                    this.clearTileHighlights();
                    onTileSelected({ x, y });
                });
                this.highlightTiles.push(highlight);
            }
        }
    },
    clearTileHighlights() {
        if (!this.highlightTiles) return;
        this.highlightTiles.forEach(tile => tile.destroy());
        this.highlightTiles = [];
    },

    heroUltimateEnemy(hero, enemy) {
        console.log('enemy pos', enemy.x, enemy.y);
        if (!hero || !enemy || !hero.mainScript) {
            console.warn("Thiếu hero hoặc enemy hoặc mainScript");
            return;
        }

        hero.mainScript.ultimate(enemy);
    },

    spawnUltimateAnimation(animPrefab, tile, times, dame) {
        if (times == 0) return;
        let ranTimeToSpawn = Math.random();

        if (!this.rootNode) {
            console.error('Root node is not set for spawning ultimate animation');
            return;
        }
        this.scheduleOnce(() => {
            const anim = cc.instantiate(animPrefab);

            anim.setPosition(
                this.firstCellPos.x + tile.x * this.mapTileWidth + this.mapTileWidth / 2,
                this.firstCellPos.y + tile.y * this.mapTileHeight + this.mapTileHeight / 2
            );
            this.rootNode.addChild(anim);

            this.dealDameTile(tile, dame);
            times--;

            // spawn the animation again after 0.5 seconds
            this.scheduleOnce(() => {
                this.spawnUltimateAnimation(anim, tile, times, dame);
            }, 1);
        }, ranTimeToSpawn);
    },

    dealDameTile(tile, dame) {
        if (this.enemies == undefined || this.enemies == null) this.enemies = [];
        if (this.bosses == undefined || this.bosses == null) this.bosses = [];

        // deal dame to all enemies and bosses in the affactedTile

        if (this.gridMap[tile.x] == undefined || this.gridMap[tile.x][tile.y] == undefined) return;
        if (this.gridMap[tile.x][tile.y] == false) {
            // tile is walkable, so we can deal dame to enemies and bosses
            this.enemies.forEach((enemy) => {
                let enemyPos = this.positionToGrid(enemy);
                if (enemyPos && enemyPos.x === tile.x && enemyPos.y === tile.y) {
                    enemy.mainScript = enemy.getComponents(cc.Component).find(c => typeof c.takeDame === 'function');
                    if (enemy.mainScript) {
                        enemy.mainScript.takeDame(dame);
                        if (enemy.mainScript.getCurrentHp() <= 0) {
                            this.handleHeroDie(enemy);
                        }
                    }
                }
            });

            this.bosses.forEach((boss) => {
                let bossPos = this.bossStartPositionToGrid(boss);
                if (bossPos && bossPos.x === tile.x && bossPos.y === tile.y) {
                    boss.node.mainScript = boss.node.getComponents(cc.Component).find(c => typeof c.takeDame === 'function');
                    if (boss.node.mainScript) {
                        boss.node.mainScript.takeDame(dame);
                        if (boss.node.mainScript.getCurrentHp() <= 0) {
                            this.handleBossDie(boss.node);
                        }
                    }
                }
            });
        }

    },
    // =================== Hero Ultimate: End ===================

    updateWalkable(x, y, size, walkable) {
        if (!this.gridMap) this.gridMap = [];
        if (this.gridMap[x] == undefined) {
            this.gridMap[x] = [];
        }

        if (size == 1) {
            this.gridMap[x][y] = walkable;
        } else {
            for (let i = x; i < x + size; i++) {
                for (let j = y; j < y + size; j++) {
                    if (this.gridMap[i] == undefined) {
                        this.gridMap[i] = [];
                    }
                    this.gridMap[i][j] = walkable;
                }
            }
        }
    },

    getWalkableMap() {
        return this.gridMap;
    },

    getBoss() {
        return this.bosses;
    },

    checkWalkableMove(hero, dx, dy) {
        const newX = hero.x + dx * this.mapTileWidth;
        const newY = hero.y + dy * this.mapTileHeight;

        // check if the new position is walkable use newX, newY, firstCellPos and lastCellPos
        if (newX < this.firstCellPos.x || newX > this.lastCellPos.x || newY < this.firstCellPos.y || newY > this.lastCellPos.y) {
            return false;
        }

        // check if the new position is walkable
        const gridX = Math.floor((newX - this.firstCellPos.x) / this.mapTileWidth);
        const gridY = Math.floor((newY - this.firstCellPos.y) / this.mapTileHeight);
        if (this.gridMap[gridX][gridY] == false) {
            return false;
        }

        this.gridMap[gridX][gridY] == false;
        return true;
    },

    

    getNumberOfHero() {
        return this.heroes.length;
    },

    handleHeroDie(hero) {
        // remove hero from the list
        this.heroes[this.heroes.indexOf(hero)].focusEffect.active = false;
        this.heroes.splice(this.heroes.indexOf(hero), 1);
        if (hero == this.focusedHero) this.setFocusedHero(0);

        // set the hero to not walkable
        const heroPos = this.positionToGrid(hero);
        if (!heroPos) return;
        const gridX = heroPos.x;
        const gridY = heroPos.y;
        if (this.gridMap[gridX] == undefined) {
            this.gridMap[gridX] = [];
        }
        this.gridMap[gridX][gridY] = true;

        this.checkWin();
    },

    handleBossDie(boss) {
        // const bossPos = this.bossStartPositionToGrid(this.bosses[this.bosses.indexOf(boss)]);
        // console.log('bossPos', bossPos);
        // if (!bossPos) return;
        // const gridX = bossPos.x;
        // const gridY = bossPos.y;
        // for (let i = 0; i < boss.size; i++) {
        //     for (let j = 0; j < boss.size; j++) {
        //         if (this.gridMap[gridX + i] == undefined) {
        //             this.gridMap[gridX + i] = [];
        //         }
        //         this.gridMap[gridX + i][gridY + j] = true;
        //     }
        // }

        // this.bosses.splice(this.bosses.indexOf(boss), 1);
        // if (this.bosses.length == 0) {
        //     console.log('boss die, no more boss');
        //     this.checkWin();
        //     return;
        // }
    },

    
    // object with size 1
    positionToGrid(node) {
        if (this.firstCellPos == undefined || this.lastCellPos == undefined) return null;
        if (this.mapTileWidth == undefined || this.mapTileHeight == undefined) return null;

        let gridX = Math.floor((node.x - this.firstCellPos.x) / this.mapTileWidth);
        let gridY = Math.floor((node.y - this.firstCellPos.y) / this.mapTileHeight);

        if (gridX < 0 || gridY < 0 || gridX >= this.mapWidth || gridY >= this.mapHeight) {
            return null;
        }

        return {
            x: gridX,
            y: gridY,
        }
    },

    bossStartPositionToGrid(boss) {
        if (this.firstCellPos == undefined || this.lastCellPos == undefined) return null;
        if (this.mapTileWidth == undefined || this.mapTileHeight == undefined) return null;

        let gridX = Math.floor((boss.node.x - this.firstCellPos.x - (this.mapTileWidth * boss.size) / 2) / this.mapTileWidth);
        let gridY = Math.floor((boss.node.y - this.firstCellPos.y - (this.mapTileHeight * boss.size) / 2) / this.mapTileHeight);

        if (gridX < 0 || gridY < 0 || gridX >= this.mapWidth || gridY >= this.mapHeight) {
            return null;
        }

        return {
            x: gridX,
            y: gridY,
        }
    },

    /* game system */

    // reset
    resetGame() {
        this.listenMoveNode = null;
        this.focusedHero = null;
        this.heroes = []; // hero in game
        this.gridMap = [];
        this.winner = null; // 'boss', 'player'
        this.isMoving = false;
        this.isAttacking = false;
        this.isUsingSkill = false;
    },

    // new game
    newGame() {
        this.mapPick = null;
        this.heroPick = [];
        this.selectedHeroPrefabs = [];
        this.listenMoveNode = null;

        this.focusedHero = null;
        this.heroes = []; // hero in game
        this.gridMap = [];
        this.winner = null; // 'boss', 'player'

        this.setFocusedHero(0)
        this.isMoving = false;
        this.isAttacking = false;
        this.isUsingSkill = false;
    },

    checkWin() {
        console.log('check win')
        if (this.heroes.length == 0) {
            this.setWonMap();
            this.isMoving = false;
            this.isAttacking = false;
            this.isUsingSkill = false;
            this.winner = GAME_DATA.ROLE.BOSS;
            this.endGameCallback();
        }
        if (this.bosses.length == 0) {
            console.log('player win');
            this.setWonMap();
            this.isMoving = false;
            this.isAttacking = false;
            this.isUsingSkill = false;
            this.winner = GAME_DATA.ROLE.PLAYER;
            this.endGameCallback();
        }
    },

    backToMapSelect() {
        this.mapPick = null;
        this.heroPick = [];
        this.selectedHeroPrefabs = [];
    },

    getWinner() {
        if (this.winner == undefined || this.winner == null) {
            return;
        }

        return this.winner;
    },
    

    getWonMap() {
        if (this.gameWonIndex == undefined || this.gameWonIndex == null) this.gameWonIndex = 0;
        return this.gameWonIndex;
    },

    setWonMap() {
        if (this.mapPick < this.gameWonIndex) return;
        this.gameWonIndex = this.gameWonIndex + 1;
    },

    getTurnOnMusic() {
        if (this.isTurnOnMusic == undefined || this.isTurnOnMusic == null) this.isTurnOnMusic = true;
        return this.isTurnOnMusic;
    },

    setIsTurnOnMusic(isTurnOn) {
        this.isTurnOnMusic = isTurnOn;
    },
});

export default GameController;
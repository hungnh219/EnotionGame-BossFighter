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
                cc.game.addPersistRootNode(this.node);
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
    //     characterJsonData: cc.JsonAsset,
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
        // this.mapPick = null;
        // this.heroPick = [];
        // this.selectedHeroPrefabs = [];
        // this.listenMoveNode = null;

        // this.focusedHero = null;
        // this.heroes = []; // hero in game
        // this.gridMap = [];
        // this.winner = null; // 'boss', 'player'
        // this.isAutoMode = false;
        // this.isUsingSkill = false;
        // this.enemies = [];
        // this.bosses = [];
        // this.isTurnOnMusic = true;

        // this.mapHeight = null;
        // this.mapWidth = null;
        // this.mapTileWidth = null;
        // this.mapTileHeight = null;

        // this.isPlayerTurn = true;
        

    // // =================== callbacks to view info in game scene ===================
    //     this.updatePlayerTurn = null;
    //     this.updatePlayerInfo = null;

    },
    //-------------------------------------------------------------------------------//
    startGame() {
        this.playerTurn();
        this.updatePlayerTurn(this.playerTurnCount);
        this.setFocusedHero(0);
    },

    playerTurn() {
        this.isPlayerTurn = true;
        this.playerTurnCount = 3; // reset player turn count

        this.updatePlayerTurn(this.playerTurnCount);
    },
    
    updateInfo() {
        let hero = this.focusedHero;
        if (!hero) return;
        hero.mainScript = hero.getComponents(cc.Component).find(c => typeof c.getUltimateCooldown === 'function');

        if (hero.mainScript && hero) {
            let ultimateCooldown = hero.mainScript.getUltimateCooldown();
            let heroInfo = hero.mainScript.getCharacterInfo();
            this.updateHeroInfoUI(heroInfo, ultimateCooldown);
        }
    },

    bossTurn() {
        this.isPlayerTurn = false;

        EventBus.emit(EventBus.events.BOSS2_SPAWN_ENEMY, this.enemies, this.bosses, this.gridMap, this.firstCellPos, this.lastCellPos, this.mapTileWidth, this.mapTileHeight);
        this.enemyAutoMode();

        if (this.mapPick == 1) this.bossAutoMode();

        this.heroes.forEach(hero => {
            hero.mainScript = hero.getComponents(cc.Component).find(c => typeof c.countUltimateCooldown === 'function');
            if (hero.mainScript) {
                hero.mainScript.countUltimateCooldown();
            }
        });

        this.updateInfo();
        this.playerTurn();
    },

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

        this.updateInfo();
    },

    // =================== Get-Set: Start ===================
    setCallbacks(playerTurnCallback, playerInfoCallback, endGameCallback) {
        this.updatePlayerTurn = playerTurnCallback;
        this.updateHeroInfoUI = playerInfoCallback;
        this.endGameCallback = endGameCallback;
    },


    setCellPosition(firstCellPos, lastCellPos) {
        this.firstCellPos = firstCellPos;
        this.lastCellPos = lastCellPos;
    },
    setMapSetting(mapHeight, mapWidth, mapTileWidth, mapTileHeight) {
        this.mapHeight = mapHeight;
        this.mapWidth = mapWidth;
        this.mapTileWidth = mapTileWidth;
        this.mapTileHeight = mapTileHeight;
    },

    getPlayerTurnCount() {
        if (this.playerTurnCount == undefined || this.playerTurnCount == null) this.playerTurnCount = 3;
        return this.playerTurnCount;
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

    getMapSetting() {
        return {
            mapHeight: this.mapHeight,
            mapWidth: this.mapWidth,
            mapTileWidth: this.mapTileWidth,
            mapTileHeight: this.mapTileHeight,
        };
    },

    setNewEmemy(newEnemy) {
        if (this.enemies == null || this.enemies == undefined) this.enemies = [];


        this.enemies.push(newEnemy);
    },

    getEnemy() {
        return this.enemies;
    },


    getSelectedHeroPrefabs() {
        console.log('get selected hero prefabs', this.selectedHeroPrefabs);
        return this.selectedHeroPrefabs;
    },

    addSelectedHeroPrefab(prefab) {
        console.log('add selected hero prefab', prefab);
        if (!this.selectedHeroPrefabs) this.selectedHeroPrefabs = [];
        this.selectedHeroPrefabs.push(prefab);
        console.log('selected hero prefabs', this.selectedHeroPrefabs);
    },

    getWalkableMap() {
        return this.gridMap;
    },

    getBoss() {
        return this.bosses;
    },

    getFocusedHero() {
        return this.focusedHero;
    },

    setHighlightTilePrefab(highlightTilePrefab) {
        this.highlightTilePrefab = highlightTilePrefab;
    },

    setRootNode(node) {
        this.rootNode = node;
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

        console.log('add boss', this.bosses, boss, size);
    },

    

    // =================== Get-Set: End ===================



    // =================== Enemy Logic: Start ===================
    consumePlayerTurn() {
        this.playerTurnCount--;
        this.updatePlayerTurn(this.playerTurnCount);

        if (this.playerTurnCount <= 0) {
            this.bossTurn();
        }
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

            let enemyAttackRange = 1;

            if (dx + dy <= enemyAttackRange) {
                // attack
                console.log('enemy attack')
                enemy.mainScript = enemy.getComponents(cc.Component).find(c => typeof c.dealDame === 'function');

                if (enemy.mainScript) {
                    let dame = enemy.mainScript.getAttackDame();
                    // enemy.mainScript.dealDame(nearestHero, dame);

                    // check if hero is dead
                    nearestHero.mainScript = nearestHero.getComponents(cc.Component).find(c => typeof c.getCurrentHp === 'function');
                    nearestHero.mainScript.takeDame(dame);
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

    bossAutoMode() {
        if (this.bosses == undefined || this.bosses == null) return;
        if (this.bosses.length == 0) return;

        let bossArray = this.bosses.map(b => b.node);
        bossArray.forEach((enemy, index) => {
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

            let enemyAttackRange = 1;

            if (dx + dy <= enemyAttackRange) {
                // attack
                console.log('attack')
                enemy.mainScript = enemy.getComponents(cc.Component).find(c => typeof c.dealDame === 'function');

                if (enemy.mainScript) {
                    // enemy.mainScript.dealDame(nearestHero, 80);
                    let dame = enemy.mainScript.getAttackDame() * 1.5;
                    enemy.mainScript.dealDame(nearestHero, dame);

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
        if (node == this.focusedHero) {
            EventBus.emit(EventBus.events.DISPLAY_WALKABLE_AREA, this.firstCellPos, this.lastCellPos, this.gridMap, node);
        }
        
        this.setFocusedHero(this.heroes.indexOf(node));
    },



    /* select hero */
    

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

    async heroAttackTarget(hero, enemy) {
        if (!hero || !enemy || !hero.mainScript) {
            console.warn("Thiếu hero hoặc enemy hoặc mainScript");
            return;
        }

        enemy.mainScript = enemy.getComponents(cc.Component).find(c => typeof c.getCurrentHp === 'function');
        hero.mainScript = hero.getComponents(cc.Component).find(c => typeof c.dealDame === 'function');

        let dame = hero.mainScript.getAttackDame();
        if (enemy.mainScript && dame > 0) {
            let isBoss = this.bosses.some(b => b.node === enemy);

            const enemyPos = this.positionToGrid(enemy);
            const heroPos = this.positionToGrid(hero);
            if (!enemyPos || !heroPos) return;

            let direction = this.getDirection(heroPos, enemyPos);

            let dame = await hero.mainScript.attack(enemy, direction);
            enemy.mainScript.takeDame(dame);
            console.log('hero attack enemy', enemy.name, 'with damage', dame);
            if (enemy.mainScript.getCurrentHp() <= 0)  {
                if (isBoss) {
                    this.handleEnemyDie(enemy);
                } else {
                    this.enemies.splice(this.enemies.indexOf(enemy), 1);
                }
            }
            
        }

        this.consumePlayerTurn();
        this.checkWin();
    },


    // highlight enemy when selected to attack
    showEnemySelection(enemies, onEnemySelected) {
        if (this.isTarget) return;

        this.isTarget = true;
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
        this.isTarget = false;
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
    // =================== Hero Attack: End ===================


    // =================== Hero Ultimate: Start ===================
    
    // *** hardcode ***
    heroUltimate(hero) {
        if (hero == null || hero == undefined) hero = this.focusedHero;


        hero.mainScript = hero.getComponents(cc.Component).find(c => typeof c.ultimate === 'function');



        if (hero.mainScript) {
            let ultimateCooldown = hero.mainScript.getUltimateCooldown();
            if (ultimateCooldown > 0) {
                console.warn('Ultimate is on cooldown, please wait for it to be ready');
                return;
            }

            if (hero.name == 'Vampire') {
                this.vampireUltimate(hero);
            } else if (hero.name == 'Bruiser') {
                this.bruiserUltimate(hero);
            } else if (hero.name == 'Adc') {
                this.adcUltimate(hero);
            } else if (hero.name == 'Tanker') {
                // this.testTankUltimate(hero);
            } else {
                return;
            }

            hero.mainScript.resetUltimateCooldown();
            // this.updateHeroInfoUI
            this.updateInfo();
            this.consumePlayerTurn();
            this.checkWin();
        }
    },

    adcUltimate(hero) {
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

    vampireUltimate(hero) {
        if (hero == null || hero == undefined) hero = this.focusedHero;

        hero.mainScript = hero.getComponents(cc.Component).find(c => typeof c.ultimate === 'function');
        if (hero.mainScript) {
            this.showTileSelection((startTile) => {
                hero.mainScript.ultimate(startTile, (animPrefab, tile, times, dame) => {
                    this.spawnUltimateAnimation(animPrefab, tile, times, dame);
                });
            }, false);
        }
    },

    bruiserUltimate(hero) {
        if (hero == null || hero == undefined) hero = this.focusedHero;

        console.log('test bruiser ultimate');
        hero.mainScript = hero.getComponents(cc.Component).find(c => typeof c.ultimate === 'function');

        if (hero.mainScript) {
            // hero.mainScript.ultimate();
            this.showTileSelection((targetTile) => {
                hero.mainScript.ultimate(targetTile, {
                    firstTile: this.firstCellPos,
                    tileWidth: this.mapTileWidth,
                    tileHeight: this.mapTileHeight,
                    updateWalkable: (x, y, size, walkable) => {
                        this.updateWalkable(x, y, size, walkable);
                    }}
                );
            }, true);
        }
    },

    showTileSelection(onTileSelected, isCheckWalkable = false) {

        console.log('show tile selection');
        if (!this.highlightTiles) this.highlightTiles = [];
        for (let x = 0; x < this.mapWidth; x++) {
            for (let y = 0; y < this.mapHeight; y++) {
                if (isCheckWalkable && (this.gridMap[x] == undefined || this.gridMap[x][y] == undefined || this.gridMap[x][y] == false)) {
                    continue; // skip if the tile is not walkable
                }
                let highlight = cc.instantiate(this.highlightTilePrefab);
                // highlight.parent = this.mapNode;
                this.rootNode.addChild(highlight);
                highlight.setPosition(
                    // this.firstCellPos.x + x * this.mapTileWidth + this.mapTileWidth / 2,
                    // this.firstCellPos.y + y * this.mapTileHeight + this.mapTileHeight / 2
                    x * this.mapTileWidth + this.mapTileWidth / 2,
                    y * this.mapTileHeight + this.mapTileHeight / 2
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

    async heroUltimateEnemy(hero, enemy) {
        console.log('enemy pos', enemy.x, enemy.y);
        if (!hero || !enemy || !hero.mainScript) {
            console.warn("Thiếu hero hoặc enemy hoặc mainScript");
            return;
        }

        let dame = await hero.mainScript.ultimate(enemy);

        enemy.mainScript = enemy.getComponents(cc.Component).find(c => typeof c.getCurrentHp === 'function');
        enemy.mainScript.takeDame(dame);

        if (enemy.mainScript && enemy.mainScript.getCurrentHp() <= 0) {
            this.handleEnemyDie(enemy);
        }
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

            if (!anim || !anim.getComponent(cc.Animation)) {
                console.error('Animation prefab is not valid or does not have an Animation component');
                return;
            }
            anim.setPosition(
                // this.firstCellPos.x + tile.x * this.mapTileWidth + this.mapTileWidth / 2,
                // this.firstCellPos.y + tile.y * this.mapTileHeight + this.mapTileHeight / 2
                tile.x * this.mapTileWidth + this.mapTileWidth / 2,
                tile.y * this.mapTileHeight + this.mapTileHeight / 2
            );
            this.rootNode.addChild(anim);

            this.dealDameTile(tile, dame);
            times--;

            this.scheduleOnce(() => {
                this.spawnUltimateAnimation(anim, tile, times, dame);
            }, 0.5);
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
                            this.handleEnemyDie(enemy);
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
                            console.log('boss die check 123');
                            this.handleEnemyDie(boss);
                        }
                    }
                }
            });
        }

    },


    

    // =================== Hero Ultimate: End ===================

    updateWalkable(x, y, size, walkable) {
        // console.log('updateWalkable', x, y, size, walkable);
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

    

    

    // getNumberOfHero() {
    //     return this.heroes.length;
    // },

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

    handleEnemyDie(enemy) {
        if (this.enemies == undefined || this.enemies == null) this.enemies = [];
        if (this.bosses == undefined || this.bosses == null) this.bosses = [];

        if (this.enemies.includes(enemy)) {

            this.enemies.splice(this.enemies.indexOf(enemy), 1);

            enemy.destroy(); // destroy the enemy node
        }
        else if (this.bosses.includes(enemy) || this.bosses.some(b => b.node = enemy)) {
            this.bosses.splice(this.bosses.indexOf(enemy), 1);
            if (this.bosses.length == 0) {
                console.log('boss die, no more boss');
                this.checkWin();
            }
        }

        


    },

    // object with size 1
    positionToGrid(node) {
        if (this.firstCellPos == undefined || this.lastCellPos == undefined) return null;
        if (this.mapTileWidth == undefined || this.mapTileHeight == undefined) return null;

        // let gridX = Math.floor((node.x - this.firstCellPos.x) / this.mapTileWidth);
        // let gridY = Math.floor((node.y - this.firstCellPos.y) / this.mapTileHeight);
        let gridX = Math.floor(node.x / this.mapTileWidth);
        let gridY = Math.floor(node.y / this.mapTileHeight);

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

        // let gridX = Math.floor((boss.node.x - this.firstCellPos.x - (this.mapTileWidth * boss.size) / 2) / this.mapTileWidth);
        // let gridY = Math.floor((boss.node.y - this.firstCellPos.y - (this.mapTileHeight * boss.size) / 2) / this.mapTileHeight);
        let gridX = Math.floor((boss.node.x - (this.mapTileWidth * boss.size) / 2) / this.mapTileWidth);
        let gridY = Math.floor((boss.node.y - (this.mapTileHeight * boss.size) / 2) / this.mapTileHeight);

        if (gridX < 0 || gridY < 0 || gridX >= this.mapWidth || gridY >= this.mapHeight) {
            return null;
        }

        return {
            x: gridX,
            y: gridY,
        }
    },

    /* game system */

    resetGame() {
        this.listenMoveNode = null;
        this.focusedHero = null;
        this.heroes = []; // hero in game
        this.gridMap = [];
        this.winner = null; // 'boss', 'player'
        this.isMoving = false;
        this.isAttacking = false;
        this.isUsingSkill = false;
        this.enemies = [];
        this.bosses = [];
        this.setFocusedHero(0);
        this.isAutoMode = false;
        this.isPlayerTurn = true;
        this.playerTurnCount = 3;
    },

    // new game
    newGame() {
        // this.mapPick = null;
        // this.heroPick = [];
        // this.selectedHeroPrefabs = [];
        // this.listenMoveNode = null;

        // this.focusedHero = null;
        // this.heroes = []; // hero in game
        // this.gridMap = [];
        // this.winner = null; // 'boss', 'player'

        // this.setFocusedHero(0)
        // this.isMoving = false;
        // this.isAttacking = false;
        // this.isUsingSkill = false;
        this.resetGame();
        this.selectedHeroPrefabs = [];
    },

    checkWin() {
        if (this.heroes.length == 0) {
            console.log('boss win');
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
        this.gameWonIndex = this.mapPick + 1;
    },

    getTurnOnMusic() {
        if (this.isTurnOnMusic == undefined || this.isTurnOnMusic == null) this.isTurnOnMusic = true;
        return this.isTurnOnMusic;
    },

    setIsTurnOnMusic(isTurnOn) {
        this.isTurnOnMusic = isTurnOn;
    },

    getDirection(current, next) {
        if (next.x > current.x) return 'right';
        if (next.x < current.x) return 'left';
        if (next.y > current.y) return 'front';
        if (next.y < current.y) return 'back';
        return 'front';
    },
});

export default GameController;
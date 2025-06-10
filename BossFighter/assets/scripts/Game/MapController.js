import GameController from "./GameController";
import SocketIOManager from "..//SocketIO/SocketIOManager";

cc.Class({
    extends: cc.Component,

    statics: {
        getInstance() {
            return instance;
        }
    },
    properties: {
       mapLayout: cc.Layout,

       mapObjectPrefab: cc.Prefab,
       mapObjectHolder: cc.Node,
    },

    // LIFE-CYCLE CALLBACKS:

    onLoad () {
        instance = this;

        this.gameController = GameController.getInstance();
        this.socketIOManager = SocketIOManager.getInstance();
    },

    start () {

    },

    initMapSize(mapHeight, mapWidth, mapTileHeight, mapTileWidth) {
        this.mapHeight = mapHeight;
        this.mapWidth = mapWidth;

        this.mapTileHeight = mapTileHeight;
        this.mapTileWidth = mapTileWidth;
    },

    viewMap(mapSize, tileSize, spriteFrames) {
        this.mapLayout.node.removeAllChildren();

        this.mapLayout.node.width = mapSize.width * tileSize.width;
        this.mapLayout.node.height = mapSize.height * tileSize.height;
        
        this.mapHeight = mapSize.height;
        this.mapWidth = mapSize.width;
        this.mapTileWidth = tileSize.width;
        this.mapTileHeight = tileSize.height;

        // center the map layout
        this.mapLayout.node.setPosition(cc.v2(-this.mapLayout.node.width / 2, -this.mapLayout.node.height / 2));
        this.mapObjectHolder.setPosition(this.mapLayout.node.getPosition());

        console.log("Map size:", mapSize);
        console.log("Tile size:", tileSize);
        for (let i = 0; i < mapSize.width; i++) {
            for (let j = 0; j < mapSize.height; j++) {
                const tileNode = new cc.Node(`Tile_${i}_${j}`);
                const sprite = tileNode.addComponent(cc.Sprite);
                sprite.sizeMode = cc.Sprite.SizeMode.CUSTOM;

                tileNode.width = tileSize.width;
                tileNode.height = tileSize.height;
                // sprite.spriteFrame = spriteFrames[mapHolder[i][j]];

                // tileNode.setPosition(i * tileSize.width, j * tileSize.height);
                

                // this.mapLayout.node.addChild(tileNode);
                this.mapObjectHolder.addChild(tileNode);
                tileNode.x = i * tileSize.width + (tileSize.width / 2);
                tileNode.y = j * tileSize.height + (tileSize.height / 2);
                // tileNode.y = (mapSize.height - 1 - j) * tileSize.height;

                if (i == 0 && j == 0) {
                    // left bottom
                    sprite.spriteFrame = spriteFrames[6];
                } else if (i == mapSize.width - 1 && j == mapSize.height - 1) {
                    // right top
                    sprite.spriteFrame = spriteFrames[4];
                } else if (i == 0 && j == mapSize.height - 1) {
                    // left top
                    sprite.spriteFrame = spriteFrames[7];
                } else if (i == mapSize.width - 1 && j == 0) {
                    // right bottom
                    sprite.spriteFrame = spriteFrames[5];
                } else if (i == 0 && j > 0 && j < mapSize.height - 1) {
                    // left side
                    sprite.spriteFrame = spriteFrames[1];
                } else if (i == mapSize.width - 1 && j > 0 && j < mapSize.height - 1) {
                    // right side
                    sprite.spriteFrame = spriteFrames[3];
                } else if (j == 0 && i > 0 && i < mapSize.width - 1) {
                    // bottom side
                    sprite.spriteFrame = spriteFrames[2];
                } else if (j == mapSize.height - 1 && i > 0 && i < mapSize.width - 1) {
                    // top side
                    sprite.spriteFrame = spriteFrames[0];
                } else if (j == 0 && i == mapSize.width / 2) {
                    // center bottom
                    sprite.spriteFrame = spriteFrames[8];
                } else {
                    // center tile
                    sprite.spriteFrame = spriteFrames[9];
                }
            }
        }
    },

    viewObjectsMap(mapData, mapWidth, mapHeight, mapObjectSpriteFrames) {
        for (let j = 0; j < mapHeight; j++) {
            for (let i = 0; i < mapWidth; i++) {
                let newJ = mapHeight - j - 1;
                const objectId = mapData[newJ][i];
                if (objectId === 0) {
                    this.socketIOManager.game.updateWalkableGridMap({
                        x: i,
                        y: j,
                        isWalkable: true
                    });
                    continue;
                }

                const spriteFrame = mapObjectSpriteFrames[objectId];
                if (!spriteFrame) {
                    continue;
                }

                const prefab = cc.instantiate(this.mapObjectPrefab);
                const sprite = prefab.getComponent(cc.Sprite);
                if (sprite) {
                    sprite.spriteFrame = spriteFrame;
                } else {
                    console.warn(`No sprite component found on prefab for object ID: ${objectId}`);
                    continue;
                }

                this.mapObjectHolder.addChild(prefab);
                this.addObjectIntoMap(i, j, 1, prefab);

                this.socketIOManager.game.updateWalkableGridMap({
                    x: i,
                    y: j,
                    isWalkable: false
                });
            }
        }
    },

    async spawnBossIntoMap(bossNode, position, size = 1) {
        console.log("Spawning boss into map:", bossNode, position, size);
        const posX = position.x ? position.x : this.mapWidth - 3;
        const posY = position.y ? position.y : this.mapHeight - 3;

        // scale boss to 1.5 if size > 1
        if (size == 1) {
            bossNode.scale = 1;
        } else if (size > 1) {
            bossNode.scale = 1.5;

            // if (mapIndex == 2) {
            //     this.bossNode.scale = 1;
            // }
        } else if (size > 3) {
            bossNode.scale = 2;
        }

        if (this.mapIndex == 1) {
            bossNode.scale = 1.5;
        }


        this.mapObjectHolder.addChild(bossNode);
        this.addObjectIntoMap(posX, posY, size, bossNode);

        for (let i = 0; i < size; i++) {
            for (let j = 0; j < size; j++) {
                this.socketIOManager.game.updateWalkableGridMap({
                    x: posX + i,
                    y: posY + j,
                    isWalkable: false
                });

                this.socketIOManager.game.setPosition(
                    bossNode.mainScript.characterId,
                    {
                        x: posX + i,
                        y: posY + j
                    }
                );
            }
        }

        this.gameController.addBoss(bossNode, size);
    },

    async spawnEnemyIntoMap(enemy) {
        if (!enemy) {
            console.error("No enemy to spawn");
            return;
        }

        let posX = Math.floor(Math.random() * this.mapWidth);
        let posY = Math.floor(Math.random() * this.mapHeight);

        let walkableMap = await this.socketIOManager.game.getWalkableGridMap();
        while (!walkableMap[posX][posY]) {
            posX = Math.floor(Math.random() * this.mapWidth);
            posY = Math.floor(Math.random() * this.mapHeight);
        }

        this.mapObjectHolder.addChild(enemy);

        this.gameController.setNewEmemy(enemy);
        this.addObjectIntoMap(posX, posY, 1, enemy);
        this.socketIOManager.game.updateWalkableGridMap({
            x: posX,
            y: posY,
            isWalkable: false
        });
    },

    spawnHeroIntoMap(heroPrefabs, focusEffectPrefab, lockedHeroData) {
        heroPrefabs.forEach(async (heroPrefab, index) => {
            let prefabNode = cc.instantiate(heroPrefab)
            let effectNode = cc.instantiate(focusEffectPrefab)

            let heroData = {
                characterId: lockedHeroData[index].heroId,
                name: lockedHeroData[index].name,
                hp: lockedHeroData[index].hp,
                maxHp: lockedHeroData[index].maxHp,
                attackDame: lockedHeroData[index].attackDamage,
                attackRange: lockedHeroData[index].attackRange,
            }
            prefabNode.mainScript = prefabNode.getComponents(cc.Component).find(c => typeof c.initData === 'function');
            
            if (prefabNode.mainScript) {
                prefabNode.mainScript.initData(heroData);
                prefabNode.mainScript.updateHpBar();
            }

            prefabNode.focusEffect = effectNode;
            effectNode.setPosition(cc.v2(0, this.mapTileHeight));
            effectNode.active = false;
            prefabNode.addChild(effectNode);

            this.mapObjectHolder.addChild(prefabNode);
            this.gameController.addHero(prefabNode);
            this.addObjectIntoMap(index, 0, 1, prefabNode);
            this.socketIOManager.game.updateWalkableGridMap({
                x: index,
                y: 0,
                isWalkable: false
            });
            this.socketIOManager.game.setPosition(heroData.characterId, {
                    x: index,
                    y: 0
                })

            // this.heroes.push(prefabNode)
        });
    },

    addObjectIntoMap(gridX, gridY, size, object) {
        let objectNode = object;

        if (object.node) objectNode = object.node;

        // resize the object
        if (objectNode.width > objectNode.height) {
            let ratio = this.mapTileHeight / objectNode.height;

            objectNode.height = this.mapTileHeight * size;

            objectNode.width *= ratio * size;
        } else {
            objectNode.width = this.mapTileWidth * size;

            objectNode.height = this.mapTileHeight * size * (objectNode.width / this.mapTileWidth);
        }

        // set the position of the object
        const mapPos = this.mapLayout.node.getPosition();

        // objectNode.x = mapPos.x + gridX * this.mapTileWidth + (this.mapTileWidth * size) / 2;
        // objectNode.y = mapPos.y + gridY * this.mapTileHeight + (this.mapTileHeight * size) / 2;
        objectNode.x = gridX * this.mapTileWidth + (this.mapTileWidth * size) / 2;
        objectNode.y = gridY * this.mapTileHeight + (this.mapTileHeight * size) / 2;
    },

    setCellPosition() {
        const firstCellPos = {
            x: this.mapLayout.node.x,
            y: this.mapLayout.node.y,
        };

        const lastCellPos = {
            x: this.mapLayout.node.x + this.mapWidth * this.mapTileWidth,
            y: this.mapLayout.node.y + this.mapHeight * this.mapTileHeight,
        };

        this.gameController.setCellPosition(firstCellPos, lastCellPos);
    },

    clearMap() {
        this.mapLayout.node.removeAllChildren();
        this.mapObjectHolder.removeAllChildren();
        // this.socketIOManager.game.updateWalkableGridMap([]);
        this.gameController.clearHeroes();
        this.gameController.clearBosses();
    }


    // update (dt) {},
});

// export default MapController;
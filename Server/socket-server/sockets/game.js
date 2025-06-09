const logicHandler = require('../handler/logicHandler');

function gameEvents(io, socket) {
    // ============= init =============
    // ================================
    socket.on('INIT_DATA', () => {
        let roomName = logicHandler.common.getRoomNameBySocketId(socket.id);
        if (!roomName) {
            console.error('Không tìm thấy phòng cho socket ID:', socket.id);
            return;
        }

        let roomData = logicHandler.common.readRoomData();
        if (!roomData[roomName]) {
            console.error('Không tìm thấy dữ liệu phòng:', roomName);
            return;
        }

        let playerData = [];
        roomData[roomName].player.forEach(playerObj => {
            const playerId = Object.keys(playerObj)[0];
            const playerInfo = playerObj[playerId];
            const heroData = logicHandler.common.getCharacterData(playerInfo.lockedHero);
            if (!heroData) {
            console.error('Không tìm thấy dữ liệu hero cho lockedHero:', playerInfo.lockedHero);
            return;
            }
            playerData[playerInfo.order] = {
                lockedHero: playerInfo.lockedHero,
                id: heroData.id,
                hp: heroData.maxHp,
                maxHp: heroData.maxHp,
                name: heroData.name,
            };
        });

        io.to(socket.id).emit('DATA_INITIALIZED', {
            // roomData: roomData[roomName]
            heroData: playerData,
        });
    });

    socket.on('GET_INGAME_DATA', () => {

    })


    socket.on('GET_PLAYER_ORDER', () => {
        const roomName = logicHandler.common.getRoomNameBySocketId(socket.id);
        if (!roomName) {
            console.error('Không tìm thấy phòng cho socket ID:', socket.id);
            return;
        }

        let roomData = logicHandler.common.readRoomData();
        const playerId = socket.id;
        const player = roomData[roomName].player.find(playerObj => Object.keys(playerObj)[0] === playerId);

        if (!player) {
            console.error('Không tìm thấy người chơi với socket ID:', socket.id);
            return;
        }

        let order = player[playerId].order;

        // io.to(roomName).emit('PLAYER_ORDER', {
        //     order: order
        // });
        socket.emit('PLAYER_ORDER', {
            order: order
        });
    })

    socket.on('INITIALIZE_GAME', () => {
        let roomName = logicHandler.common.getRoomNameBySocketId(socket.id);
        if (!roomName) {
            console.error('Không tìm thấy phòng cho socket ID:', socket.id);
            return;
        }
        
        let roomData = logicHandler.common.readRoomData();

        // lấy dữ liệu id + order + lockedHero của người chơi 
        let playerData = logicHandler.game.getPlayerGameData(roomData, roomName);
        if (!playerData) {
            console.error('Không tìm thấy dữ liệu người chơi trong dữ liệu phòng:', roomName);
            return;
        }

        // tạo dữ liệu mảng heroes cho người chơi (thứ tự là theo order)
        let heroes = [];
        playerData.forEach(player => {
            let playerId = player.id;
            let order = player.order;
            let lockedHero = player.lockedHero;

            let heroData = logicHandler.common.getCharacterData(lockedHero);

            if (!heroData) {
            }

            heroes[order] = {
                id: playerId,
                order: order,
                lockedHero: lockedHero,
                // heroData: heroData
                heroId: heroData.id,
                hp: heroData.maxHp,
                maxHp: heroData.maxHp,
                attackDamage: heroData.attackDamage,
                attackRange: heroData.attackRange,
                name: heroData.name,

                status: "ALIVE",
                stats: {
                    totalDameDeal: 0,
                    totalDameTaken: 0,

                    totalScore: 0 + Math.floor(Math.random() * 10), // điểm số ngẫu nhiên ban đầu
                }
            };
        })



        // mặc định 1 map 1 boss
        let bosses = [];
        let bossData = logicHandler.common.getBossDataByIndex(roomData[roomName].gameState.currentMapIndex);

        if (!bosses) {
            console.error('Không tìm thấy dữ liệu boss cho bản đồ hiện tại:', roomData[roomName].gameState.currentMapIndex);
            return;
        }

        bosses[0] = {
            bossId: bossData.id,
            hp: bossData.maxHp,
            maxHp: bossData.maxHp,
            attackDamage: bossData.attackDamage,
            attackRange: bossData.attackRange,
            name: bossData.name,
        }


        // roomData[roomName].gameState.bosses = bosses;

        // thêm dữ liệu heroes vào roomdata với key là heroes

        roomData[roomName].gameState.heroes = heroes;
        roomData[roomName].gameState.bosses = bosses;

        logicHandler.common.writeRoomData(roomData);
    })

    socket.on('GET_ATTACK_DAME', (data) => {
        let roomName = logicHandler.common.getRoomNameBySocketId(socket.id);
        if (!roomName) {
            console.error('Không tìm thấy phòng cho socket ID:', socket.id);
            return;
        }
        
        let roomData = logicHandler.common.readRoomData();
        let heroes = roomData[roomName].gameState.heroes;

        let attackDamage = heroes[data.playerOrder].attackDamage;

        socket.emit('RETURN_ATTACK_DAME', {
            attackDamage: attackDamage,
        });
    })

    socket.on('OTHER_PLAYER_ATTACK', (data) => {
        let roomName = logicHandler.common.getRoomNameBySocketId(socket.id);
        console.log('other player attack', data);
        io.to(roomName).emit('LISTEN_ATTACK', {
            playerOrder: data.playerOrder,
            targetOrder: data.targetOrder,
            isBoss: data.isBoss,
        });
    })

    socket.on('MOVE_TO_NEW_TILE', (data) => {
        let roomName = logicHandler.common.getRoomNameBySocketId(socket.id);
        if (!roomName) {
            console.error('Không tìm thấy phòng cho socket ID:', socket.id);
            return;
        }

        console.warn('Yêu cầu di chuyển đến ô mới từ client:', socket.id, 'Data:', data);
        io.to(roomName).emit('LISTEN_MOVE_TO_NEW_TILE', 
            data
        );

    })

    socket.on('UPDATE_WALKABLE_GRID_MAP', (data) => {
        let roomName = logicHandler.common.getRoomNameBySocketId(socket.id);
        if (!roomName) {
            console.error('Không tìm thấy phòng cho socket ID:', socket.id);
            return;
        }   

        let roomData = logicHandler.common.readRoomData();

        let walkableGridMap = logicHandler.game.getWalkableGridMap(roomData, roomName);


        if (!walkableGridMap) {
            console.error('Không tìm thấy bản đồ ô đi lại trong dữ liệu phòng:', roomName);
            return;
        }
        logicHandler.game.updateWalkableGridMap(roomData, roomName, data.x, data.y, data.isWalkable);
        
        logicHandler.common.writeRoomData(roomData);

        io.to(roomName).emit('WALKABLE_GRID_MAP_UPDATED', {
            walkableGridMap: walkableGridMap,
        });
    })

    socket.on('GET_WALKABLE_GRID_MAP', () => {
        let roomName = logicHandler.common.getRoomNameBySocketId(socket.id);
        if (!roomName) {
            console.error('Không tìm thấy phòng cho socket ID:', socket.id);
            return;
        }
        
        let roomData = logicHandler.common.readRoomData();
        let walkableGridMap = logicHandler.game.getWalkableGridMap(roomData, roomName);

        if (!walkableGridMap) {
            console.error('Không tìm thấy bản đồ ô đi lại trong dữ liệu phòng:', roomName);
            return;
        }

        io.to(roomName).emit('RETURN_WALKABLE_GRID_MAP', {
            walkableGridMap: walkableGridMap,
        });
    })

    socket.on('FIND_PATH', (data) => {
        let roomName = logicHandler.common.getRoomNameBySocketId(socket.id);
        if (!roomName) {
            console.error('Không tìm thấy phòng cho socket ID:', socket.id);
            return;
        }
        
        let roomData = logicHandler.common.readRoomData();
        let walkableGridMap = logicHandler.game.getWalkableGridMap(roomData, roomName);

        if (!walkableGridMap) {
            console.error('Không tìm thấy bản đồ ô đi lại trong dữ liệu phòng:', roomName);
            return;
        }

        let start = data.start;
        let end = data.end;
        let maxStep = data.maxStep || 3;


        let path = logicHandler.game.findPath(start, end, walkableGridMap, maxStep);

        io.to(roomName).emit('RETURN_PATH', {
            path: path,
        });
    })

    socket.on('NEXT_MAP', () => {
        let roomName = logicHandler.common.getRoomNameBySocketId(socket.id);
        if (!roomName) {
            console.error('Không tìm thấy phòng cho socket ID:', socket.id);
            return;
        }

        console.log('Yêu cầu chuyển sang bản đồ mới từ client:', socket.id);

        let roomData = logicHandler.common.readRoomData();
        let currentMapIndex = roomData[roomName].gameState.currentMapIndex;

        currentMapIndex++;

        // if (currentMapIndex >= roomData[roomName].gameState.mapData.length) {
        //     currentMapIndex = 0;
        // }

        roomData[roomName].gameState.currentMapIndex = currentMapIndex;

        let boss = logicHandler.common.getBossDataByIndex(currentMapIndex);

        let newBoss = {
            bossId: boss.id,
            hp: boss.maxHp,
            maxHp: boss.maxHp,
            attackDamage: boss.attackDamage,
            attackRange: boss.attackRange,
            name: boss.name,
        }

        roomData[roomName].gameState.bosses.push(newBoss);

        logicHandler.common.writeRoomData(roomData);

        io.to(roomName).emit('LISTEN_NEXT_MAP', {
            currentMapIndex: currentMapIndex
        });
    })

    socket.on('GET_CHARACTER_DATA', (data) => {
        let characterData = logicHandler.common.getCharacterById(data.characterId);

        if (!characterData) {
            console.error('Không tìm thấy dữ liệu nhân vật.');
            return;
        }

        console.log('id', data.characterId, 'Gửi dữ liệu nhân vật:', characterData);

        socket.emit('RETURN_CHARACTER_DATA', {
            characterData: characterData,
        });
    })

    socket.on('GET_LEADER_BOARD', () => {
        let roomName = logicHandler.common.getRoomNameBySocketId(socket.id);
        if (!roomName) {
            console.error('Không tìm thấy phòng cho socket ID:', socket.id);
            return;
        }

        let roomData = logicHandler.common.readRoomData();
        let heroes = roomData[roomName].gameState.heroes;
        let players = roomData[roomName].player;

        if (!heroes) {
            console.error('Không tìm thấy dữ liệu heroes trong dữ liệu phòng:', roomName);
            return;
        }
        let leaderBoard = [];
        heroes.forEach(hero => {
            const playerObj = players.find(p =>
                Object.values(p)[0].order === hero.order
            );

            if (playerObj) {
                const playerInfo = Object.values(playerObj)[0]; // Truy xuất thông tin người chơi
                leaderBoard.push({
                    playerName: playerInfo.name,
                    totalScore: hero.stats.totalScore,
                });
            } else {
                console.warn('Không tìm thấy người chơi với order:', hero.order);
            }
        });

        leaderBoard.sort((a, b) => b.totalScore - a.totalScore);
        // Sắp xếp heroes theo tổng điểm (totalScore) giảm dần
        // heroes.sort((a, b) => b.stats.totalScore - a.stats.totalScore);

        io.to(roomName).emit('RETURN_LEADER_BOARD', {
            leaderBoard: leaderBoard,
        });
    })

    socket.on('TAKE_DAME', (data) => {
        let roomName = logicHandler.common.getRoomNameBySocketId(socket.id);
        if (!roomName) {
            console.error('Không tìm thấy phòng cho socket ID:', socket.id);
            return;
        }


        let roomData = logicHandler.common.readRoomData();
        let heroes = roomData[roomName].gameState.heroes;

        if (!heroes) {
            console.error('Không tìm thấy dữ liệu heroes trong dữ liệu phòng:', roomName);
            return;
        }

        let dealderId = data.dealerId;
        let isHero = logicHandler.common.isHero(dealderId);
        
        let characterId = data.characterId;
        let characterData = logicHandler.common.getInGameCharacterData(characterId, roomData, roomName);

        if (!characterData) {
            console.error('Không tìm thấy dữ liệu nhân vật với ID:', characterId);
            return;
        }
        characterData.hp -= data.dame;

        if (characterData.hp <= 0) {
            characterData.hp = 0;
            characterData.status = "DEAD";
        }

        if (isHero) {
            let hero = heroes.find(hero => hero.heroId === dealderId);
            if (!hero) {
                console.error('Không tìm thấy hero với ID:', dealderId);
                return;
            }
            hero.stats.totalDameDeal += data.dame;
            hero.stats.totalScore += data.dame;

            roomData[roomName].gameState.heroes = heroes;

            let bosses = roomData[roomName].gameState.bosses;
            let boss = bosses.find(boss => boss.bossId === characterId);
            if (boss) {
                boss.hp = characterData.hp;

                roomData[roomName].gameState.bosses = bosses;

                logicHandler.common.writeRoomData(roomData);

                console.log('Boss bị tấn công, HP mới:', boss.hp);
                if (boss.hp <= 0) {
                    io.to(roomName).emit('BOSS_DIE');
                }
            } else {
                console.error('Không tìm thấy boss với ID:', characterId);
            }
        } else {
            let hero = heroes.find(hero => hero.heroId === characterId);
            if (!hero) {
                console.error('Không tìm thấy hero với ID:', characterId);
                return;
            }
            hero.stats.totalDameTaken += data.dame;
            hero.stats.totalScore += data.dame;
            hero.hp = characterData.hp;
            
            roomData[roomName].gameState.heroes = heroes;

            logicHandler.common.writeRoomData(roomData);
        }


        io.to(roomName).emit('LISTEN_TAKE_DAME', {
            characterId: characterId,
            newHp: characterData.hp,
        })
    })

    socket.on('GET_CURRENT_HP', (data) => {
        let roomName = logicHandler.common.getRoomNameBySocketId(socket.id);
        if (!roomName) {
            console.error('Không tìm thấy phòng cho socket ID:', socket.id);
            return;
        }

        let roomData = logicHandler.common.readRoomData();
        let characterId = data.characterId;
        let characterData = logicHandler.common.getInGameCharacterData(characterId, roomData, roomName);

        if (!characterData) {
            console.error('Không tìm thấy dữ liệu nhân vật với ID:', characterId);
            return;
        }

        socket.emit('RETURN_CURRENT_HP', {
            currentHp: characterData.hp,
        });
    })

    socket.on('BOSS_ATTACK', (data) => {
        let roomName = logicHandler.common.getRoomNameBySocketId(socket.id);
        if (!roomName) {
            console.error('Không tìm thấy phòng cho socket ID:', socket.id);
            return;
        }

        let roomData = logicHandler.common.readRoomData();
        let heroes = roomData[roomName].gameState.heroes;

        if (!heroes) {
            console.error('Không tìm thấy dữ liệu heroes trong dữ liệu phòng:', roomName);
            return;
        }

        let bossId = data.enemyId;
        let heroId = data.heroId;

        let boss = roomData[roomName].gameState.bosses.find(b => b.bossId === bossId);
        if (!boss) {
            console.error('Không tìm thấy boss với ID:', bossId);
            return;
        }

        let hero = heroes.find(h => h.heroId === heroId);
        if (!hero) {
            console.error('Không tìm thấy hero với ID:', heroId);
            return;
        }

        // Tính sát thương từ boss
        let damage = boss.attackDamage;
        hero.hp -= damage;
        if (hero.hp <= 0) {
            hero.hp = 0;
            hero.status = "DEAD";
        }

        hero.stats.totalDameTaken += damage;
        hero.stats.totalScore += damage;
        roomData[roomName].gameState.heroes = heroes;
        logicHandler.common.writeRoomData(roomData);
        console.log('Boss tấn công hero:', heroId, 'Sát thương:', damage, 'HP mới:', hero.hp);

        io.to(roomName).emit('LISTEN_BOSS_ATTACK', {
            bossId: bossId,
            heroId: heroId,
        });
    });

    socket.on('GET_HEROES', ()  => {
        let roomName = logicHandler.common.getRoomNameBySocketId(socket.id);
        if (!roomName) {
            console.error('Không tìm thấy phòng cho socket ID:', socket.id);
            return;
        }

        let roomData = logicHandler.common.readRoomData();
        let heroes = roomData[roomName].gameState.heroes;

        if (!heroes) {
            console.error('Không tìm thấy dữ liệu heroes trong dữ liệu phòng:', roomName);
            return;
        }

        socket.emit('RETURN_HEROES', {
            heroes: heroes,
        });
    })

    socket.on('GET_BOSSES', () => {
        let roomName = logicHandler.common.getRoomNameBySocketId(socket.id);
        if (!roomName) {
            console.error('Không tìm thấy phòng cho socket ID:', socket.id);
            return;
        }

        let roomData = logicHandler.common.readRoomData();
        let bosses = roomData[roomName].gameState.bosses;

        if (!bosses) {
            console.error('Không tìm thấy dữ liệu bosses trong dữ liệu phòng:', roomName);
            return;
        }

        socket.emit('RETURN_BOSSES', {
            bosses: bosses,
        });
    })

    socket.on('GET_CURRENT_GAME_DATA', () => {
        let roomName = logicHandler.common.getRoomNameBySocketId(socket.id);
        if (!roomName) {
            console.error('Không tìm thấy phòng cho socket ID:', socket.id);
            return;
        }

        let roomData = logicHandler.common.readRoomData();
        if (!roomData[roomName]) {
            console.error('Không tìm thấy dữ liệu phòng:', roomName);
            return;
        }

        let gameState = roomData[roomName].gameState;

        if (!gameState) {
            console.error('Không tìm thấy trạng thái trò chơi trong dữ liệu phòng:', roomName);
            return;
        }

        socket.emit('RETURN_CURRENT_GAME_DATA', {
            gameState: gameState,
        });
    })

    socket.on('GET_MAP_INDEX', () => {
        let roomName = logicHandler.common.getRoomNameBySocketId(socket.id);
        if (!roomName) {
            console.error('Không tìm thấy phòng cho socket ID:', socket.id);
            return;
        }

        let roomData = logicHandler.common.readRoomData();
        if (!roomData[roomName]) {
            console.error('Không tìm thấy dữ liệu phòng:', roomName);
            return;
        }

        let currentMapIndex = roomData[roomName].gameState.currentMapIndex;

        console.log('Yêu cầu lấy chỉ số bản đồ hiện tại từ client:', socket.id, 'Chỉ số bản đồ:', currentMapIndex);
        socket.emit('RETURN_MAP_INDEX', {
            currentMapIndex: currentMapIndex,
        });
    })
}

module.exports = gameEvents;
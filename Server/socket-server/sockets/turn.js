const logicHandler = require('../handler/logicHandler');

function turnEvents(io, socket) {
  socket.on('IS_PLAYER_TURN', () => {
    let roomName = logicHandler.common.getRoomNameBySocketId(socket.id);
    if (!roomName) {
      console.error('Room not found for socket:', socket.id);
      return;
    }

    let roomData = logicHandler.common.readRoomData(roomName);

    if (!roomData) {
      console.error('Room data not found for room:', roomName);
      return;
    }

    let isPlayerTurn = logicHandler.turn.isPlayerTurn(roomData, roomName);

    io.to(roomName).emit('IS_PLAYER_TURN_RESPONSE', {
      isPlayerTurn: isPlayerTurn,
    });
  });

  socket.on('GET_REMAINING_ACTIONS', () => {
    let roomName = logicHandler.common.getRoomNameBySocketId(socket.id);
    if (!roomName) {
      console.error('Room not found for socket:', socket.id);
      return;
    }

    let roomData = logicHandler.common.readRoomData(roomName);

    if (!roomData) {
      console.error('Room data not found for room:', roomName);
      return;
    }

    let remainingActions = logicHandler.turn.getRemainActions(roomData, roomName);
    
    socket.emit('REMAINING_ACTIONS_RESPONSE', {
      remainingActions: remainingActions,
    });
  });

  socket.on('CONSUME_ACTION', () => {
    let roomName = logicHandler.common.getRoomNameBySocketId(socket.id);
    if (!roomName) {
      console.error('Room not found for socket:', socket.id);
      return;
    }

    let roomData = logicHandler.common.readRoomData(roomName);

    if (!roomData) {
      console.error('Room data not found for room:', roomName);
      return;
    }

    let remainingActions = logicHandler.turn.getRemainActions(roomData, roomName);
    remainingActions -= 1;
    if (remainingActions <= 0) {
      remainingActions = 0;
      roomData[roomName].gameState.turn.isPlayerTurn = false;

      let randomNumber = Math.random();
      console.log('Random number for health orb spawn:', randomNumber);
      if (randomNumber < 0.9) {
        let currentMapIndex = roomData[roomName].gameState.currentMapIndex;
        let mapSize = logicHandler.common.getMapSizeByIndex(currentMapIndex);

        console.log(mapSize.width, mapSize.height);

        let randomX = Math.floor(Math.random() * mapSize.width);
        let randomY = Math.floor(Math.random() * mapSize.height);

        while(roomData[roomName].gameState.walkableGridMap[randomX][randomY] == false) {
          randomX = Math.floor(Math.random() * mapSize.width);
          randomY = Math.floor(Math.random() * mapSize.height);
        }

        let healthOrbPosition = {
          x: randomX,
          y: randomY,
        };

        io.to(roomName).emit('SPAWN_HEALTH_ORB', {
          healthOrbPosition: healthOrbPosition,
        });

      }
      io.to(roomName).emit('BOSS_TURN');
    }

    roomData[roomName].gameState.turn.remainingPlayerActions = remainingActions;
    logicHandler.common.writeRoomData(roomData);
  });

  socket.on('END_BOSS_TURN', () => {
    let roomName = logicHandler.common.getRoomNameBySocketId(socket.id);
    if (!roomName) {
      console.error('Room not found for socket:', socket.id);
      return;
    }

    let roomData = logicHandler.common.readRoomData(roomName);

    if (!roomData) {
      console.error('Room data not found for room:', roomName);
      return;
    }

    roomData[roomName].gameState.turn.isPlayerTurn = true;
    roomData[roomName].gameState.turn.remainingPlayerActions = roomData[roomName].gameState.turn.maxPlayerActions;

    logicHandler.common.writeRoomData(roomData);
    io.to(roomName).emit('END_BOSS_TURN_RESPONSE');
  })
}

module.exports = turnEvents;
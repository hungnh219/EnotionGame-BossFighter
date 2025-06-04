let heroSelects = {}
let lockedHeroes = {}
function selectHeroEvents(io, socket) {

    // =================== các xử lý cho 1 client ===================   
    socket.on('SELECT_HERO', (heroIndex) => {
        console.log('Yêu cầu chọn hero từ client:', socket.id, 'Hero Index:', heroIndex);

        heroSelects[socket.id] = heroIndex;

        console.log('Hero selections:', heroSelects);
        // Emit the selected hero index to all clients
        io.emit('HERO_SELECTED', {
            socketId: socket.id,
            heroIndex: heroIndex,
        });

        // socket.broadcast.emit('HERO_SELECTED', {
        //     socketId: socket.id,
        //     heroIndex: heroIndex,
        // });

    })

    socket.on('LOCK_HERO', (heroIndex) => {
        console.log('Yêu cầu khóa hero từ client:', socket.id, 'Hero Index:', heroIndex);
        lockedHeroes[socket.id] = heroIndex;

        io.emit('HERO_LOCKED', {
            socketId: socket.id,
            heroIndex: heroIndex,
        });
        console.log('Locked heroes:', lockedHeroes);
    })

    // socket.on()
    // =================== các xử lý tất cả client ===================

    // broadcast hero selection to all clients
    socket.on('HERO_SELECTED', (data) => {
        console.log('Hero selected by client:', data.socketId, 'Hero Index:', data.heroIndex);
    });

    // Handle disconnection
    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
        delete heroSelects[socket.id]; // Remove the hero selection for the disconnected client
    });
}

module.exports = selectHeroEvents;
let ioObject = {}

const connect = (server) => {
    ioObject['io'] = require('socket.io')(server, {
        allowEIO3: true,
        cors: {
            origin: true,
            credentials: true
        }
    })

    console.log('Created socket')
    
    ioObject.io.on('connection', (socket) => {
        console.log(`New socket connected! id: ${socket.id}`)
    })
}

module.exports = {
    ioObject,
    connect
}
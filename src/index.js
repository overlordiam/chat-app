const express = require('express')
const http = require('http')
const path = require('path')
const socketio = require('socket.io')
const Filter = require('bad-words')

const { addUser, removeUser, getUser, getUsersInRoom } = require('./utils/users')
const { generateMessage, generateLocationMessage } = require('./utils/messages')

const port = process.env.PORT || 3000

const app = express()
const server = http.createServer(app)
const io = socketio(server)

const publicDirectoryPath = path.join(__dirname, '../public')

app.use(express.static(publicDirectoryPath))

io.on('connection', (socket) => {
    console.log('New connection to server')

    socket.on('join', ( options, callback) => {
        const { error, user } = addUser({id: socket.id, ...options })

        if(error) {
           return callback(error)
        }
        socket.join(user.room)

        socket.emit('message', generateMessage('Admin', 'Welcome!'))
        socket.broadcast.to(user.room).emit('message', generateMessage('Admin', `${user.username} has joined the room!`))

        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room)
        })

        callback()
    })
    

    socket.on('clientMessage', (message, callback) => {
        const filter = new Filter()

        if(filter.isProfane(message)) {
            return callback('Profanity is denied')
        }

        const user = getUser(socket.id)

        io.to(user.room).emit('message', generateMessage(user.username, message))
        callback()
    })

    socket.on('sendLocation', ({ latitude, longitude }, callback) => {

        const user = getUser(socket.id)
        io.to(user.room).emit('locationMessage',
        generateLocationMessage(user.username, `https://google.com/maps?q=${latitude},${longitude}`))
        callback()
    })
    
    socket.on('disconnect', () => {
        const user = removeUser(socket.id)

        if(user) {
            io.to(user.room).emit('message', generateMessage('Admin', `${user.username} has left the room!`))
            io.to(user.room).emit('roomData', {
                rooom: user.room,
                users: getUsersInRoom(user.room)
            })
        }
    })

})

server.listen(port, (req, res) => {
    console.log('running on port ' + port)
})
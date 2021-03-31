const socket = io()

//Elements
const $form = document.querySelector('#form')
const $formInput = document.querySelector('#message')
const $formButton = document.querySelector('#formButton')
const $locationButton = document.querySelector('#locationButton')
const $messages = document.querySelector('#messages')

// Templates
const messageTemplate = document.querySelector('#message-template').innerHTML
const locationMessageTemplate = document.querySelector('#location-message-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

// Options
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true })

const autoscroll = () => {
     // new message element
    const $newMessage = $messages.lastElementChild

    // height of the new message
    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

    // visible height
    const visibleHeight = $messages.offsetHeight

    // height of messages container
    const containerHeight = $messages.scrollHeight

    // how far have I scrolled
    const scrollOffset = $messages.scrollTop + visibleHeight

    if(containerHeight - newMessageHeight <= scrollOffset + 1) {
        $messages.scrollTop = $messages.scrollHeight
    }
}

socket.on('message', (message) => {
    console.log(message)
    const html = Mustache.render(messageTemplate, { 
        username: message.username,
        message: message.text,
        createdAt: moment(message.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend', html)
})

socket.on('locationMessage', (message) => {
    console.log(message)
    const html = Mustache.render(locationMessageTemplate, {
     username: message.username,
     url: message.url,
     createdAt: moment(message.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend', html)
})  

socket.on('roomData', ({ room, users }) => {
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    })

    document.querySelector('#sidebar').innerHTML = html
})

$form.addEventListener('submit', (e) => {
    e.preventDefault()
    $formButton.setAttribute('disabled', 'disabled')
    const message = $formInput.value

    socket.emit('clientMessage', message, (error) => {
        $formButton.removeAttribute('disabled')
        $formInput.value = ''
        $formInput.focus()

        if(error) {
           return console.log(error)
        }

        console.log('Message delivered')
    })
})

$locationButton.addEventListener('click', () => {
    if(!navigator.geolocation) {
        return alert('Browser does not support geolocation')
    }
    $locationButton.setAttribute('disabled', 'disabled')

    navigator.geolocation.getCurrentPosition((position) => {
        const { latitude, longitude } = position.coords
        const location = {
            latitude,
            longitude
        }
        socket.emit('sendLocation', location, () => {
            $locationButton.removeAttribute('disabled')
            console.log('Location shared!')
        })
    })

    
})

socket.emit('join', { username, room }, (error) => {
        if(error) {
            alert(error)
            location.href = '/'
        }
        console.log(username)
    })    


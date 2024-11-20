const messagesRooms = [
    // {
    //     room: "room1",
    //     messages: [
    //         {
    //             id: 176,
    //             date: "2024-11-19T08:40:38.000Z",
    //             message: 'egrtgefgertgr',
    //             author: 'Mykola',
    //             room: '1',
    //             status: 0
    //         },
    //         {
    //             id: 175,
    //             date: "2024-11-19T08:40:37.000Z",
    //             message: 'dfvdfgeg',
    //             author: 'Mykola',
    //             room: '1',
    //             status: 0
    //         },
    //     ]
    // },
    // {
    //     room: "room2",
    //     messages: [
    //         {
    //             id: 173,
    //             date: "2024-11-19T08:40:33.000Z",
    //             message: 'dfrgereg',
    //             author: 'Mykola',
    //             room: '1',
    //             status: 0
    //         },
    //         {
    //             id: 150,
    //             date: "2024 - 11 - 18T22: 20: 27.000Z",
    //             message: 'dfgd',
    //             author: 'w',
    //             room: '1',
    //             status: 0
    //         },
    //     ]
    // }
]

const getMessagesRooms = () => messagesRooms;

const updateMessageById = (id, message) => {
    messagesRooms.forEach(room => {
        const updateMessage = room.messages.find(message => message.id === id)
        if (updateMessage) {
            updateMessage.message = message;
        }
    })
}

const deleteMessageById = (id) => {
    messagesRooms.forEach(room => {
        const indexDeleteMessage = room.messages.findIndex(message => message.id === id)
        if (indexDeleteMessage >= 0) {
            room.messages.splice(indexDeleteMessage, 1)
        }
    })
}

//Додаємо повідомлення до масиву в памяті
const addMessageRoom = (date, message, user, room, id) => {
    const messagesRoom = messagesRooms.find((messagesRoom) => messagesRoom.room === room)
    const newMessage = {
        author: user,
        message,
        date,
        status: 0,
        id
    }

    if (!messagesRoom) {
        //Якщо такої кімнати немає то ми її створюємо
        const newMessageRoom = {
            room,
            messages: [newMessage]
        }
        messagesRooms.push(newMessageRoom)
    } else {
        messagesRoom.messages.push(newMessage)
    }
    // console.log('messagesRooms **************** ', messagesRooms[0].messages[0])
    console.log('messagesRooms addMessageRoom **************** ', messagesRooms[0])
}

//Додаємо повідомлення цілої кімнати до масиву в памяті //при підключенні першого користувача
const addMessagesRoom = (messages, room) => {
    console.log('addMessagesRoom room', room)
    const messagesRoom = messagesRooms.find((messagesRoom) => messagesRoom.room === room)

    if (!messagesRoom) {
        //Якщо такої кімнати немає то ми її додаємо
        const newMessageRoom = {
            room,
            messages
        }
        messagesRooms.push(newMessageRoom);
    } else {
        //Якщо існує то ми її заміняємо
        messagesRoom.messages = messages;
    }
    // console.log('messagesRooms **************** ', messagesRooms[0].messages[0])
    // console.log('messagesRooms addMessagesRoom **************** ', messagesRooms[0])
}

const isRoomInMessagesRooms = (room) => {
    const isRoom = messagesRooms.findIndex((messagesRoom) => messagesRoom.room === room)
}

const getMessagesRoom = (room) => {
    const messagesRoom = messagesRooms.find((messagesRoom) => messagesRoom.room === room)
    return structuredClone(messagesRoom);
}

module.exports = {
    updateMessageById,
    deleteMessageById,
    getMessagesRooms,
    addMessageRoom,
    getMessagesRoom,
    addMessagesRoom,
    isRoomInMessagesRooms,
}
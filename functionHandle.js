
const { getIO } = require('./io');
const {
    getMessagesRoom,
} = require('./messages');
const { generateId } = require('./utils');

function handleRemoveUser(user, users) {
    const io = getIO();
    if (user) {
        const { room, name } = user;
        // console.log('handleRemoveUser', room, user)

        const messagesRoom = getMessagesRoom(user.room)
        const randomId = generateId();
        const data = {
            user,
            message: messagesRoom, messageAdmin: {
                message: `${user.name} has left`,
                id: randomId
            }
        }

        // // Отправляем сообщение остальным пользователям в комнате про нового usera крім того що передав повідомлення
        // socket.broadcast.to(room).emit("message", { data })
        // Отправляем сообщение о выходе пользователя из комнаты
        io.to(room).emit("message", { data });
        const newUsers = users.filter((u) => u.room === room)
        // console.log('newUsers sssssssssssss', newUsers
        // Отправляем обновленный список пользователей в комнате
        io.to(room).emit("room", {
            data: { users: newUsers },
        });
    }
}

module.exports = { handleRemoveUser }
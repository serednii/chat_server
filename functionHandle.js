// const { getRoomUsers } = require("./users")
const { getIO } = require('./io');

function handleRemoveUser(user, users = []) {
    const io = getIO();
    if (user) {
        const { room, name } = user;
        console.log('handleRemoveUser', room, user)
        // Отправляем сообщение о выходе пользователя из комнаты
        io.to(room).emit("message", {
            data: { user: { name: "Admin" }, message: `${name} has left` },
        });
        const newUsers = users.filter((u) => u.room === room)
        // Отправляем обновленный список пользователей в комнате
        io.to(room).emit("room", {

            data: { users: newUsers },
        });
    }
}

module.exports = { handleRemoveUser }
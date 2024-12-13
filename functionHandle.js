
const { getIO } = require('./io');
const { generateId } = require('./utils');

function handleRemoveUser(user, users) {
    const io = getIO();
    if (user) {
        const { name, room } = user;

        const message = {
            author: "Admin",
            date: new Date(),
            id: generateId(),
            message: `${name} has left`,
            room
        };

        // Отправляем сообщение остальным пользователям в комнате про нового usera крім того що передав повідомлення
        // Отправляем сообщение о выходе пользователя из комнаты
        io.to(room).emit("messageAdd", { message });
        const newUsers = users.filter((u) => u.room === room)
        // Отправляем обновленный список пользователей в комнате
        io.to(room).emit("room", {
            data: { users: newUsers },
        });
    }
}

module.exports = { handleRemoveUser }
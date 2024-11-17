// socketHandlers.js

// Импортируем функции для работы с пользователями
const { addUser, findUser, getRoomUsers, removeUser, updateDateUsers, sendDataUser, findByIdUser } = require("./users");
const { handleRemoveUser } = require("./functionHandle");
module.exports = (io) => {
    // Обрабатываем событие подключения нового пользователя
    io.on("connection", (socket) => {
        console.log("User connected", socket.id);

        // Обрабатываем событие "join" (присоединение пользователя к комнате)
        socket.on("join", ({ name, room }) => {
            try {
                const userSocketId = socket.id;
                console.log('userSocketId', userSocketId);
                socket.join(room); // Подключаем пользователя к комнате
                console.log("join");
                const newUser = { name, room, userSocketId, time: new Date().getTime(), status: "active" };
                const { user, isExist } = addUser(newUser); // Добавляем пользователя

                sendDataUser(user); // Отправляем данные пользователя
                const userMessage = isExist
                    ? `${user.name}, here you go again`
                    : `Hey my love ${user.name}`;

                // Отправляем сообщение самому пользователю
                socket.emit("message", {
                    data: { user: { name: "Admin" }, message: userMessage },
                });

                // Отправляем сообщение остальным пользователям в комнате про нового usera
                socket.broadcast.to(user.room).emit("message", {
                    data: { user: { name: "Admin" }, message: `${user.name} has joined` },
                });

                // Отправляем обновленный список пользователей в комнате
                io.to(user.room).emit("room", {
                    data: { users: getRoomUsers(user.room) },
                });

            } catch (error) {
                console.log("join ", error);
            }
        });

        // Обрабатываем событие "sendMessage" (отправка сообщения)
        socket.on("sendMessage", ({ message, params }) => {
            try {
                console.log("sendMessage params", params);
                const user = findUser(params);
                if (user) {
                    updateDateUsers(params); // Обновляем данные пользователя
                    io.to(user.room).emit("message", { data: { user, message } }); // Отправляем сообщение в комнату
                }
            } catch (error) {
                console.log("sendMessage ", error);
            }
        });

        // Обрабатываем событие "sendWrite" (уведомление о наборе текста)
        socket.on("sendWrite", ({ isWrite, params }) => {
            try {
                console.log("sendWrite params", params);
                const user = findUser(params);
                if (user) {
                    updateDateUsers(params); // Обновляем данные пользователя
                    io.to(user.room).emit("messageWrite", { data: { user, isWrite } }); // Отправляем уведомление в комнату
                }
            } catch (error) {
                console.log("sendWrite ", error);
            }
        });

        // Обрабатываем событие "leftRoom" (пользователь покинул комнату)
        socket.on("leftRoom", ({ params }) => {
            try {
                const user = removeUser(params);
                if (user) {
                    handleRemoveUser(user)
                }
            } catch (error) {
                console.log("leftRoom ", error);
            }
        });





        // Обрабатываем событие отключения пользователя
        socket.on("disconnect", () => {
            console.log("User disconnected");
            console.log(socket.id);
            const user = removeUser(findByIdUser(socket.id));

            if (user) {
                const { room, name } = user;

                // Отправляем сообщение о выходе пользователя из комнаты
                io.to(room).emit("message", {
                    data: { user: { name: "Admin" }, message: `${name} has left` },
                });

                // Отправляем обновленный список пользователей в комнате
                io.to(room).emit("room", {
                    data: { users: getRoomUsers(room) },
                });

            }
        });
    });
};

// socketHandlers.js
const {
    insertMessageSQL,
    getMessagesByRoomSQL,
    deleteMessageByIdSQL,
    updateMessageByIdSQL,
} = require('./sql/sqlQueryMessage');

// Импортируем функции для работы с пользователями
const {
    getUsers,
    addUser,
    findUser,
    getRoomUsers,
    removeUser,
    updateDateUsersStatus,
    sendDataUserStatus,
    findByIdUser,
} = require("./users");

const {
    updateMessageById,
    deleteMessageById,
    getMessagesRooms,
    addMessageRoom,
    addMessagesRoom,
    getMessagesRoom,
    isRoomInMessagesRooms
} = require('./messages');

const { handleRemoveUser } = require("./functionHandle");
const { generateId } = require('./utils');

module.exports = (io) => {
    // Обрабатываем событие подключения нового пользователя
    io.on("connection", (socket) => {
        console.log("User connected", socket.id);

        // Обрабатываем событие "join" (присоединение пользователя к комнате)
        socket.on("join", async ({ name, room }) => {
            try {
                const userSocketId = socket.id;
                console.log('userSocketId', userSocketId);
                socket.join(room); // Подключаем пользователя к комнате
                console.log("join");
                const newUser = { name, room, userSocketId, date: new Date().getTime() };
                const { user, isExist } = addUser(newUser); // Добавляем пользователя
                console.log('room', user.room);

                //Обновляємо статус користувача якщо він проявив активнісь поновляємо дату активності 
                sendDataUserStatus(user); // Отправляем данные пользователя
                const userMessage = isExist
                    ? `${user.name}, here you go again`
                    : `Hey my love ${user.name}`;

                //Перевіряємо чи є в масиві кімнат кімната на яку зайшов користувач
                const isRoom = isRoomInMessagesRooms(room)
                // let messagesRoomSQL = null

                //Якщо нема то витягаємо з бази даних SQL і поміщаємо в масив в памяті
                if (!isRoom) {
                    const messagesRoomSQL = await getMessagesByRoomSQL(user.room)
                    addMessagesRoom(messagesRoomSQL, user.room)
                }

                const data = getMessagesRoom(user.room)
                console.log('XXXXXXXXX', data)
                const adminMessage = {
                    author: "Admin",
                    room,
                    date: new Date(),
                    id: generateId(),
                    message: userMessage,
                };

                console.log('messagesRoom*-*-*-*-*-*-*-*-*-', data);
                data.messages.push(adminMessage)
                // const newMessagesRoom = [...messagesRoom].push(adminMessage);

                // data?.message?.messages?.push(adminMessage);

                // const randomId = generateId();
                // const data = {
                //     user: { name: "Admin" },
                //     message: messagesRoom,
                //     messageAdmin: {
                //         message: userMessage,
                //         id: randomId
                //     }
                // }

                // const data = { ...messagesRoom }

                // Отправляем сообщение самому пользователю
                socket.emit("messageStart", { messages: data.messages });

                // // Отправляем сообщение остальным пользователям в комнате про нового usera крім того що передав повідомлення
                // data.messageAdmin.message = `${user.name} has joined`;
                // adminMessage.message = `${user.name} has joined`
                adminMessage.message = `${user.name} has joined`

                socket.broadcast.to(user.room).emit("messageAdd", { message: adminMessage });

                //    // Отправляем сообщение самому пользователю
                //    socket.emit("message", {
                //     data: { user: { name: "Admin" }, message: userMessage },
                // });

                // // Отправляем сообщение остальным пользователям в комнате про нового usera
                // socket.broadcast.to(user.room).emit("message", {
                //     data: { user: { name: "Admin" }, message: `${user.name} has joined` },
                // });

                //Відправка повідомлення окремому користувачу
                // const socketId = findUserByName('q')
                // if (socketId) {
                //     io.to(socketId.userSocketId).emit('privateMessage', { data: "HELLO PRIVATE MESSAGE" });
                // }
                // else {
                //     console.log('User not connected or does not exist.');
                // }

                // // Отправляем сообщение самому пользователю
                // socket.emit("message", {
                //     data: { user: { name: "Admin" }, message: userMessage },
                // });

                // // Отправляем сообщение остальным пользователям в комнате про нового usera
                // socket.broadcast.to(user.room).emit("message", {
                //     data: { user: { name: "Admin" }, message: `${user.name} has joined` },
                // });

                // Отправляем обновленный список пользователей в комнате
                io.to(user.room).emit("room", {
                    data: { users: getRoomUsers(user.room) },
                });

            } catch (error) {
                console.log("join ", error);
            }
        });

        // Обрабатываем событие "sendMessage" (приймаємо повідоомлення від користувача)

        socket.on("sendMessage", async ({ message, params }) => {
            try {
                console.log("sendMessage params", message, params);
                const user = findUser(params);
                if (user) {
                    const date = new Date()
                    const insertId = await insertMessageSQL(date, message, params.name, params.room);
                    addMessageRoom(date, message, params.name, params.room, insertId);
                    // const messagesRoom = getMessagesRoom(params.room);

                    const messageOut = {
                        author: params.name,
                        date,
                        id: insertId,
                        message,
                        room: params.room,
                    };

                    console.log('insertId***** ****** **** ** **', insertId);
                    io.to(user.room).emit("messageAdd", { message: messageOut }); // Отправляем сообщение в комнату
                    updateDateUsersStatus(params); // Обновляем данные пользователя
                }
            } catch (error) {
                console.log("sendMessage ", error);
            }
        });

        socket.on("deleteMessageByIdServer", async ({ id, room }) => {
            console.log('oooooooooooooooooooooooooo');

            console.log(id);
            console.log(room);
            try {
                const result = await deleteMessageByIdSQL(id);//Удаляємо в базі даних на SQL
                deleteMessageById(id)//Удаляємо в буфері памяті
                socket.emit("deleteMessageByIdUser", { id });// Отправляем сообщение самому пользователю
                io.to(room).emit("deleteMessageByIdUser", { id }); // Отправляем сообщение в комнату
            } catch (error) {
                console.log("deleteMessage ", error);
            }
        });

        socket.on("updateMessageByIdServer", async ({ id, room, message }) => {
            console.log('oooooooooooooooooooooooooo');

            try {
                const result = await updateMessageByIdSQL(id, message);//Удаляємо в базі даних на SQL
                updateMessageById(id, message)//Удаляємо в буфері памяті
                const messagesRoom = getMessagesRoom(room)
                console.log('messagesRoom', messagesRoom)
                socket.emit("updateMessageByIdUser", { id, message });// Отправляем сообщение самому пользователю
                io.to(room).emit("updateMessageByIdUser", { id, message }); // Отправляем сообщение в комнату
            } catch (error) {
                console.log("updateMessageById ", error);
            }
        });


        // Обрабатываем событие "sendWrite" (уведомление о наборе текста)
        socket.on("sendWrite", ({ isWrite, params }) => {
            try {
                console.log("sendWrite params", params);
                console.log("sendWrite isWrite", isWrite);

                const user = findUser(params);
                if (user) {
                    updateDateUsersStatus(params); // Обновляем данные пользователя
                    io.to(user.room).emit("messageWrite", { data: { user, isWrite } }); // Отправляем уведомление в комнату
                }
            } catch (error) {
                console.log("sendWrite ", error);
            }
        });

        // Обрабатываем событие "leftRoom" (пользователь покинул комнату)
        socket.on("leftRoom", ({ params, }) => {
            try {
                const user = removeUser(params);
                if (user) {
                    handleRemoveUser(user, getUsers())
                }
            } catch (error) {
                console.log("leftRoom ", error);
            }
        });



        // Обрабатываем событие отключения пользователя
        socket.on("connected", () => {
            console.log("User eeeeeeeeeeeeeeeeeeeeeeeeeee");
            console.log(socket.id);
        });

        // Обрабатываем событие отключения пользователя
        socket.on("disconnect", () => {
            console.log("User disconnected");
            console.log(socket.id);
            console.log(findByIdUser(socket.id));
            const user = removeUser(findByIdUser(socket.id));
            handleRemoveUser(user, getUsers());
            console.log(user);
            // if (user) {
            //     const { room, name } = user;

            //     // Отправляем сообщение о выходе пользователя из комнаты
            //     io.to(room).emit("message", {
            //         data: { user: { name: "Admin" }, message: `${name} has left` },
            //     });

            //     // Отправляем обновленный список пользователей в комнате
            //     io.to(room).emit("room", {
            //         data: { users: getRoomUsers(room) },
            //     });

            // }
        });
    });
};

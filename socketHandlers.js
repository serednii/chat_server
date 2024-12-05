// socketHandlers.js
const {
    insertMessageSQL,
    deleteMessageByIdSQL,
    updateMessageByIdSQL,
    recordExistsLastIdMessageSQL,
    insertRecordLastIdMessageSQL,
    updateRecordLastIdMessageSQL,
    getFirstMessageByRoomSQL,
    getNextMessagesByRoomFromIdSQL,
    getPrevMessagesByRoomFromIdSQL,
    readRecordFirstIdMessageSQL,
    getLastMessageByRoomSQL,
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
    deleteMessageById,
    addMessageRoom,
    getMessagesRoom,
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
                // const isRoom = isRoomInMessagesRooms(room)
                // let messagesRoomSQL = null;

                //Якщо нема то витягаємо з бази даних SQL і поміщаємо в масив в памяті
                // if (!isRoom) {
                //     const messagesRoomSQL = await getLastMessagesByRoomSQL(user.room, 25)
                //     console.log('KKKKKKK', messagesRoomSQL[[0]])
                //     // addMessagesRoom(messagesRoomSQL, user.room)
                // }

                //Перевіряємо чи є запис останнього id останнього переглянутого повідомлення
                const res = await recordExistsLastIdMessageSQL(name, room);
                console.log('HHHHHHHH', res, name, room)
                let messages, startIdMessage;
                startIdMessage = await readRecordFirstIdMessageSQL(name, room);//return 	last_viewed_message_id
                const firstMessageId = await getFirstMessageByRoomSQL(room)
                const lastMessageId = await getLastMessageByRoomSQL(room)
                const data = {
                    viewMessageId: startIdMessage[0]?.last_viewed_message_id,
                    firstMessageId: firstMessageId.id,
                    lastMessageId: lastMessageId.id
                }
                if (res) {
                    //Якщо повідомлення є то беремо останнє прочитане повідомлення



                    let startLimit = 50 - (lastMessageId.id - startIdMessage[0].last_viewed_message_id)
                    console.log('startLimit', lastMessageId.id, startIdMessage[0].last_viewed_message_id, startLimit)
                    let firstMessages = []
                    if (startLimit > 0 && 50 >= startLimit) {
                        firstMessages = await getPrevMessagesByRoomFromIdSQL(room, startIdMessage[0].last_viewed_message_id, startLimit);
                    }
                    // if(lastMessageId.id)
                    messages = await getNextMessagesByRoomFromIdSQL(room, startIdMessage[0].last_viewed_message_id, 50);
                    messages = [...firstMessages, ...messages];

                    // await updateRecordLastIdMessageSQL(name, room, startIdMessage.id)
                    console.log('PPPPPPPP', startIdMessage)
                } else {
                    //Якщо повідомлення немає  то беремо перше повідомлення
                    startIdMessage = await getFirstMessageByRoomSQL(room);
                    await insertRecordLastIdMessageSQL(name, room, startIdMessage.id);
                    messages = await getNextMessagesByRoomFromIdSQL(room, startIdMessage.id, 50);
                    console.log('LLLLLLLL', startIdMessage)//return id
                }

                // console.log('messagesRoom*-*-*-*-*-*-*-*-*-', messages);
                // console.log('messagesRoom*-*-*-*-*-*-*-*-*-', [...messages]);
                const adminMessage = {
                    author: "Admin",
                    room,
                    date: new Date(),
                    id: generateId(),
                    message: userMessage,
                };
                // console.log('messagesRoom*-*-*-*-*-*-*-*-*-', [...messages]);
                messages.push(adminMessage);

                // Отправляем сообщение самому пользователю
                socket.emit("messageStart", { messages, data });

                // Отправляем сообщение остальным пользователям в комнате про нового usera крім того що передав повідомлення
                adminMessage.message = `${user.name} has joined`

                socket.broadcast.to(user.room).emit("messageAdd", { message: adminMessage });

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
                    addMessageRoom(date, message, params.name, params.room, insertId);//-----------
                    // const messagesRoom = getMessagesRoom(params.room);

                    const messageOut = {
                        author: params.name,
                        date,
                        id: insertId,
                        message,
                        room: params.room,
                    };
                    const startIdMessage = await readRecordFirstIdMessageSQL(params.name, params.room);//return 	last_viewed_message_id
                    const firstMessageId = await getFirstMessageByRoomSQL(params.room)
                    const lastMessageId = await getLastMessageByRoomSQL(params.room)
                    const data = {
                        viewMessageId: startIdMessage.last_viewed_message_id,
                        firstMessageId: firstMessageId.id,
                        lastMessageId: lastMessageId.id
                    }
                    console.log('insertId***** ****** **** ** **', insertId);
                    io.to(user.room).emit("messageAdd", { message: messageOut, data }); // Отправляем сообщение в комнату
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
                deleteMessageById(id)//Удаляємо в буфері памяті--------------------
                socket.emit("deleteMessageByIdUser", { id });// Отправляем сообщение самому пользователю
                io.to(room).emit("deleteMessageByIdUser", { id }); // Отправляем сообщение в комнату
            } catch (error) {
                console.log("deleteMessage ", error);
            }
        });

        socket.on("getPrevMessagesServer", async ({ name, room, startID, limit }) => {
            console.log('NNNNNNNNNNNNNNNNNNNNNNN');
            console.log(startID);
            console.log(room);
            console.log(limit);

            try {
                const messages = await getPrevMessagesByRoomFromIdSQL(room, startID, limit);//Удаляємо в базі даних на SQL
                console.log('getLastMessagesServer nnnnnnnnnnnnnnnnn', messages)
                // Отправляем сообщение самому пользователю
                const startIdMessage = await readRecordFirstIdMessageSQL(name, room);//return 	last_viewed_message_id
                const firstMessageId = await getFirstMessageByRoomSQL(room)
                const lastMessageId = await getLastMessageByRoomSQL(room)
                const data = {
                    viewMessageId: startIdMessage[0].last_viewed_message_id,
                    firstMessageId: firstMessageId.id,
                    lastMessageId: lastMessageId.id
                }
                socket.emit("prevMessagesUser", { messages, data });
            } catch (error) {
                console.log("getPrevMessagesByRoomFromID ", error);
            }

        });

        socket.on("getNextMessagesServer", async ({ name, room, startID, limit }) => {
            console.log('TTTTTTTTTTTTTTTTTTTTTT');
            console.log(startID);
            console.log(room);
            console.log(limit);

            try {
                const messages = await getNextMessagesByRoomFromIdSQL(room, startID, limit);//Удаляємо в базі даних на SQL
                console.log('getLastMessagesServer nnnnnnnnnnnnnnnnn')
                // Отправляем сообщение самому пользователю
                const startIdMessage = await readRecordFirstIdMessageSQL(name, room);//return 	last_viewed_message_id
                const firstMessageId = await getFirstMessageByRoomSQL(room)
                const lastMessageId = await getLastMessageByRoomSQL(room)
                const data = {
                    viewMessageId: startIdMessage[0].last_viewed_message_id,
                    firstMessageId: firstMessageId.id,
                    lastMessageId: lastMessageId.id
                }
                socket.emit("nextMessagesUser", { messages, data });
            } catch (error) {
                console.log("getPrevMessagesByRoomFromID ", error);
            }

        });


        socket.on("updateMessageByIdServer", async ({ id, room, message }) => {
            console.log('oooooooooooooooooooooooooo');

            try {
                const result = await updateMessageByIdSQL(id, message);//Удаляємо в базі даних на SQL
                // updateMessageById(id, message)//Удаляємо в буфері памяті-------
                const messagesRoom = getMessagesRoom(room)
                console.log('messagesRoom', messagesRoom)
                socket.emit("updateMessageByIdUser", { id, message });// Отправляем сообщение самому пользователю
                io.to(room).emit("updateMessageByIdUser", { id, message }); // Отправляем сообщение в комнату
            } catch (error) {
                console.log("updateMessageById ", error);
            }
        });

        socket.on("updateLastIdViewMessageServer", ({ user, room, id }) => {
            console.log('AAAAAAAAAAAAAAAAAAAAAAAAAA', user, room, id);
            try {
                updateRecordLastIdMessageSQL(user, room, id);//обновляємо id 
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




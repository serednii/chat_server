
"use strict"
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
    getMessagesInfoByRoomSQL,
    updateLastViewedMessageId,
    getUsersByRoom,
} = require('./sql/sqlQueryMessage');
``
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

                socket.join(room); // Подключаем пользователя к комнате


                const usersRoom = await getUsersByRoom(room)

                usersRoom.forEach(user => {
                    addUser({ name: user, room, userSocketId: "test", date: new Date().getTime() })
                }
                )

                const newUser = { name, room, userSocketId, date: new Date().getTime() };
                const { user, isExist } = addUser(newUser); // Добавляем пользователя


                //Обновляємо статус користувача якщо він проявив активнісь поновляємо дату активності 
                sendDataUserStatus(user); // Отправляем данные пользователя
                const userMessage = isExist
                    ? `${user.name}, here you go again`
                    : `Hey my love ${user.name}`;
                //Перевіряємо чи є в масиві кімнат кімната на яку зайшов користувач

                //Якщо нема то витягаємо з бази даних SQL і поміщаємо в масив в памяті
                //Перевіряємо чи є запис останнього id останнього переглянутого повідомлення
                const res = await recordExistsLastIdMessageSQL(name, room);

                let messages, startIdMessage;

                const data = await getMessagesInfoByRoomSQL(name, room)

                let { lastMessageId, viewMessageId } = data


                if (res) {
                    //Якщо повідомлення є то беремо останнє прочитане повідомлення
                    let startLimit = 50 - (lastMessageId - viewMessageId)
                    console.log('startLimit', lastMessageId, viewMessageId, startLimit)
                    let firstMessages = [];

                    if (startLimit > 0 && 50 >= startLimit) {
                        firstMessages = await getPrevMessagesByRoomFromIdSQL(room, viewMessageId, startLimit);
                    }

                    // if(lastMessageId.id)
                    messages = await getNextMessagesByRoomFromIdSQL(room, viewMessageId, 50);
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

                const adminMessage = {
                    author: "Admin",
                    room,
                    date: new Date(),
                    id: generateId(),
                    message: userMessage,
                };
                messages.push(adminMessage);

                // Отправляем сообщение самому пользователю
                socket.emit("messageStart", { messages, data });

                // Отправляем сообщение остальным пользователям в комнате про нового usera крім того що передав повідомлення
                adminMessage.message = `${user.name} has joined`

                socket.broadcast.to(user.room).emit("messageAdd", { message: adminMessage, data });

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

                    //відправляємо повідомлення 
                    // const messagesRoom = getMessagesRoom(params.room);

                    const messageOut = {
                        author: params.name,
                        date,
                        id: insertId,
                        message,
                        room: params.room,
                    };

                    const data = await getMessagesInfoByRoomSQL(params.name, params.room)
                    io.to(user.room).emit("messageAdd", { message: messageOut, data }); // Отправляем сообщение в комнату
                    updateDateUsersStatus(params); // Обновляем данные пользователя
                }
            } catch (error) {
                console.log("sendMessage ", error);
            }
        });

        socket.on("deleteMessageByIdServer", async ({ id, room }) => {

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
            console.log('NNNNNNNNNNNNNNNNNNNNNNN', name, room, startID, limit);
            try {
                const messages = await getPrevMessagesByRoomFromIdSQL(room, startID, limit);//Удаляємо в базі даних на SQL
                // Отправляем сообщение самому пользователю
                const data = await getMessagesInfoByRoomSQL(name, room)
                socket.emit("prevMessagesUser", { messages, data });
            } catch (error) {
                console.log("getPrevMessagesByRoomFromID ", error);
            }

        });

        socket.on("getNextMessagesServer", async ({ name, room, startID, limit }) => {
            console.log('TTTTTTTTTTTTTTTTTTTTTT', name, room, startID, limit);
            try {
                // Отправляем сообщение самому пользователю
                const data = await getMessagesInfoByRoomSQL(name, room);
                const messages = await getNextMessagesByRoomFromIdSQL(room, startID, limit);
                socket.emit("nextMessagesUser", { messages, data });
            } catch (error) {
                console.log("getPrevMessagesByRoomFromID ", error);
            }
        });

        socket.on("getNextPrevMessagesServer", async ({ name, room, startID, limit }) => {

            try {
                // Отправляем сообщение самому пользователю
                const data = await getMessagesInfoByRoomSQL(name, room);
                const { lastMessageId } = data
                let prevLimit = limit - (lastMessageId - startID)
                let firstMessages = [];
                let messages = [];
                if (prevLimit > 0 && prevLimit <= limit) {
                    firstMessages = await getPrevMessagesByRoomFromIdSQL(room, startID, prevLimit);
                    messages = await getNextMessagesByRoomFromIdSQL(room, startID + 1, limit - prevLimit);
                } else {
                    messages = await getNextMessagesByRoomFromIdSQL(room, startID, limit);
                }
                messages = [...firstMessages, ...messages];
                socket.emit("nextPrevMessagesUser", { messages, data });
            } catch (error) {
                console.log("nextPrevMessagesUser ", error);
            }

        });

        //Обновляємо повідомлення яке ми змінили 
        socket.on("updateMessageByIdServer", async ({ id, room, message }) => {
            try {
                await updateMessageByIdSQL(id, message);//
                // updateMessageById(id, message)//Удаляємо в буфері памяті-------
                const messagesRoom = getMessagesRoom(room)
                socket.emit("updateMessageByIdUser", { id, message });// Отправляем сообщение самому пользователю
                io.to(room).emit("updateMessageByIdUser", { id, message }); // Отправляем сообщение в комнату
            } catch (error) {
                console.log("updateMessageById ", error);
            }
        });

        //получаємо дані про перший і останній id а також переглянутий id і непрочитанні повідомлення
        socket.on("updateLastIdViewMessageServer", async ({ user, room, id }) => {
            try {

                await updateRecordLastIdMessageSQL(user, room, id);//обновляємо id 
                const data = await getMessagesInfoByRoomSQL(user, room)
                socket.emit("updateDataIdUser", data);// Отправляем сообщение самому пользователю
            } catch (error) {
                console.log("updateMessageById ", error);
            }
        });


        // Обрабатываем событие "sendWrite" (уведомление о наборе текста)
        socket.on("sendWrite", ({ isWrite, params }) => {
            try {
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
        });

        // Обрабатываем событие отключения пользователя
        socket.on("disconnect", () => {
            const user = removeUser(findByIdUser(socket.id));
            handleRemoveUser(user, getUsers());
            console.log(user);
        });




        ///Для тестів
        // Обрабатываем событие "sendWrite" (уведомление о наборе текста)
        socket.on("sendStartNum", async ({ name, room, startID }) => {

            try {
                updateLastViewedMessageId(name, room, startID)

            } catch (error) {
                console.log("sendWrite ", error);
            }
        });


    });
};




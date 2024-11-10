// socketHandlers.js

const { addUser, findUser, getRoomUsers, removeUser, updateDateUsers, sendDataUser } = require("./users");

module.exports = (io) => {
    io.on("connection", (socket) => {
        console.log("User connected", socket.id);

        socket.on("join", ({ name, room }) => {
            try {
                const userSocketId = socket.id;
                console.log('userSocketId', userSocketId);
                socket.join(room);
                console.log("join");
                const newUser = { name, room, userSocketId, time: new Date().getTime(), status: "active" };
                const { user, isExist } = addUser(newUser);

                sendDataUser(user);
                const userMessage = isExist
                    ? `${user.name}, here you go again`
                    : `Hey my love ${user.name}`;

                socket.emit("message", {
                    data: { user: { name: "Admin" }, message: userMessage },
                });

                socket.broadcast.to(user.room).emit("message", {
                    data: { user: { name: "Admin" }, message: `${user.name} has joined` },
                });

                io.to(user.room).emit("room", {
                    data: { users: getRoomUsers(user.room) },
                });

            } catch (error) {
                console.log("join ", error);
            }
        });

        socket.on("sendMessage", ({ message, params }) => {
            try {
                console.log("sendMessage params", params);
                const user = findUser(params);
                if (user) {
                    updateDateUsers(params);
                    io.to(user.room).emit("message", { data: { user, message } });
                }
            } catch (error) {
                console.log("sendMessage ", error);
            }
        });

        socket.on("sendWrite", ({ isWrite, params }) => {
            try {
                console.log("sendWrite params", params);
                const user = findUser(params);
                if (user) {
                    updateDateUsers(params);
                    io.to(user.room).emit("messageWrite", { data: { user, isWrite } });
                }
            } catch (error) {
                console.log("sendWrite ", error);
            }
        });

        socket.on("leftRoom", ({ params }) => {
            try {
                const user = removeUser(params);

                if (user) {
                    const { room, name } = user;

                    io.to(room).emit("message", {
                        data: { user: { name: "Admin" }, message: `${name} has left` },
                    });

                    io.to(room).emit("room", {
                        data: { users: getRoomUsers(room) },
                    });
                }
            } catch (error) {
                console.log("leftRoom ", error);
            }
        });

        socket.on("disconnect", () => {
            console.log("User disconnected");
            const user = removeUser({ userSocketId: socket.id });

            if (user) {
                const { room, name } = user;

                io.to(room).emit("message", {
                    data: { user: { name: "Admin" }, message: `${name} has left` },
                });

                io.to(room).emit("room", {
                    data: { users: getRoomUsers(room) },
                });
            }
        });
    });
};

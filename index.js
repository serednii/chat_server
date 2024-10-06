const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const app = express();

const route = require("./route");
const { addUser, findUser, getRoomUsers, removeUser, updateDateUsers, checkTimeUsers } = require("./users");

app.use(cors({ origin: "*" }));
app.use(route);

const server = http.createServer(app);
// setInterval(() => checkTimeUsers(), 1000 * 10)

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  socket.on("join", ({ name, room }) => {
    try {
      socket.join(room);

      const { user, isExist } = addUser({ name, room, time: new Date().getTime(), status: "active" });

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
      console.log("join ", error)
    }
  });

  socket.on("sendMessage", ({ message, params }) => {
    try {
      // console.log("sendMessage params", params)
      const user = findUser(params);
      if (user) {
        updateDateUsers(params)
        io.to(user.room).emit("message", { data: { user, message } });
      }
    } catch (error) {
      console.log("sendMessage ", error)
    }
  });

  socket.on("sendWrite", ({ isWrite, params }) => {
    try {

      // console.log("sendWrite params", params)

      const user = findUser(params);
      if (user) {
        updateDateUsers(params)
        io.to(user.room).emit("messageWrite", { data: { user, isWrite } });
      }
    } catch (error) {
      console.log("sendWrite ", error)
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
      console.log("leftRoom ", error)
    }
  });

  io.on("disconnect", () => {
    console.log("Disconnect");
  });
});

server.listen(5000, () => {
  console.log("Server is running");
});

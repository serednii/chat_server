const express = require("express");//
const http = require("http");//Dockerfile
const cors = require("cors");//
const app = express();//
const hostname = '0.0.0.0';
const route = require("./route");
const { checkTimeUsers } = require("./users");

app.use(cors({ origin: "*" }));
app.use(route);

const server = http.createServer(app);
setInterval(() => checkTimeUsers(), 1000 * 10);

const { init } = require('./io');  // Імпортуємо новий файл
const io = init(server);  // Ініціалізуємо сервер з io

const handleSockets = require('./socketHandlers');
handleSockets(io);  // Передаємо io

server.listen(5000, hostname, () => {
  console.log("Server is running port 5000 ");
});

module.exports = { io };

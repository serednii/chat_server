
const mysql = require('mysql2');
const config = require('./configConnection');

// Створюємо пул з'єднань 
const pool = mysql.createPool({
    host: config.database.host,
    port: config.database.port,
    user: config.database.user,
    password: config.database.password,
    database: config.database.database,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Додавання нового повідомлення
insertMessage('This is a test message');

module.exports = pool;
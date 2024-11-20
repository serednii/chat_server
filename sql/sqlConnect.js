
const mysql = require('mysql2');
const config = require('./configConnection');
// const { insertMessage, getMessagesByRoom, deleteMessageById } = require('./sqlQueryMessage');

// Створюємо пул з'єднань
// const connection = mysql.createConnection({
//     host: config.database.host,
//     port: config.database.port,
//     user: config.database.user,
//     password: config.database.password,
//     database: config.database.database,
// });

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

// console.log('pool connection', pool)

// const insertMessage = (data, message = 'hello', author = 'Mykola', room = 'firstRoom', status = 0) => {
//     const query = 'INSERT INTO chat_messages (data, message, author, room, status) VALUES (?, ?, ?, ?, ?)';
//     const values = [data, message, author, room, status];
//     console.log('pool', pool)
//     pool.query(query, values, (err, results) => {
//         if (err) {
//             console.error('Error inserting message into database:', err.stack);
//             return;
//         }
//         console.log('Message added successfully:', results);
//     });
// };


// connection.connect((err) => {
//     if (err) {
//         console.error('Error connecting to the database:', err.stack);
//         return;
//     }
//     console.log('Connected to the database as id', connection.threadId);
// });


// Додавання нового повідомлення
insertMessage('This is a test message');


module.exports = pool;
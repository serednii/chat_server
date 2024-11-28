// const pool = require('./sqlConnect');

const mysql = require('mysql2');

const config = require('./configConnection');

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

// console.log('pool***', pool)
// Функція для вставки повідомлення
// Функція для вставки повідомлення
// const insertMessage = async (date, message, author, room, status = 0) => {
//     const query = 'INSERT INTO chat_messages (date, message, author, room, status) VALUES (?, ?, ?, ?, ?)';
//     const values = [date, message, author, room, status];

//     pool.promise().query(query, values, (err, results) => {
//         if (err) {
//             console.error('Error inserting message into database:', err.stack);
//             return;
//         }
//         console.log('Message added successfully:********', results);
//         return results.ResultSetHeader;
//     });
// };

const insertMessageSQL = async (date, message, author, room) => {
    const query = 'INSERT INTO chat_messages (date, message, author, room) VALUES (?, ?, ?, ?)';
    const values = [date, message, author, room];

    try {
        const [results] = await pool.promise().query(query, values);
        // console.log('Message added successfully:', results.insertId);
        return results.insertId;
    } catch (err) {
        console.error('Error inserting message into database:', err.stack);
        throw err;  // Розповсюджуємо помилку, щоб її можна було обробити вище
    }
};


// Функція для вибірки повідомлень за кімнатою
const getMessagesByRoomSQL = async (room, callback) => {
    const query = 'SELECT * FROM chat_messages WHERE room = ?';
    const values = [room];
    try {
        const [results] = await pool.promise().query(query, values)
        // console.log('Message get room successfully:', results);
        return results;
    } catch (err) {
        console.error('Error inserting message into database:', err.stack);
        throw err;  // Розповсюджуємо помилку, щоб її можна було обробити вище
    }

};

// Функція для видалення повідомлення за id
const deleteMessageByIdSQL = async (id) => {
    const checkQuery = 'SELECT * FROM chat_messages WHERE id = ?';
    const deleteQuery = 'DELETE FROM chat_messages WHERE id = ?';
    const values = [id];

    try {
        // Перевіряємо існування повідомлення
        const [checkResults] = await pool.promise().query(checkQuery, values);

        if (checkResults.length === 0) {
            console.log('No message found with the given ID');
            return false;
        }

        // Видаляємо повідомлення
        const [deleteResults] = await pool.promise().query(deleteQuery, values);
        console.log('Message deleted successfully:', deleteResults);
        return deleteResults
    } catch (err) {
        console.error('Error deleting message from database:', err.stack);
    }
};


const updateMessageByIdSQL = async (id, newContent) => {
    const checkQuery = 'SELECT * FROM chat_messages WHERE id = ?';
    const updateQuery = 'UPDATE chat_messages SET message = ? WHERE id = ?';
    const checkValues = [id];
    const updateValues = [newContent, id];

    try {
        // Перевіряємо існування повідомлення
        const [checkResults] = await pool.promise().query(checkQuery, checkValues);

        if (checkResults.length === 0) {
            console.log('No message found with the given ID');
            return false;
        }

        // Оновлюємо повідомлення
        const [updateResults] = await pool.promise().query(updateQuery, updateValues);
        console.log('Message updated successfully:', updateResults);
        return updateResults;
    } catch (err) {
        console.error('Error updating message in database:', err.stack);
    }
};


module.exports = { insertMessageSQL, getMessagesByRoomSQL, deleteMessageByIdSQL, updateMessageByIdSQL };
// CREATE TABLE messages (
//     id INT AUTO_INCREMENT PRIMARY KEY,
//     date TEXT NOT NULL,
//     message VARCHAR(255),
//     author VARCHAR(50),
//     room VARCHAR(50),
//     status INT DEFAULT 0
// );




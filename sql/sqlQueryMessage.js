// const pool = require('./sqlConnect');

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

const getFirstMessageByUserAndRoomSQL = async (userName, roomName) => {
    updateLastVisitDate(userName)
    const query = 'SELECT * FROM chat_messages WHERE author = ? AND room = ? ORDER BY date ASC LIMIT 1';
    const values = [userName, roomName];

    try {
        const [results] = await pool.promise().query(query, values);
        return results[0];  // Повертаємо перше повідомлення
    } catch (err) {
        console.error('Error retrieving first message from database:', err.stack);
        throw err;  // Розповсюджуємо помилку, щоб її можна було обробити вище
    }
};

const getFirstMessageByRoomSQL = async (roomName) => {
    const query = 'SELECT * FROM chat_messages WHERE room = ? ORDER BY date ASC LIMIT 1';
    const values = [roomName];

    try {
        const [results] = await pool.promise().query(query, values);
        return results[0];  // Повертаємо останнє повідомлення
    } catch (err) {
        console.error('Error retrieving first message from database:', err.stack);
        throw err;  // Розповсюджуємо помилку, щоб її можна було обробити вище
    }
};

const getLastMessageByRoomSQL = async (roomName) => {
    const query = 'SELECT * FROM chat_messages WHERE room = ? ORDER BY date DESC LIMIT 1';
    const values = [roomName];

    try {
        const [results] = await pool.promise().query(query, values);
        return results[0];  // Повертаємо перше повідомлення
    } catch (err) {
        console.error('Error retrieving first message from database:', err.stack);
        throw err;  // Розповсюджуємо помилку, щоб її можна було обробити вище
    }
};






const insertMessageSQL = async (date, message, author, room) => {
    updateLastVisitDate(author)
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
// INSERT INTO chat_messages(date, message, author, room) VALUES(?, ?, ?, ?)'
// згенерувати sql запити для вставки в базу даних 500шт 
// Назва room "test"
// author будуть різні "Mykola", "Michal""Oleg" і інші
// по 10 - 15 повідомлень користувачів в день в чаті


// Функція для вибірки повідомлень за кімнатою
const getMessagesByRoomSQL = async (room) => {
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


const getLastMessagesByRoomSQL = async (room, limit) => {
    const query = 'SELECT * FROM chat_messages WHERE room = ? ORDER BY date DESC LIMIT ?';
    const values = [room, limit];
    try {
        const [results] = await pool.promise().query(query, values);
        // Повертаємо повідомлення в порядку від найстарішого до найновішого
        return results.reverse();
    } catch (err) {
        console.error('Error retrieving messages from database:', err.stack);
        throw err;  // Розповсюджуємо помилку, щоб її можна було обробити вище
    }
};

const getNextMessagesByRoomFromIdSQL = async (room, startID, limit) => {
    console.log('SSSSSS', room, startID, limit);
    const query = 'SELECT * FROM chat_messages WHERE room = ? AND id >= ? ORDER BY date ASC LIMIT ?';
    const values = [room, startID, parseInt(limit, 10)]; // Переконайтеся, що `limit` є числовим значенням

    try {
        const [results] = await pool.promise().query(query, values);
        // Повертаємо повідомлення в порядку від найстарішого до найновішого
        return results;
    } catch (err) {
        console.error('Error retrieving messages from database:', err.stack);
        throw err;  // Розповсюджуємо помилку, щоб її можна було обробити вище
    }
};

const getPrevMessagesByRoomFromIdSQL = async (room, startID, limit) => {
    console.log('SSSSSSLLLLLLL', room, startID, limit)
    const query = 'SELECT * FROM chat_messages WHERE room = ? AND id <= ? ORDER BY date DESC LIMIT ?';
    const values = [room, startID, limit];
    try {
        const [results] = await pool.promise().query(query, values);
        // Повертаємо повідомлення в порядку від найстарішого до найновішого
        return results.reverse();
    } catch (err) {
        console.error('Error retrieving messages from database:', err.stack);
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

const insertRecordLastIdMessageSQL = async (userName, roomName, lastViewedMessageId) => {
    updateLastVisitDate(userName)
    const query = `
        INSERT INTO chat_user_room_last_views_message (user_name, room_name, last_viewed_message_id) 
        VALUES (?, ?, ?)
        ON DUPLICATE KEY UPDATE 
        last_viewed_message_id = VALUES(last_viewed_message_id)
    `;
    const values = [userName, roomName, lastViewedMessageId];

    try {
        const [result] = await pool.promise().query(query, values);
        return result;
    } catch (err) {
        console.error('Error inserting or updating record in the database:', err.stack);
        throw err;
    }
};

const updateRecordLastIdMessageSQL = async (userName, roomName, lastViewedMessageId) => {
    updateLastVisitDate(userName)
    const checkQuery = 'SELECT * FROM chat_user_room_last_views_message WHERE user_name = ? AND room_name = ?';
    const updateQuery = `
        UPDATE chat_user_room_last_views_message
        SET last_viewed_message_id = ?
        WHERE user_name = ? AND room_name = ?
    `;
    const insertQuery = `
        INSERT INTO chat_user_room_last_views_message (user_name, room_name, last_viewed_message_id)
        VALUES (?, ?, ?)
    `;
    const checkValues = [userName, roomName];
    const updateValues = [lastViewedMessageId, userName, roomName];
    const insertValues = [userName, roomName, lastViewedMessageId];

    try {
        const [checkResults] = await pool.promise().query(checkQuery, checkValues);

        if (checkResults.length > 0) {
            // Запис існує, оновлюємо його
            const [updateResults] = await pool.promise().query(updateQuery, updateValues);
            return updateResults;
        } else {
            // Запису не існує, вставляємо новий
            const [insertResults] = await pool.promise().query(insertQuery, insertValues);
            return insertResults;
        }
    } catch (err) {
        console.error('Error updating or inserting record in the database:', err.stack);
        throw err;
    }
};

const getUsersByRoom = async (roomName) => {

    const query = `
        SELECT user_name
        FROM chat_user_room_last_views_message
        WHERE room_name = ?
    `;

    try {
        // Виконуємо SQL-запит для отримання списку користувачів
        const [results] = await pool.promise().query(query, [roomName]);

        // Формуємо масив користувачів
        const userList = results.map(row => row.user_name);

        return userList; // Повертаємо список користувачів
    } catch (err) {
        console.error('Error fetching users for room:', err.stack);
        throw err;
    }
};

const readRecordFirstIdMessageSQL = async (userName, roomName) => {
    updateLastVisitDate(userName)
    const query = 'SELECT * FROM chat_user_room_last_views_message WHERE user_name = ? AND room_name = ?';
    const values = [userName, roomName];

    try {
        const [rows] = await pool.promise().query(query, values);
        return rows;
    } catch (err) {
        console.error('Error reading record from database:', err.stack);
        throw err;
    }
};

const recordExistsLastIdMessageSQL = async (userName, roomName) => {
    updateLastVisitDate(userName)
    const query = 'SELECT 1 FROM chat_user_room_last_views_message WHERE user_name = ? AND room_name = ?';
    const values = [userName, roomName];

    try {
        const [rows] = await pool.promise().query(query, values);
        return rows.length > 0;
    } catch (err) {
        console.error('Error checking record in database:', err.stack);
        throw err;
    }
};

const getMessagesInfoByRoomSQL = async (userName, roomName) => {
    const query = `
      SELECT
        (SELECT last_viewed_message_id
         FROM chat_user_room_last_views_message
         WHERE user_name = ? AND room_name = ?) AS last_viewed,
        (SELECT id
         FROM chat_messages
         WHERE room = ?
         ORDER BY date ASC LIMIT 1) AS first_message,
        (SELECT id
         FROM chat_messages
         WHERE room = ?
         ORDER BY date DESC LIMIT 1) AS last_message,
        (SELECT COUNT(*)
         FROM chat_messages
         WHERE room = ?
         AND id > (
           SELECT last_viewed_message_id
           FROM chat_user_room_last_views_message
           WHERE user_name = ? AND room_name = ?
         )) AS unreadMessages
    `;
    const values = [userName, roomName, roomName, roomName, roomName, userName, roomName];

    try {
        const [results] = await pool.promise().query(query, values);
        const resultData = {
            viewMessageId: Math.min(results[0].last_viewed, results[0].last_message),
            firstMessageId: results[0].first_message,
            lastMessageId: results[0].last_message,
            unreadMessagesCount: results[0].unreadMessages
        };
        return resultData;
    } catch (err) {
        console.error('Error retrieving messages info from database:', err.stack);
        throw err;
    }
};

const updateLastVisitDate = async (userName) => {
    const updateQuery = `
        UPDATE chat_user_room_last_views_message
        SET last_visit_date = ?
        WHERE user_name = ?
    `;
    const currentDate = new Date(); // Отримуємо поточну дату та час
    const updateValues = [currentDate, userName];

    try {
        const [result] = await pool.promise().query(updateQuery, updateValues);
        return result; // Повертаємо результат виконання
    } catch (err) {
        console.error('Error updating last visit date:', err.stack);
        throw err; // Проброс помилки для обробки в інших частинах коду
    }
};

const getUserLastVisitDates = async (roomName) => {
    const query = `
        SELECT user_name, last_visit_date
        FROM chat_user_room_last_views_message
        WHERE room_name = ?;
    `;
    const values = [roomName];

    try {
        const [results] = await pool.promise().query(query, values);
        return results; // Повертає масив об'єктів з user_name і last_visit_date
        // [
        //     { "user_name": "JohnDoe", "last_visit_date": "2024-12-12T14:30:00.000Z" },
        //     { "user_name": "JaneSmith", "last_visit_date": "2024-12-13T09:15:00.000Z" }
        // ]
    } catch (err) {
        console.error('Error fetching last visit dates:', err.stack);
        throw err;
    }
};


//для тестів
const updateLastViewedMessageId = async (userName, roomName, lastViewedMessageId) => {
    const query = `
      UPDATE chat_user_room_last_views_message 
      SET last_viewed_message_id = ?
      WHERE user_name = ? AND room_name = ?
    `;
    const values = [lastViewedMessageId, userName, roomName];

    try {
        const [result] = await pool.promise().query(query, values);
        return result;
    } catch (err) {
        console.error('Error updating record in the database:', err.stack);
        throw err;
    }
};

// CREATE TABLE chat_user_room_last_views_message(
//     id INT PRIMARY KEY AUTO_INCREMENT,
//     user_name VARCHAR(255),
//     room_name VARCHAR(255),
//     last_viewed_message_id INT
// );

module.exports = {
    getPrevMessagesByRoomFromIdSQL,
    readRecordFirstIdMessageSQL,
    getNextMessagesByRoomFromIdSQL,
    getFirstMessageByUserAndRoomSQL,
    getFirstMessageByRoomSQL,
    getLastMessageByRoomSQL,
    updateRecordLastIdMessageSQL,
    insertRecordLastIdMessageSQL,
    recordExistsLastIdMessageSQL,
    insertMessageSQL,
    getMessagesByRoomSQL,
    deleteMessageByIdSQL,
    updateMessageByIdSQL,
    getLastMessagesByRoomSQL,
    getMessagesInfoByRoomSQL,
    getUsersByRoom,
    updateLastViewedMessageId,
    getUserLastVisitDates,
};

// CREATE TABLE messages (
//     id INT AUTO_INCREMENT PRIMARY KEY,
//     date TEXT NOT NULL,
//     message VARCHAR(255),
//     author VARCHAR(50),
//     room VARCHAR(50),
//     status INT DEFAULT 0
// );

// CREATE TABLE chat_user_room_last_views_message (
//     id INT PRIMARY KEY AUTO_INCREMENT,
//     user_id INT,
//     room_name VARCHAR(255),
//     last_viewed_message_id INT,
//     last_visit_date DATETIME
// );

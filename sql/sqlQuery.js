
const pool = require('./sqlConnect');

// Підключаємося до бази даних



// const getTable = (tableName) => {
//     pool.query(`SELECT * FROM ${tableName}`, (err, results, fields) => {
//         if (err) {
//             console.error('Error executing query:', err.stack);
//             return;
//         }
//         console.log('Query results:', results);
//         return results;
//     });
// }

// // Функція для вставки даних
// const insertUser = ({ name, room, userSocketId, time, status }) => {
//     const query = 'INSERT INTO users (name, room, userSocketId, time, status) VALUES (?, ?, ?, ?, ?)';
//     const values = [name, room, userSocketId, time, status];
//     connection.query(query, values, (err, results) => {
//         if (err) {
//             console.error('Error inserting user into database:', err.stack);
//             return;
//         }
//         console.log('User added successfully:', results);
//     });
// }


// // Функція для видалення користувача
// const deleteUser = (userSocketId) => {
//     const query = 'DELETE FROM users WHERE userSocketId = ?';
//     const values = [userSocketId];

//     connection.query(query, values, (err, results) => {
//         if (err) {
//             console.error('Error deleting user from database:', err.stack);
//             return;
//         }
//         console.log('User deleted successfully:', results);
//     });
// };

// // Функція для отримання даних про користувача
// const getUser = (userSocketId, callback) => {
//     const query = 'SELECT * FROM users WHERE userSocketId = ?';
//     const values = [userSocketId];

//     connection.query(query, values, (err, results) => {
//         if (err) {
//             console.error('Error fetching user from database:', err.stack);
//             callback(err, null);
//             return;
//         }
//         callback(null, results[0]);
//     });
// };

// // Функція для пошуку користувача за іменем
// const findUser = (name, callback) => {
//     const query = 'SELECT * FROM users WHERE name = ?';
//     const values = [name];

//     connection.query(query, values, (err, results) => {
//         if (err) {
//             console.error('Error finding user in database:', err.stack);
//             callback(err, null);
//             return;
//         }
//         callback(null, results);
//     });
// };

// module.exports = { insertUser, deleteUser, getUser, findUser };

// Створити таблицю з полями
// id
// data
// message = String "hello"
// author = String "Mykola"
// room = String "firstRoom"
// status = number default 0
// а також методи для добавлення
// для вибірки по кімнатах
// для видалення по id





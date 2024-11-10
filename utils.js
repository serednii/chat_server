const trimStr = (str) => {
    try {
        const newStr = str ? str.trim().toLowerCase() : str
        return newStr
    } catch (error) {
        console.log(error)
    }
}

//Розбиваємо масиви з users на окремі кімнати
const separateRooms = (users) => {
    users.sort((userA, userB) => userA.room.localeCompare(userB.room))

    const roomsUsers = []
    let roomUsers = [];
    let userRoomCounter = null;
    users.forEach((user, index) => {
        if (index === 0) {
            userRoomCounter = user.room;
            roomUsers.push(user)
        }
        if (userRoomCounter !== user.room) {
            roomsUsers.push(roomUsers);
            userRoomCounter = user.room;
            roomUsers = [];
        }
        roomUsers.push(user)
    })
    roomsUsers.push(roomUsers);
    return roomsUsers;
}

// exports.trimStr = trimStr;
module.exports = { trimStr, separateRooms };


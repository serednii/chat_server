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
    users.sort((userA, userB) => userA.room.localeCompare(userB.room));

    const roomsUsers = [];
    let roomUsers = [];
    let userRoomCounter = users.length > 0 ? users[0].room : null;

    users.forEach((user) => {
        if (userRoomCounter !== user.room) {
            roomsUsers.push(roomUsers);
            roomUsers = [];
            userRoomCounter = user.room;
        }
        roomUsers.push(user);
    });

    if (roomUsers.length > 0) {
        roomsUsers.push(roomUsers);
    }

    return roomsUsers;
};

module.exports = { trimStr, separateRooms };


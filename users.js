
const { trimStr, separateRooms } = require("./utils");
const { handleRemoveUser } = require("./functionHandle");

const STATUS = {
  DELETE_USER: 20 * 3,
  NOT_ACTIVE: 20 * 2,
  LOW_ACTIVE: 20 * 1,
};

let users = [];  //{ name: 'f', room: '2', time: 1728149544191 }
const { getIO } = require('./io');


const addUser = (user) => {
  try {
    console.log('**********', users)
    console.log('**********', user)
    const isExist = findUser(user);
    !isExist && users.push(user);
    console.log('******///////////****', users);
    const currentUser = isExist || user;
    return { isExist: !!isExist, user: currentUser };
  } catch (error) {
    console.log("findUser ", error)
  }
};

const sendDataUser = () => {
  const io = getIO();
  const roomsUsers = separateRooms(users)
  console.log('roomsUsers-----------')
  console.log(roomsUsers)
  console.log('roomsUsers***********')

  //Відправляємо кожну кімнату окремо
  roomsUsers.forEach(roomUsers => {
    console.log(roomUsers)
    if (roomUsers) {
      io.to(roomUsers[0].room).emit("messageStatus", {
        data: { roomUsers },
      });
    }
  })

}


const findByIdUser = (id) => {
  const user = users.find((user => user.userSockedId === id))
  return
}


const findUser = (user) => {
  console.log('users **********', users)
  console.log('user  **********', user)
  try {
    if (!user) {
      throw new Error(`user id not defined`)
    }
    const userName = trimStr(user.name);
    const userRoom = trimStr(user.room);

    return users.find(

      (u) => trimStr(u.name) === userName && trimStr(u.room) === userRoom
    );
  } catch (error) {
    console.log("findUser ", error)
  }
};



const getRoomUsers = (room) => {
  try {
    return users.filter((u) => u.room === room);
  } catch (error) {
    console.log("getRoomUsers ", error)
  }
}

const removeUser = (user) => {
  try {
    const found = findUser(user);
    if (found) {
      users = users.filter(
        ({ room, name }) => room === found.room && name !== found.name
      );
    }
    return found;
  } catch (error) {
    console.log("removeUser ", error)
  }

};

const updateDateUsers = (user) => {
  try {
    const findIndexUser = users.findIndex(_user => _user.name === user.name && _user.room === user.room)
    users[findIndexUser].time = new Date().getTime();
    users[findIndexUser].status = "active";
    sendDataUser(users[findIndexUser]);
    // console.log(users)
    // console.log('findIndexUser', findIndexUser)
  } catch (error) {
    console.log("updateDateUsers ", error)
  }

}

const checkTimeUsers = () => {
  try {
    console.log(new Date())
    const presentTime = new Date().getTime();
    let isChangeStatus = false;

    users = users.map((user) => {
      const deltaTime = (presentTime - user.time) / 1000
      if (deltaTime > STATUS.DELETE_USER) { //1min
        user.status = "deleteUser";
        isChangeStatus = true;
        return user;
      } else if (deltaTime > STATUS.NOT_ACTIVE) { //1min
        user.status = "notActive";
        isChangeStatus = true;
        return user;
      } else if (deltaTime > STATUS.LOW_ACTIVE) {// 2min
        user.status = "lowActive";
        isChangeStatus = true;
        return user;
      } else {
        return user;
      }
    })

    // //Видаляємо useera статус якого помічено "deleteUsere" 
    // users.forEach((user => {
    //   if (user.status === "deleteUser") {
    //     removeUser(user)
    //     handleRemoveUser(user, users);
    //   }
    // }))


    if (isChangeStatus) {
      sendDataUser();
      isChangeStatus = false
    }

    console.log(users)
  } catch (error) {
    console.log("checkTimeUsers ", error)
  }

}

module.exports = { addUser, findUser, getRoomUsers, removeUser, updateDateUsers, checkTimeUsers, sendDataUser, findByIdUser };
const { trimStr } = require("./utils");

let users = [];  //{ name: 'f', room: '2', time: 1728149544191 }

const findUser = (user) => {
  console.log(user)
  try {
    const userName = trimStr(user.name);
    const userRoom = trimStr(user.room);

    return users.find(
      (u) => trimStr(u.name) === userName && trimStr(u.room) === userRoom
    );
  } catch (error) {
    console.log("findUser ", error)
  }


};

const addUser = (user) => {
  try {
    const isExist = findUser(user);
    console.log(user)
    !isExist && users.push(user);

    const currentUser = isExist || user;

    return { isExist: !!isExist, user: currentUser };
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

    // console.log(users)
    // console.log('findIndexUser', findIndexUser)
  } catch (error) {
    console.log("updateDateUsers ", error)
  }

}

const checkTimeUsers = () => {
  try {
    // console.log(new Date())
    const presentTime = new Date().getTime();
    users = users.map((user) => {
      const deltaTime = (presentTime - user.time) / 1000
      if (deltaTime > 120) { //1min
        user.status = "notActive"
        return user
      } else if (deltaTime > 60) {// 2min
        user.status = "lowActive"
        return user
      } else {
        return user
      }
    })
    // console.log(users)
  } catch (error) {
    console.log("checkTimeUsers ", error)
  }

}

module.exports = { addUser, findUser, getRoomUsers, removeUser, updateDateUsers, checkTimeUsers };
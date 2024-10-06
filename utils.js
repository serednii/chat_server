const trimStr = (str) => {
    // console.log(str)
    try {
        const newStr = str.trim().toLowerCase()
        return newStr
    } catch (error) {
        console.log(error)
    }
}

exports.trimStr = trimStr;

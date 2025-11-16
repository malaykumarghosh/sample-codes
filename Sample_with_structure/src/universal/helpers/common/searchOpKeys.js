const sequelizeOpKeys = ["eq", "ne", "is", "not", "or", "gt", "lt", "gte", "lte", "between",
    "notBetween", "in", "notIn", "like", "notLike", "startsWith", "endsWith", "substring", "asc", "desc"];

exports.checkOpKeys = (userGivenOpKeys) => {
    return new Promise((resolve, reject) => {
        let count = 0;
        userGivenOpKeys.forEach(opKey => {
            if (!sequelizeOpKeys.includes(opKey)) {
                resolve({ "success": false, "message": [`%s is not allowed, you may try with %s`, `${opKey}`, `${sequelizeOpKeys}`] });
                return;
            }
            count += 1;
        });
        if (count == userGivenOpKeys.length) {
            resolve({ "success": true });
        }
    })
}
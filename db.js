const fs = require("fs")

let data = {}

if (fs.existsSync("database.json")) {
    data = require("./database.json")
}

process.on("exit", () => {
    fs.writeFileSync("database.json", JSON.stringify(data))
})

module.exports = {
    get: async key => data[key],
    set: async (key, value) => data[key] = value,
    delete: async key => delete data[key],
    list: async prefix => Object.keys(data).filter(v => v.startsWith(prefix))
}
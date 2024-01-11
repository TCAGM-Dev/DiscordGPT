const http = require("http")

module.exports = http.createServer((req, res) => {
  res.write("I am alive!")
  res.end()
})
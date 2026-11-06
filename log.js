// Serves the Magnet Log table. Edit magnet-log.json, redeploy, done.
const data = require("./magnet-log.json");
exports.handler = async () => ({
  statusCode: 200,
  headers: { "Content-Type": "application/json", "Cache-Control": "public, max-age=300" },
  body: JSON.stringify(data)
});

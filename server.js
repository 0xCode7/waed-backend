require("dotenv").config({ path: "config/.env" });
const { dbConnection } = require("./config/db");
const app = require("./app");

const PORT = process.env.PORT || 3000;

dbConnection()
  .then(() => app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`)))
  .catch((error) => {
    console.error(`Database connection failed: ${error.message}`);
    process.exit(1);
  });

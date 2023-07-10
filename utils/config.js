require("dotenv").config();

const PORT = process.env.PORT;

const MONGODB_URI = process.env.NODE_ENV === "test" 
  ? process.env.TEST_MONGODB_URI
  : process.env.MONGODB_URI;

const MONGO_DB_NAME = process.env.NODE_ENV === "test" 
? process.env.TEST_MONGODB_NAME
: process.env.MONGODB_NAME

  const SECRET = process.env.SECRET;

module.exports = {
  MONGODB_URI,
  MONGO_DB_NAME,
  PORT,
  SECRET,
};
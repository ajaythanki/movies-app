// import express from "express";
// import cors from "cors";
// import reviews from "./api/reviews.route.js";
// const app = express();

// app.use(cors());
// app.use(express.json());
// app.use("/api/v1/reviews", reviews);
// app.use("*", (req, res) => {
//   res.status(404).json({ error: "not found" });
// });

// export default app;


const config = require("./utils/config");
const express = require("express");
require("express-async-errors");
const app = express();
const cors = require("cors");
const moviesRouter = require("./controllers/movies");
const middleware = require("./utils/middleware");
const logger = require("./utils/logger");
const mongoose = require("mongoose");
const usersRouter = require("./controllers/users");
const loginRouter = require("./controllers/login");

mongoose.set("strictQuery", false);

logger.info("connecting to MongoDB");


mongoose.set("debug", true);
const options = {
  autoIndex: false, // Don't build indexes
  maxPoolSize: 50, // Maintain up to 10 socket connections
  wtimeoutMS: 2500,
  useNewUrlParser: true,
  serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
  socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
  family: 4,
  dbName: config.MONGO_DB_NAME,
  // strictQuery: true, // Use IPv4, skip trying IPv6
};

mongoose
  .connect(config.MONGODB_URI,options)
  .then(() => {
    logger.info("connected to MongoDB");
  })
  .catch((error) => {
    logger.error("error connecting to MongoDB:", error);
  });

app.use(cors());
app.use(express.static("build"));
app.use(express.json());
app.use(middleware.requestLogger);

app.use("/api/movies", moviesRouter);
app.use("/api/users", usersRouter);
app.use("/api/login", loginRouter);

if (process.env.NODE_ENV === "test") {
  const testingRouter = require("./controllers/testing");
  app.use("/api/testing", testingRouter);
}
app.use(middleware.unknownEndpoint);
app.use(middleware.errorHandler);

module.exports = app;

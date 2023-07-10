const usersRouter = require("express").Router();
const User = require("../models/user");
const bcrypt = require("bcrypt");

usersRouter.get("/", async (request, response) => {
  try {
    const users = await User.find({}).populate("movies", {
      review: 1,
      like: 1,
    });
    if (!users) {
      throw new Error("No movies found");
    }
    response.json({ success: true, data: users });
  } catch (error) {
    return response.status(500).json({
      success: false,
      message: error.message,
      error: error,
    });
  }
});

usersRouter.post("/", async (request, response) => {
  try {
    const { username, name, password } = request.body;

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const user = User({
      username,
      name,
      passwordHash,
    });
    if (!user) {
      throw new Error("Error while creating new user");
    }
    const savedUser = await user.save();
    if (!savedUser) {
      throw new Error("Error while saving new user");
    }

    response.status(201).json({ success: true, data: savedUser });
  } catch (error) {
    return response.status(500).json({
      success: false,
      message: error.message,
      error: error,
    });
  }
});

module.exports = usersRouter;

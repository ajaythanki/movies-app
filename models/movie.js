const mongoose = require("mongoose");
// const uniqueValidator = require("mongoose-unique-validator");

const movieSchema = new mongoose.Schema({
  movieId: {
    type: Number,
    required: true,
  },

  liked: [
    {
      isLiked: Boolean,
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        unique: true,
      },
    },
  ],
  reviews: [
    {
      reviewText: {
        type: String,
        minLength: 3,
      },
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        unique: true,
      },
    },
  ],
});

// movieSchema.set("toJSON", {
//   transform: (document, returnedObject) => {
//     returnedObject.id = returnedObject._id.toString();
//     delete returnedObject._id;
//     delete returnedObject.__v;
//   },
// });

const Movie = mongoose.model("Movie", movieSchema);

module.exports = Movie;

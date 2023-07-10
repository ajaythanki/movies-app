const moviesRouter = require("express").Router();
const Movie = require("../models/movie");
const User = require("../models/user");
const jwt = require("jsonwebtoken");
const config = require("../utils/config");

const getTokenFrom = (request) => {
  const authorization = request.get("authorization");
  if (authorization && authorization.startsWith("Bearer ")) {
    return authorization.replace("Bearer ", "");
  }
  return null;
};

moviesRouter.get("/", async (request, response) => {
  try {
    const movies = await Movie.find({});
    if (!movies.length) {
      throw new Error("No Movies Found");
    } else {
      response.json({ success: true, data: movies });
    }
  } catch (error) {
    return response.status(500).json({
      success: false,
      message: error.message,
      error: error,
    });
  }
});
moviesRouter.get("/reviews/:movieId", async (request, response) => {
  try {
    const movie = await Movie.findOne({
      movieId: Number(request.params.movieId),
    }).populate({
      path: "reviews.user",
      select: "username name",
      model: User,
    });
    if (!movie) {
      return response.status(404).json({
        success: false,
        message: "Movie Not Found",
      });
    }
    if (movie) {
      const reviewsWithUsernames = movie.reviews.map((review) => ({
        reviewText: review?.reviewText || "",
        username: review.user.username,
        name: review.user.name || "",
      }));
      response.json({ success: true, data: reviewsWithUsernames });
    } else {
      response.status(404).json({ success: false, message: "Movie not found" });
    }
  } catch (error) {
    return response.status(500).json({
      success: false,
      message: error.message,
      error: error,
    });
  }
});

// moviesRouter.get("/:id", async (request, response) => {
//   const movie = await Movie.findById(request.params.id);
//   if (movie) {
//     response.json(movie);
//   } else {
//     response.status(404).end();
//   }
// });

moviesRouter.post("/reviews", async (request, response) => {
  try {
    const { movieId, review } = request.body;
    const decodedToken = jwt.verify(getTokenFrom(request), config.SECRET);
    if (!decodedToken.id) {
      throw new Error(`Invalid token`);
    }

    if (!movieId || !review) {
      throw new Error(`Invalid movieId or review`);
    }
    if (review.length < 3) {
      throw new Error(`Invalid movieId or review`);
    }

    const user = await User.findById(decodedToken.id);
    if (!user) {
      throw new Error(`Unauthorized`);
    }
    const movie = await Movie.findOne({ movieId:Number(movieId) });

    // console.log("findmovie", movie);
    if (!movie) {
      const movie = Movie.create({
        movieId,
        reviews: {
          reviewText: review || "",
          user: user.id,
        },
      });

      const savedMovie = await movie.save();
      if (!savedMovie) {
        throw new Error(`Could not save movie`);
      }
      user.movies = user.movies.concat(savedMovie._id);
      await user.save();
      return response.status(201).json({ success: true, data: savedMovie });
    }

    const reviewToUpdate = movie.reviews.find((r) => 
      r.user.toString()===user.id.toString()
    );
    // console.log("reviewToUpdate", reviewToUpdate);
    if(reviewToUpdate){
      reviewToUpdate.reviewText = review;
    }else{
      movie.reviews.push({
        reviewText: review || "",
        user: user.id,
      });
    }

    

    const savedMovie = await movie.save();
    if (!savedMovie) {
      throw new Error(`Could not save movie`);
    }
    response.status(201).json({ success: true, data: savedMovie });
  } catch (error) {
    return response.status(500).json({
      success: false,
      message: error.message,
      error: error,
    });
  }
});

moviesRouter.get("/get-likes", async (request, response) => {
  try {
    const filter = {
      "liked.isLiked": true,
    };

    const movie = await Movie.find(filter).populate({
      path: "liked.user",
      select: "username name",
      model: User,
    });
    if (!movie) {
      throw new Error(`Could not find movie`);
    }
    if (movie) {
      const resObj = [];
      movie?.forEach((m) => {
        resObj.push({
          movieId: m.movieId,
          liked: [...m.liked],
          totalLikes: m.liked.filter((m) => m.isLiked).length,
        });
      });

      response.json({ success: true, data: resObj });
    }
  } catch (error) {
    return response.status(500).json({
      success: false,
      message: error.message,
      error: error,
    });
  }
});
moviesRouter.post("/like", async (request, response) => {
  try {
    const { movieId, liked } = request.body;
    const decodedToken = jwt.verify(getTokenFrom(request), config.SECRET);
    if (!decodedToken.id) {
      throw new Error("Invalid token");
    }

    if (!movieId && liked === undefined) {
      throw new Error("movieId & liked both are required");
    }

    const user = await User.findById(decodedToken.id);
    if (!user) {
      throw new Error(`Unauthorized`);
    }

    const movie = await Movie.findOne({ movieId });
    if (movie) {
      // Movie exists, update the liked subdocument and user reference
      const likedSubdocument = movie.liked.find(
        (likedItem) => likedItem.user.toString() === user.id
      );
      if (likedSubdocument) {
        // User already liked the movie, update action required
        likedSubdocument.isLiked = liked;
        console.log("User already liked the movie.");
        const updatedMovie = await movie.save();
        if (!updatedMovie) {
          throw new Error(`Could not save movie`);
        }
        response.status(201).json({ success: true, data: updatedMovie });
      } else {
        // User not yet liked the movie, add a new liked subdocument
        movie.liked.push({ user: user.id, isLiked: liked });
        const updatedMovie = await movie.save();
        if (!updatedMovie) {
          throw new Error(`Could not save movie`);
        }
        console.log("Movie updated:", updatedMovie);
        response.status(201).json({ success: true, data: updatedMovie });
      }
    } else {
      // Movie does not exist, create a new movie document
      const newMovie = new Movie({
        movieId,
        liked: [{ user: user.id, isLiked: liked }],
      });
      const createdMovie = await newMovie.save();
      if (!createdMovie) {
        throw new Error(`Could not save movie`);
      }
      response.status(201).json({ success: true, data: createdMovie });
      console.log("New movie created:", createdMovie);
    }
  } catch (error) {
    return response.status(500).json({
      success: false,
      message: error.message,
      error: error,
    });
  }
});

moviesRouter.delete("/reviews/:movieId", async (request, response) => {
  try {
    const decodedToken = jwt.verify(getTokenFrom(request), config.SECRET);
    if (!decodedToken.id) {
      throw new Error(`Invalid token`);
    }

    const user = await User.findById(decodedToken.id);
    if (!user) {
      throw new Error(`Unauthorized`);
    }
    const movie = await Movie.findOne({movieId: Number(request.params.movieId)});
    if(movie){
      const review = movie.reviews?.find(
        (r) => r.user.toString() === user.id.toString()
      );
      movie.reviews.splice(movie.reviews[review], 1);
      const result = await movie.save();
      if (result) {
        response.status(200).json({ success: true, message: "Review Deleted" });
      } else {
        throw new Error(`Something went wrong while deleting review`);
      }
    }else{
      throw new Error(`No Movie Found`);
    }
  } catch (error) {
    return response.status(500).json({
      success: false,
      message: error.message,
      error: error,
    });
  }
  
});

moviesRouter.put("/:movieId", async (request, response) => {
  const { review, liked } = request.body;
  const movieObj = new Movie({
    review,
    liked,
  });
  const updatedReview = await Movie.findByIdAndUpdate(
    request.params.movieId,
    movieObj,
    {
      new: true,
    }
  );
  response.json(updatedReview);
});

module.exports = moviesRouter;

const mongoose = require("mongoose");

mongoose.connect(`mongodb://localhost:27017/MENIPROJECT`);

const userSchema = mongoose.Schema({
  fullName: String,
  email: String,
  age: String,
  username: String,
  password: String,
  posts: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "post",
    },
  ],
});

module.exports = mongoose.model("user", userSchema);

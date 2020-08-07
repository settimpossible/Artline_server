const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const userSchema = new Schema({
  email: { type: String, required: true },
  password: { type: String, required: true },
  login: { type: String },
  avatar: String,
  activities: [{ type: mongoose.ObjectId, ref: "Activity" }],
  isAdmin: Boolean,
  favorites: [{ type: mongoose.ObjectId, ref: "Activity" }],
  comments: [{ type: mongoose.ObjectId, ref: "Activity" }],
  marks: [{ type: mongoose.ObjectId, ref: "Activity" }],
});

const User = mongoose.model("User", userSchema);

module.exports = User;

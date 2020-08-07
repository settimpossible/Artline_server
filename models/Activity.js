const mongoose = require("mongoose");
require("dotenv").config();
require("../config/dbConnection");
const Schema = mongoose.Schema;
const data_onlineactivities = require("../bin/data_onlineactivities.json");

const activitySchema = new Schema({
  title: String,
  type: [String],
  access: [String],
  img: String,
  category: String,
  description: String,
  public: String,
  url: String,
  duration: String,
  theme: [String],
  owner_name: String,
  owner_address: String,
  isValidated: Boolean,
  creator: String,
  inFav: [String],
  comments: [
    {
      user: { type: mongoose.ObjectId, ref: "User" },
      comment: String,
    },
  ],
  marks: [
    {
      user: { type: mongoose.ObjectId, ref: "User" },
      mark: Number,
    },
  ],
});
const Activity = mongoose.model("Activity", activitySchema);
async function feed() {
  try {
    await Activity.insertMany(data_onlineactivities);
  } catch (err) {
    console.log(err);
  }
}
// feed();

module.exports = Activity;

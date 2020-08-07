const data = require("./data_onlineactivities.json");
import Activity from "../models/Activity";

async function feed() {
  console.log("poulet");
  try {
    await Activity.insertMany(data);
  } catch (err) {
    console.log(err);
  }
}
feed();

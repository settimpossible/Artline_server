const express = require("express");
const router = express.Router();
const Activity = require("../models/Activity");
const User = require("../models/User");

const puppeteer = require("puppeteer");
var cloudinary = require("cloudinary").v2;

const { CLOUDINARY_NAME, CLOUDINARY_KEY, CLOUDINARY_SECRET } = process.env;

cloudinary.config({
  cloud_name: CLOUDINARY_NAME,
  api_key: CLOUDINARY_KEY,
  api_secret: CLOUDINARY_SECRET,
});

function uploadToCloudinary(image) {
  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(image, (err, url) => {
        if (err) return reject(err);
        return resolve(url);
      })
      .end(image);
  });
}

router.get("/:id", (req, res, next) => {
  console.log("------");
  console.log("activity");

  Activity.findById(req.params.id)
    .populate("comments.user")
    .then((activity) => {
      res.status(200).json(activity);
    })
    .catch((error) => {
      res.status(500).json(error);
    });
});

router.get("/", (req, res, next) => {
  Activity.find()
    .limit(20)
    .then((activities) => {
      res.status(200).json(activities);
    })
    .catch((error) => {
      console.log(error);
      res.status(500).json(error);
    });
});

router.get("/user/", (req, res, next) => {
  Activity.find()
    .then((activities) => {
      res.status(200).json(activities);
    })
    .catch((error) => {
      res.status(500).json(error);
    });
});

router.get("/favorites/", (req, res, next) => {
  Activity.find()
    .then((activities) => {
      console.log(activities);
      res.status(200).json(activities);
    })
    .catch((error) => {
      res.status(500).json(error);
    });
});

// Activity.get("/:id", (req, res, next) => {
//   Activity.findById(req.params.id)
//     .then((activities) => {
//       res.status(200).json(activities);
//     })
//     .catch((error) => {
//       res.status(500).json(error);
//     });
// });

router.post("/", async (req, res, next) => {
  let { creator, url, ...rest } = req.body;
  console.log(url);

  try {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(url);
    const binary = await page.screenshot({ encoding: "binary" });
    let response = await uploadToCloudinary(binary);
    console.log({ response });
    img = response.secure_url;
    browser.close();
  } catch (e) {
    console.log(e);
  }

  Activity.create({ url, img, ...rest })
    .then((activity) => {
      let id = activity._id;
      console.log(id);
      User.findByIdAndUpdate(creator, { $push: { activities: id } })
        .then((user) => {
          console.log(user);
          res.status(201).json(user);
        })
        .catch(console.log);
    })
    .catch((error) => res.status(500).json(error));
});

router.post("/marks/:userId/:activityId", (req, res, next) => {
  let { userId, activityId } = req.params;
  let { mark } = req.body;
  Activity.findByIdAndUpdate(activityId, {
    $push: { marks: { user: userId, mark } },
  })
    .then((user) => {
      console.log(user);
      res.status(201).json(user);
    })
    .catch(console.log);
});

router.post("/comments/:userId/:activityId", (req, res, next) => {
  let { userId, activityId } = req.params;
  let { comment } = req.body;
  console.log(req.body);
  Activity.findByIdAndUpdate(activityId, {
    $push: { comments: { user: userId, comment } },
  })
    .then((user) => {
      console.log(user);
      res.status(201).json(user);
    })
    .catch(console.log);
});

router.post("/:userId/:activityId", (req, res, next) => {
  let { userId, activityId } = req.params;
  User.findByIdAndUpdate(userId, { $push: { favorites: activityId } })
    .then((user) => {
      console.log(user);
      res.status(201).json(user);
    })
    .catch(console.log);
});

router.delete("/:userId/:activityId", (req, res, next) => {
  console.log(req.params);

  User.findByIdAndUpdate(
    req.params.userId,
    {
      $pull: { favorites: req.params.activityId },
    },
    { new: true }
  )
    .then((user) => {
      console.log(user);
      res.sendStatus(204);
    })
    .catch((error) => {
      console.log(error);
      res.status(500).json(error);
    });
});

router.patch("/:id", async (req, res, next) => {
  let { creator, url, ...rest } = req.body;
  console.log(url);

  try {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(url);
    const binary = await page.screenshot({ encoding: "binary" });
    let response = await uploadToCloudinary(binary);
    console.log({ response });
    img = response.secure_url;
    browser.close();
  } catch (e) {
    console.log(e);
  }

  Activity.findByIdAndUpdate(
    req.params.id,
    { creator, url, img, ...rest },
    { new: true }
  )
    .then((activities) => {
      res.status(200).json(activities);
    })
    .catch((error) => res.status(500).json(error));
});

router.delete("/:id", (req, res, next) => {
  Activity.findByIdAndDelete(req.params.id)
    .then((activities) => {
      res.sendStatus(204);
    })
    .catch((error) => res.status(500).json(error));
});

module.exports = router;

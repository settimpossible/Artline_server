const axios = require("axios");
const fs = require("fs");
const path = require("path");
const filePath = path.join(__dirname, "data_onlineactivities.json");
const puppeteer = require("puppeteer");
const cliProgress = require("cli-progress");

var cloudinary = require("cloudinary").v2;

require("dotenv").config();
require("../config/dbConnection");

console.log(process.env);

const Activity = require("../models/Activity");

const bar1 = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);

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

const { CLOUDINARY_NAME, CLOUDINARY_KEY, CLOUDINARY_SECRET } = process.env;

cloudinary.config({
  cloud_name: CLOUDINARY_NAME,
  api_key: CLOUDINARY_KEY,
  api_secret: CLOUDINARY_SECRET,
});

async function getImage(data) {
  console.log("Fetching data of " + data.length + " elements.");
  bar1.start(data.length, 0);
  let copy = [];
  console.log("opening browser");
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  for await (let row of data) {
    let { img, url, title, ...rest } = row;
    try {
      await page.goto(url);
      const binary = await page.screenshot({ encoding: "binary" });
      let res = await uploadToCloudinary(binary);
      img = res.secure_url;
    } catch (e) {
      console.log(e.secure_url);
      img = "tbd";
    }
    try {
      await Activity.create({ img, url, title, ...rest });
    } catch (e) {
      console.log("ups");
      console.log(e);
    }
    bar1.increment();
  }
  bar1.stop();
  console.log("browser closing");
  await browser.close();

  fs.writeFileSync(filePath, JSON.stringify(copy, null, 2));
}

async function getData() {
  let res;
  try {
    res = await axios.get(
      "https://data.culture.gouv.fr/api/records/1.0/search/?dataset=culturecheznous&rows=1000"
    );
  } catch (e) {
    console.log(e);
  }
  let data = res.data.records.filter((_, i) => i > 555).map(getKeys);
  return data;
}

getData().then((data) => getImage(data));

function getKeys(e) {
  let title = e.fields?.titre_de_la_ressource;
  let type = e.fields?.types_de_ressources_proposees?.split(";");
  let access = e.fields?.contenus_adaptes_aux_types_de_handicap?.split(";");
  let category = e.fields?.activite_proposee_apprendre_se_divertir_s_informer;
  let description =
    e.fields
      ?.description_des_contenus_et_de_l_experience_proposes_min_200_max_500_caracteres;
  let public = e.fields?.public_cible;
  let url = e.fields?.lien_vers_la_ressource;
  let duration =
    e.fields?.temps_d_activite_estime_lecture_ecoute_visionnage_jeu;
  let theme = e.fields?.thematiques?.split(";");
  let owner_name = e.fields?.nom_de_l_organisme;
  let img = "";
  let owner_address = e.fields?.adresse_de_l_organisme;
  return {
    title,
    type,
    access,
    category,
    description,
    public,
    url,
    duration,
    theme,
    owner_name,
    owner_address,
    img,
  };
}

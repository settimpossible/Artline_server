const axios = require("axios");
const fs = require("fs");
const path = require("path");
const filePath = path.join(__dirname, "data_onlineactivities.json");
const puppeteer = require("puppeteer");
const cliProgress = require("cli-progress");

require("dotenv").config();
require("../config/dbConnection");

console.log(process.env);

const Activity = require("../models/Activity");

const bar1 = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);

async function getImage(data) {
  console.log("Fetching data of " + data.length + " elements.");
  bar1.start(data.length, 0);
  let copy = [];
  console.log("opening browser");
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  const prefix = "data:image/jpeg;base64,";
  for await (let row of data) {
    let { img, url, title, ...rest } = row;
    try {
      await page.goto(url);
      const base64 = await page.screenshot({ encoding: "base64" });
      img = prefix + base64;
    } catch (e) {
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
  let data = res.data.records.map(getKeys);
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

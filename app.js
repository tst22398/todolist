//jshint esversion:6
"use strict";

const express = require("express");
const mongoose = require("mongoose");
const _ = require("lodash");
// const config = require(__dirname + "/config.js");

const app = express();

app.set('view engine', 'ejs');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
const URI = process.env.DATABASE || "mongodb://localhost:27017/test";
const PORT = process.env.PORT || 30000;

main().then

async function main() {
  try {
    await mongoose.connect(URI);
    console.log("Connect to database successfully!");
  } catch (err) {
    console.log("There's some problem: " + err);
  }

  const itemsSchema = new mongoose.Schema({
    name: String
  });

  const listSchema = new mongoose.Schema({
    name: String,
    items: [itemsSchema]
  });

  const Item = mongoose.model("item", itemsSchema, "items");
  const List = mongoose.model("list", listSchema, "lists");

  app.get("/", async function (req, res) {
    const items = await Item.find({}, { name: 1, _id: 1 });

    res.render("list", { listTitle: "Today", newListItems: items });
  });

  app.post("/", async function (req, res) {
    const itemName = req.body.newItem;
    const listName = req.body.listName;
    console.log(req.body);

    const newItem = new Item({
      name: itemName
    });

    if (listName === "Today") {
      await newItem.save();

      res.redirect("/");
    } else {
      const list = await List.findOne({ name: listName });
      list.items.push(newItem);
      await list.save();
      res.redirect("/" + listName);
    }

  });

  app.get("/:listName", async function (req, res) {
    const listName = _.startCase(req.params.listName);

    const result = await List.findOne({ name: listName });
    console.log(result);

    if (!result) {
      const list = new List({
        name: listName,
        items: []
      });

      await list.save();
      res.redirect("/" + listName);
    } else {
      res.render("list", { listTitle: result.name, newListItems: result.items });
    }
  });

  app.get("/about", function (req, res) {
    res.render("about");
  });

  app.post("/delete", async function (req, res) {
    const checkedItem = req.body.checkbox;
    const listName = req.body.listName;

    if (listName === "Today") {
      await Item.findByIdAndRemove(checkedItem);
      res.redirect("/");
    } else {
      const list = await List.findOneAndUpdate(
        { name: listName },
        {
          $pull: {
            items: { _id: checkedItem }
          }
        }
      );
      res.redirect("/" + listName);
    }


  });

  app.listen(PORT, function () {
    console.log("Server started on port " + PORT);
  });
}


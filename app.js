// a sign up page
require("dotenv").config();
const express = require("express");
const app = express();
const mongoose = require("mongoose");
const session = require("express-session");
const bodyParser = require("body-parser");
const User = require("./models/user");
// bcrypt - for encryption and salting
const bcrypt = require("bcrypt");
const saltRounds = 10;

app.set("view engine", "ejs");
app.use(
  session({
    secret: process.env.SECRET, // can put env variables here. install module by "npm i dotenv"
    resave: false,
    saveUninitialized: false,
  })
);
console.log(process.env.SECRET);

app.use(bodyParser.urlencoded({ extended: true }));

const requireLogin = (req, res, next) => {
  if (!req.session.isVerified == true) {
    res.redirect("login");
  } else {
    next();
  }
};

mongoose
  .connect("mongodb://localhost:27017/test", {
    // useFindAndModify: false,
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Connected to mongodb.");
  })
  .catch((e) => {
    console.log(e);
  });

// homepage
app.get("/", (req, res) => {
  res.render("home.ejs");
});

// signup page
app.get("/signup", (req, res) => {
  res.render("signup.ejs");
});

// signup
app.post("/signup", async (req, res, next) => {
  let { username, password } = req.body;
  try {
    let foundUser = await User.findOne({ username });
    // check if the username has been used.
    if (foundUser) {
      res.send("Username has been taken.");
    } else {
      bcrypt.genSalt(saltRounds, function (err, salt) {
        if (err) {
          next(err);
        }
        // console.log(`the salt is ${salt}`);
        bcrypt.hash(password, salt, function (err, hash) {
          if (err) {
            next(err);
          }
          // console.log(`the hash is ${hash}`);
          let newUser = new User({ username, password: hash });
          try {
            newUser
              .save()
              .then((d) => {
                res.send("Data has been saved.");
              })
              .catch((e) => {
                res.send("error!");
              });
          } catch (err) {
            next(err);
          }
        });
      });
    }
  } catch (err) {
    next(err);
  }
});

app.get("/secret", requireLogin, (req, res) => {
  res.render("secret");
});

// Login page
app.get("/login", (req, res) => {
  res.render("login.ejs");
});

// login
app.post("/login", async (req, res, next) => {
  let { username, password } = req.body;
  try {
    let foundUser = await User.findOne({ username });
    // check bcrypted password
    if (foundUser) {
      bcrypt.compare(password, foundUser.password, (err, result) => {
        if (err) {
          next(err);
        }
        if (result === true) {
          // password correct
          req.session.isVerified = true;
          res.redirect("secret");
        } else {
          // password not correct
          res.send("username or password not correct.");
        }
      });
    } else {
      // user not found
      res.send("username or password not correct.");
    }
  } catch (err) {
    next(err);
  }
});

// page not found
app.get("/*", (req, res) => {
  res.status(404).send("404 page not found.");
});

// must be under homepage in order to catch errors when requesting /
app.use((err, req, res, next) => {
  console.log(err);
  res.status(500).send("Something is broken. We will fix it soon.");
});

app.listen(3000, () => {
  console.log("Server running on port 3000.");
});

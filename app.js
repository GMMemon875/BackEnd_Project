const express = require("express");
const app = express();
const path = require("path");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");

app.use(cookieParser());

const UserModel = require(`./model/user`);
const PostModel = require(`./model/post`);
const post = require("./model/post");

app.set("views engine ", "ejs");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.render("Register.ejs");
});

app.post("/register", async (req, res) => {
  const { fullName, age, username, email, password } = req.body;
  const findemail = await UserModel.findOne({ email });
  if (findemail) return res.send("email Already register");
  bcrypt.genSalt(10, function (err, salt) {
    bcrypt.hash(password, salt, async function (err, hash) {
      const user = await UserModel.create({
        fullName,
        age,
        username,
        email,
        password: hash,
      });
      const token = jwt.sign({ email: email, userid: user.id }, "memon");
      res.cookie("token", token);
      res.redirect("/profile");
    });
  });
});

app.get("/logout", (req, res) => {
  res.cookie("token", "");
  res.redirect("/");
});

app.get("/login", (req, res) => {
  res.render("login.ejs");
});
app.post("/login", async (req, res) => {
  let { email, password } = req.body;
  let EmailFind = await UserModel.findOne({ email });
  if (!EmailFind) return res.send("this email is not valid");
  bcrypt.compare(password, EmailFind.password, function (err, result) {
    if (result == true) {
      let token = jwt.sign({ email: email, userid: EmailFind.id }, "memon");
      res.cookie("token", token);
      res.redirect("/profile");
    }
  });
});

app.get("/profile", IslogedIn, async (req, res) => {
  let user = await UserModel.findOne({ email: req.user.email }).populate(
    "posts"
  );
  // console.log(user);
  res.render("profile.ejs", { user });
});
app.post("/post", IslogedIn, async (req, res) => {
  let user = await UserModel.findOne({ email: req.user.email });
  let { content } = req.body;
  let post = await PostModel.create({
    username: user._id,
    content,
  });
  user.posts.push(post._id);
  await user.save();
  res.redirect("/profile");
});

app.get("/like/:id", IslogedIn, async (req, res) => {
  let postid = await PostModel.findOne({ _id: req.params.id }).populate(
    "username"
  );
  if (postid.likes.indexOf(req.user.userid) === -1) {
    postid.likes.push(req.user.userid);
  } else {
    postid.likes.splice(postid.likes.indexOf(req.user.userid), 1);
  }
  await postid.save();
  res.redirect("/profile");
});

app.get("/edit/:id", IslogedIn, async (req, res) => {
  let post = await PostModel.findOne({ _id: req.params.id }).populate(
    "username"
  );
  res.render("edit.ejs", { post });
});

app.post("/update/:id", IslogedIn, async (req, res) => {
  let post = await PostModel.findOneAndUpdate(
    { _id: req.params.id },
    { content: req.body.content }
  );
  res.redirect("/profile");
});

app.get("/delete/:id", IslogedIn, async (req, res) => {
  let post = await PostModel.findOneAndDelete({ _id: req.params.id });
  res.redirect("/profile");
});

function IslogedIn(req, res, next) {
  if (req.cookies.token === "") res.send("you need to be login");
  else {
    let data = jwt.verify(req.cookies.token, "memon");
    req.user = data;
  }

  next();
}

app.listen(3000, function (err) {
  console.log("server is running on port 3000");
});

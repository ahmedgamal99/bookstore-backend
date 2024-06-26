const { User, validate, validateLogin } = require("../models/user");
const router = require("express").Router();
const _ = require("lodash");
const bcrypt = require("bcrypt");
const { auth, isLoggedIn } = require("../middleware/auth");
const jwt = require("jsonwebtoken");

const passport = require("passport");

require("../middleware/google_auth");

router.get("/me", auth, async (req, res) => {
  const user = await User.findById(req.user._id).select("-password -passport");
  res.json(user);
});

router.post("/sign_up", async (req, res) => {
  const { error } = validate(req.body);
  if (error) return res.status(400).json(error.details[0].message);
  let user = await User.findOne({ email: req.body.email });
  if (user)
    return res.status(400).json({ error: "User is already registered" });

  user = new User(
    _.pick(req.body, ["given_name", "family_name", "email", "password"])
  );
  const salt = await bcrypt.genSalt(10);
  user.password = await bcrypt.hash(user.password, salt);
  user.isVerified = false;
  user.isAdmin = false;
  user.passport = false;
  await user.save();

  const token = user.generateAuthToken();

  var response = _.pick(user, ["_id", "given_name", "family_name", "email"]);
  response["access"] = token;

  return res.status(200).header("x-auth-token", token).json(response);
});

router.get("/invoke_verify_email", auth, async (req, res) => {
  const user = await User.findById(req.user._id);

  user.generateVerificationToken();
  user.sendVerificationEmail();

  await user.save();

  res.status(200).json({ message: "check your email for details" });
});

router.get("/verify_email", async (req, res) => {
  const token = req.query.token;
  const user = await User.findOne({
    emailVerificationToken: token,
    emailVerificationTokenExpires: { $gt: Date.now() },
  });

  if (!user) {
    return res.status(400).send("Token is invalid or has expired");
  }

  user.isVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationTokenExpires = undefined;
  await user.save();

  res.send("Email has been verified. Please log in.");
});

router.post("/login", async (req, res) => {
  const { error } = validateLogin(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });

  const user = await User.findOne({ email: req.body.email });
  if (!user)
    return res.status(400).json({ error: "Invalid email or password" });

  const validPassword = await bcrypt.compare(req.body.password, user.password);

  if (!validPassword)
    return res.status(400).json({ error: "Invalid email or password" });

  if (!user.isActive)
    return res.status(400).json({
      error: "Account has been deactivated, please contact site admin",
    });
  const token = user.generateAuthToken();
  return res.status(200).json({ access: token });
});

router.get(
  "/google",
  passport.authenticate("google", { scope: ["email", "profile"] })
);

router.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: "/auth/google/failure" }),
  async (req, res) => {
    const g_user = req.user;
    let user = await User.findOne({ email: g_user.email });

    if (!user.isActive)
      return res.status(400).json({
        error: "Account has been deactivated, please contact site admin",
      });

    const token = user.generateAuthToken();

    return (
      res
        // .header("x-auth-token", token)
        .json({ access: token })
    );
  }
);

router.get("/google/continue", auth, async (req, res) => {
  const g_user = req.user;

  let user = await User.findOne({ email: g_user.email });

  const token = user.generateAuthToken();

  res.header("x-auth-token", token).send(`Hello ${g_user._json.given_name}`);
});

router.get("/google/failure", async (req, res) => {
  res.send("Failed to authenticate..");
});

router.post("/logout", async (req, res, next) => {
  req.logout();
  req.session.destroy();
  res.send("Goodbye!");
});

module.exports = router;

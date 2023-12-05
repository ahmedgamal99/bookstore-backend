const { User } = require("../models/user");
const _ = require("lodash");

const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth2").Strategy;

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "http://localhost:3001/auth/google/callback",
      passReqToCallback: true,
    },
    async (request, accessToken, refreshToken, profile, done) => {
      const g_user = profile._json;

      let user = await User.findOne({ email: g_user.email });

      if (user) {
        return done(null, profile, accessToken);
      } else {
        user = new User(_.pick(g_user, ["given_name", "family_name", "email"]));
        user.passport = true;
        user.isVerified = true;
        await user.save();
      }
      return done(null, profile, accessToken);
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});

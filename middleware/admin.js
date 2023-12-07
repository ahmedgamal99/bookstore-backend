const jwt = require("jsonwebtoken");

function isAdmin(req, res, next) {
  const token = req.header("x-auth-token");

  if (!token) return res.status(401).send("Access denied. No token provided");

  try {
    const decoded = jwt.verify(token, process.env.jwtPrivateKey);

    if (!decoded.isAdmin)
      res.status(400).json({ error: "User is not an Admin" });
    next();
  } catch (ex) {
    res.status(400).json("Invalid token");
  }
}

exports.isAdmin = isAdmin;

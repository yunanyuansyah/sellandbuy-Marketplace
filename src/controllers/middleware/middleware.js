const { User } = require("../../database/auth");

const authenticateSession = (req, res, next) => {
  if (req.session.userId) {
    next();
  } else {
    res.redirect("/login");
  }
};

const authenticateAdmin = async (req, res, next) => {
  try {
    if (req.session.userId) {
      const user = await User.findById(req.session.userId);

      if (user && user.isAdmin === true) {
        req.user = user;
        return next();
      }
    }
    res.redirect("/login");
  } catch (error) {
    console.error("Error authenticating admin:", error);
    res.redirect("/login");
  }
};

module.exports = {
  authenticateSession,
  authenticateAdmin,
};

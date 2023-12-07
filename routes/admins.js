const { User } = require("../models/user");
const { BookList } = require("../models/booklist");
const router = require("express").Router();
const { auth } = require("../middleware/auth");
const { isAdmin } = require("../middleware/admin");

router.get("/get_users", auth, isAdmin, async (req, res) => {
  try {
    const currentUserID = req.user._id;
    const users = await User.find({ _id: { $ne: currentUserID } })
      .select("-password -passport") // Exclude password and passport fields
      .lean() // Convert to plain JavaScript objects to allow modification
      .exec();

    const activeUsers = users
      .filter((user) => user.isActive)
      .map((user) => ({
        ...user,
        name: `${user.given_name} ${user.family_name}`,
      }));

    const inactiveUsers = users
      .filter((user) => !user.isActive)
      .map((user) => ({
        ...user,
        name: `${user.given_name} ${user.family_name}`,
      }));

    res.status(200).json({ activeUsers, inactiveUsers });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.put("/toggle_active/:user_id", auth, isAdmin, async (req, res) => {
  const user_id = req.params.user_id;

  try {
    const user = await User.findById(user_id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Toggle isActive status
    user.isActive = !user.isActive;

    await user.save();

    res
      .status(200)
      .json({ message: `User ${user.isActive ? "activated" : "deactivated"}` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.put("/toggle_admin/:user_id", auth, isAdmin, async (req, res) => {
  const user_id = req.params.user_id;

  try {
    const user = await User.findById(user_id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Toggle isActive status
    user.isAdmin = !user.isAdmin;

    await user.save();

    res.status(200).json({
      message: `User ${
        user.isAdmin ? "Granted Admin Previliges" : "Removed Admin Privileges"
      }`,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.put(
  "/toggle_review_visibility/:booklistId/:reviewId",
  auth,
  isAdmin,
  async (req, res) => {
    const { booklistId, reviewId } = req.params;

    try {
      const booklist = await BookList.findOne({ "bookLists._id": booklistId });

      if (!booklist) {
        return res.status(404).json({ message: "Booklist not found" });
      }

      // Find the specific booklist entry and the review
      const booklistEntry = booklist.bookLists.id(booklistId);
      const review = booklistEntry.reviews.id(reviewId);

      if (!review) {
        return res.status(404).json({ message: "Review not found" });
      }

      // Toggle isHidden status
      review.isHidden = !review.isHidden;

      await booklist.save();

      res
        .status(200)
        .json({ message: `Review visibility toggled to ${review.isHidden}` });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

module.exports = router;

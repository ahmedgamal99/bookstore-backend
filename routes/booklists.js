const router = require("express").Router();
const { auth } = require("../middleware/auth");
const { User } = require("../models/user");
const { mongoose } = require("mongoose");
const {
  BookList,
  validateBookListName,
  validateBookListObject,
  validateEdit,
} = require("../models/booklist");

router.post("/create_booklist", auth, async (req, res) => {
  const user_id = req.user._id;

  const { error } = validateBookListName(req.body);
  if (error) return res.status(400).json(error.details[0].message);

  let booklist_name = req.body.booklist_name;
  let isPrivate = req.body.isPrivate;

  try {
    // Find the BookList document for the user, or create a new one if it doesn't exist
    let booklistObj = await BookList.findById(user_id);
    if (!booklistObj) {
      booklistObj = new BookList({ _id: user_id });
    }

    // Create a new booklist entry
    const newBookListEntry = {
      name: booklist_name,
      isPrivate: isPrivate,
      books: [], // Starting with an empty array of books
    };

    // Add the new booklist entry to the bookLists array
    booklistObj.bookLists.push(newBookListEntry);

    // Save the updated BookList document
    await booklistObj.save();

    return res.status(200).json("Success");
  } catch (err) {
    // Handle any errors
    return res.status(500).json(err.message);
  }
});

router.put("/add_books", auth, async (req, res) => {
  const user_id = req.user._id;

  const { error } = validateBookListObject(req.body);
  if (error) return res.status(400).json(error.details[0].message);

  const booksToAdd = req.body.books; // Array of books
  const booklist_id = req.body.booklist_id;

  try {
    let booklistObj = await BookList.findById(user_id);

    if (!booklistObj) {
      return res.status(404).json("User booklist not found");
    }

    // Find the specific booklist entry
    let userBooklist = booklistObj.bookLists.find((bl) => {
      return bl._id.toString() === booklist_id;
    });

    if (!userBooklist) {
      return res.status(404).json("No booklist found with this id");
    }

    // Add new books, avoiding duplicates
    booksToAdd.forEach((book) => {
      if (!userBooklist.books.includes(book)) {
        userBooklist.books.push(book);
      }
    });

    await booklistObj.save();
    return res.status(200).json(userBooklist);
  } catch (err) {
    console.error(err);
    return res.status(500).json(err.message);
  }
});

router.get("/public_booklists", async (req, res) => {
  try {
    const publicBookLists = await BookList.aggregate([
      { $unwind: "$bookLists" },
      { $match: { "bookLists.isPrivate": false } },
      { $match: { "bookLists.books": { $ne: [], $exists: true } } },
      { $sort: { "bookLists.updatedAt": -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: User.collection.name, // Join with the User collection
          localField: "_id", // Field from the BookList document
          foreignField: "_id", // Field from the User document
          as: "author", // Alias for the joined data
        },
      },
      { $unwind: "$author" }, // Flatten the author array
      {
        $project: {
          _id: 0,
          name: "$bookLists.name",
          books: "$bookLists.books",
          authorName: {
            $concat: ["$author.given_name", " ", "$author.family_name"],
          }, // Concatenate the author's name
        },
      },
    ]);

    res.status(200).json(publicBookLists);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/authenticated", auth, async (req, res) => {
  try {
    const publicBookLists = await BookList.aggregate([
      { $unwind: "$bookLists" },
      { $match: { "bookLists.isPrivate": false } },
      { $match: { "bookLists.books": { $ne: [], $exists: true } } },
      { $sort: { "bookLists.updatedAt": -1 } },
      { $limit: 20 },
      {
        $lookup: {
          from: User.collection.name, // Join with the User collection
          localField: "_id", // Field from the BookList document
          foreignField: "_id", // Field from the User document
          as: "author", // Alias for the joined data
        },
      },
      { $unwind: "$author" }, // Flatten the author array
      {
        $project: {
          _id: 0,
          name: "$bookLists.name",
          books: "$bookLists.books",
          authorName: {
            $concat: ["$author.given_name", " ", "$author.family_name"],
          }, // Concatenate the author's name
        },
      },
    ]);

    res.status(200).json(publicBookLists);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/user_booklists", auth, async (req, res) => {
  const user_id = req.user._id;

  let booklistObj = await BookList.findById(user_id);

  if (!booklistObj) {
    return res.status(404).json({ error: "User has not created booklist" });
  }

  return res.status(200).json(booklistObj);
});

router.put("/edit_booklist", auth, async (req, res) => {
  const user_id = req.user._id;

  const { error } = validateEdit(req.body);
  if (error) return res.status(400).json(error.details[0].message);

  const { booklistId, newName, newIsPrivate, newBooks } = req.body;

  if (!booklistId) {
    return res.status(400).json({ message: "Booklist ID is required" });
  }

  try {
    // Find the user's booklist document
    let booklistObj = await BookList.findById(user_id);

    if (!booklistObj) {
      return res.status(404).json({ message: "User booklist not found" });
    }

    // Find the specific booklist entry
    let userBooklist = booklistObj.bookLists.id(booklistId);

    if (!userBooklist) {
      return res.status(404).json({ message: "Booklist not found" });
    }

    // Update the booklist details if provided
    if (newName !== undefined) userBooklist.name = newName;
    if (newIsPrivate !== undefined) userBooklist.isPrivate = newIsPrivate;
    if (Array.isArray(newBooks)) userBooklist.books = newBooks;

    // Save the updated BookList document
    await booklistObj.save();

    return res.status(200).json({ message: "Booklist updated successfully" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: err.message });
  }
});

router.delete("/delete_booklist/:booklist_id", auth, async (req, res) => {
  const booklist_id = req.params.booklist_id;

  const user_id = req.user._id;

  let booklistObj = await BookList.findById(user_id);

  if (!booklistObj) {
    return res.status(404).json("User booklist not found");
  }

  const index = booklistObj.bookLists.findIndex(
    (bl) => bl._id.toString() === booklist_id
  );

  if (index === -1) {
    return res.status(404).json("No booklist found with this id");
  }

  booklistObj.bookLists.splice(index, 1);

  await booklistObj.save();

  return res.json({ success: "booklist has been deleted" });
});

module.exports = router;
const router = require("express").Router();
const { Cart, Book } = require("../models/cart");
const { auth } = require("../middleware/auth");

router.post("/add_book", auth, async (req, res) => {
  const user_id = req.user._id;

  let cart = await Cart.findById(user_id);
  if (!cart) {
    cart = new Cart({ _id: user_id });
    await cart.save();
  }

  let book_id = req.body.book_id;

  current_count = cart.books.get(book_id);
  if (current_count) {
    cart.books.set(book_id, current_count + 1);
  } else {
    cart.books.set(book_id, 1);
  }

  await cart.save();

  res.json(cart);
});

// delete a booklist

router.get("/", auth, async (req, res) => {
  const user_id = req.user._id;

  let cart = await Cart.findById(user_id);
  if (!cart) {
    cart = new Cart({ _id: user_id });
    await cart.save();
  }

  res.status(200).json(cart);
});

module.exports = router;

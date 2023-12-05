const mongoose = require("mongoose");

const bookSchema = new mongoose.Schema(
  {
    book_id: { type: String, required: true },
    book_count: { type: Number, required: false },
  },
  { _id: false }
);

const cartSchema = new mongoose.Schema({
  _id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

  books: {
    type: Map,
    of: Number,
    default: {},
  },
});

const Cart = mongoose.model("Cart", cartSchema);
const Book = mongoose.model("Book", bookSchema);

exports.Cart = Cart;
exports.Book = Book;

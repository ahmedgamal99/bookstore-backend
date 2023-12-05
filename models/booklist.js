const mongoose = require("mongoose");
const Joi = require("joi");

const bookListEntrySchema = new mongoose.Schema(
  {
    name: String, // Name of the booklist
    isPrivate: Boolean,
    books: [String], // Array of book identifiers or titles
  },
  { timestamps: true }
); // Enable timestamps for each booklist entry

const bookListSchema = new mongoose.Schema(
  {
    _id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    bookLists: [bookListEntrySchema], // Array of booklist entries
  },
  { timestamps: true }
);

const BookList = mongoose.model("BookList", bookListSchema);

function validateBookListName(booklist_name) {
  const schema = Joi.object({
    booklist_name: Joi.string().min(5).max(50).required(),
    isPrivate: Joi.boolean().required(),
  });
  return schema.validate(booklist_name);
}

function validateBookListObject(booklistObject) {
  const schema = Joi.object({
    booklist_id: Joi.string().min(5).max(50).required(),
    books: Joi.array().required(),
  });
  return schema.validate(booklistObject);
}

function validateEdit(booklistObj) {
  const schema = Joi.object({
    booklistId: Joi.string().min(5).max(50).required(),
    newName: Joi.string(),
    newIsPrivate: Joi.boolean(),
    books: Joi.array(),
  });
  return schema.validate(booklistObj);
}
exports.BookList = BookList;
exports.validateBookListName = validateBookListName;
exports.validateBookListObject = validateBookListObject;
exports.validateEdit = validateEdit;

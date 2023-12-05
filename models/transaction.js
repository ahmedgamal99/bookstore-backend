const mongoose = require("mongoose");
const Joi = require("joi");

const transaction_item = new mongoose.Schema(
  {
    price: {
      required: true,
      type: Number,
    },
    items: {
      required: true,
      type: Map,
      of: Number,
    },
  },
  { _id: false }
);

const transactionSchema = new mongoose.Schema({
  _id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

  transactions: {
    type: Map,
    of: transaction_item,
    default: {},
  },
});

const Transaction = mongoose.model("Transaction", transactionSchema);
const TransactionItem = mongoose.model("TransactionItem", transaction_item);

function validateTransaction(transaction) {
  const schema = Joi.object({
    price: Joi.number().required(),
    items: Joi.object()
      .pattern(Joi.string().required(), Joi.number().required())
      .required(),
  });
  return schema.validate(transaction);
}

exports.Transaction = Transaction;
exports.TransactionItem = TransactionItem;
exports.validateTransaction = validateTransaction;

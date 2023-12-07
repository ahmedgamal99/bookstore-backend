const mongoose = require("mongoose");
const router = require("express").Router();
const { auth } = require("../middleware/auth");

const { Cart } = require("../models/cart");
const {
  Transaction,
  TransactionItem,
  validateTransaction,
} = require("../models/transaction");

router.post("/", auth, async (req, res) => {
  const user_id = req.user._id;

  // Validate Input
  const { error } = validateTransaction(req.body);
  if (error) return res.status(400).json(error.details[0].message);

  // Create Transaction for user if not created
  let transactionObj = await Transaction.findById(user_id);

  if (!transactionObj) {
    transactionObj = new Transaction({ _id: user_id });
  }

  let transactionItem = new TransactionItem({
    price: req.body.price,
    items: req.body.items,
  });

  var newId = new mongoose.mongo.ObjectId();

  transactionObj.transactions.set(newId, transactionItem);

  await transactionObj.save();

  await Cart.findByIdAndDelete(user_id);

  return res.status(200).json({ message: "Success" });
});

router.get("/", auth, async (req, res) => {
  const user_id = req.user._id;

  let transactionObj = await Transaction.findById(user_id);

  if (!transactionObj) {
    return res.status(404).json({ message: "Transaction not found" });
  }

  // Manually convert transactions and items map into plain objects
  const transactions = {};
  transactionObj.transactions.forEach((transaction, transactionId) => {
    // Convert the transaction itself into an object
    const transactionData = transaction.toObject({ virtuals: true });

    // Convert the items map within the transaction
    const items = {};
    transactionData.items.forEach((quantity, itemId) => {
      items[itemId] = quantity;
    });

    // Assign the converted items back to the transaction data
    transactionData.items = items;

    // Add the transaction data to the transactions object
    transactions[transactionId] = transactionData;
  });

  console.log(transactions);
  return res.status(200).json({ transactions });
});

// router.get("/", auth, async (req, res) => {
//   const user_id = req.user._id;

//   let transactionObj = await Transaction.findById(user_id);

//   const transactions = transactionObj.transactions;
//   if (!transactionObj) {
//     return res.status(200).json({});
//   }

//   return res.status(200).json({ transactions });
// });
module.exports = router;

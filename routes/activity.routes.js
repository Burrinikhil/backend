import express from "express"
import asyncHandler from "express-async-handler"
import { protect } from "../middleware/auth.middleware.js"
import Expense from "../models/Expense.model.js"

const router = express.Router()

// Get activity timeline for a group
router.get(
  "/:groupId",
  protect,
  asyncHandler(async (req, res) => {
    const { limit = 50 } = req.query

    const expenses = await Expense.find({ group: req.params.groupId })
      .populate("paidBy", "name email")
      .populate("participants.user", "name email")
      .sort("-createdAt")
      .limit(Number.parseInt(limit))

    const activities = expenses.map((expense) => ({
      _id: expense._id,
      type: "expense_added",
      description: `${expense.paidBy.name} added "${expense.description}"`,
      amount: expense.amount,
      category: expense.category,
      timestamp: expense.createdAt,
      user: expense.paidBy,
    }))

    res.json(activities)
  }),
)

export default router

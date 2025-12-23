import express from "express"
import asyncHandler from "express-async-handler"
import { protect } from "../middleware/auth.middleware.js"
import Group from "../models/Group.model.js"
import Expense from "../models/Expense.model.js"
import { calculateSettlements } from "../utils/settlementCalculator.js"

const router = express.Router()

// Get settlements for a group
router.get(
  "/:groupId",
  protect,
  asyncHandler(async (req, res) => {
    const group = await Group.findById(req.params.groupId).populate("members.user", "name email")

    if (!group) {
      return res.status(404).json({ message: "Group not found" })
    }

    const expenses = await Expense.find({ group: req.params.groupId })
      .populate("paidBy", "name email")
      .populate("participants.user", "name email")

    const members = group.members.map((m) => m.user)
    const { balances, settlements } = calculateSettlements(expenses, members)

    // Format response with user details
    const formattedBalances = Object.entries(balances).map(([userId, balance]) => {
      const user = members.find((m) => m._id.toString() === userId)
      return {
        user: { _id: user._id, name: user.name, email: user.email },
        balance: Number.parseFloat(balance.toFixed(2)),
      }
    })

    const formattedSettlements = settlements.map((s) => {
      const from = members.find((m) => m._id.toString() === s.from)
      const to = members.find((m) => m._id.toString() === s.to)
      return {
        from: { _id: from._id, name: from.name, email: from.email },
        to: { _id: to._id, name: to.name, email: to.email },
        amount: s.amount,
      }
    })

    res.json({
      balances: formattedBalances,
      settlements: formattedSettlements,
    })
  }),
)

export default router

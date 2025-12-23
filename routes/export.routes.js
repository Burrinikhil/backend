import express from "express"
import asyncHandler from "express-async-handler"
import { protect } from "../middleware/auth.middleware.js"
import Group from "../models/Group.model.js"
import Expense from "../models/Expense.model.js"
import { calculateSettlements } from "../utils/settlementCalculator.js"

const router = express.Router()

// Export expenses as CSV
router.get(
  "/expenses/:groupId",
  protect,
  asyncHandler(async (req, res) => {
    const group = await Group.findById(req.params.groupId)

    if (!group) {
      return res.status(404).json({ message: "Group not found" })
    }

    const expenses = await Expense.find({ group: req.params.groupId })
      .populate("paidBy", "name email")
      .populate("participants.user", "name email")
      .sort("date")

    // Generate CSV
    let csv = "Date,Description,Amount,Category,Paid By,Split Type,Participants,Notes\n"

    expenses.forEach((expense) => {
      const participants = expense.participants.map((p) => `${p.user.name} ($${p.share.toFixed(2)})`).join("; ")

      csv += `${new Date(expense.date).toLocaleDateString()},`
      csv += `"${expense.description}",`
      csv += `${expense.amount.toFixed(2)},`
      csv += `${expense.category},`
      csv += `"${expense.paidBy.name}",`
      csv += `${expense.splitType},`
      csv += `"${participants}",`
      csv += `"${expense.notes || ""}"\n`
    })

    res.setHeader("Content-Type", "text/csv")
    res.setHeader("Content-Disposition", `attachment; filename="${group.name}-expenses.csv"`)
    res.send(csv)
  }),
)

// Export settlements as CSV
router.get(
  "/settlements/:groupId",
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
    const { settlements } = calculateSettlements(expenses, members)

    // Generate CSV
    let csv = "From,To,Amount\n"

    settlements.forEach((settlement) => {
      const from = members.find((m) => m._id.toString() === settlement.from)
      const to = members.find((m) => m._id.toString() === settlement.to)
      csv += `"${from.name}","${to.name}",${settlement.amount.toFixed(2)}\n`
    })

    res.setHeader("Content-Type", "text/csv")
    res.setHeader("Content-Disposition", `attachment; filename="${group.name}-settlements.csv"`)
    res.send(csv)
  }),
)

export default router

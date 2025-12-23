import express from "express"
import asyncHandler from "express-async-handler"
import { protect } from "../middleware/auth.middleware.js"
import Expense from "../models/Expense.model.js"
import Group from "../models/Group.model.js"

const router = express.Router()

// Create expense
router.post(
  "/",
  protect,
  asyncHandler(async (req, res) => {
    const { groupId, description, amount, category, paidBy, splitType, participants, notes } = req.body

    const group = await Group.findById(groupId)
    if (!group) {
      return res.status(404).json({ message: "Group not found" })
    }

    const isMember = group.members.some((m) => m.user.toString() === req.user._id.toString())
    if (!isMember) {
      return res.status(403).json({ message: "Not authorized to add expense" })
    }

    const expense = await Expense.create({
      group: groupId,
      description,
      amount,
      category,
      paidBy: paidBy || req.user._id,
      splitType,
      participants,
      notes,
    })

    group.expenses.push(expense._id)
    await group.save()

    const populatedExpense = await Expense.findById(expense._id)
      .populate("paidBy", "name email")
      .populate("participants.user", "name email")

    res.status(201).json(populatedExpense)
  }),
)

// Get expenses for a group
router.get(
  "/group/:groupId",
  protect,
  asyncHandler(async (req, res) => {
    const { category, startDate, endDate } = req.query

    const query = { group: req.params.groupId }

    if (category && category !== "all") {
      query.category = category
    }

    if (startDate || endDate) {
      query.date = {}
      if (startDate) query.date.$gte = new Date(startDate)
      if (endDate) query.date.$lte = new Date(endDate)
    }

    const expenses = await Expense.find(query)
      .populate("paidBy", "name email")
      .populate("participants.user", "name email")
      .sort("-date")

    res.json(expenses)
  }),
)

// Get single expense
router.get(
  "/:id",
  protect,
  asyncHandler(async (req, res) => {
    const expense = await Expense.findById(req.params.id)
      .populate("paidBy", "name email")
      .populate("participants.user", "name email")
      .populate("group")

    if (!expense) {
      return res.status(404).json({ message: "Expense not found" })
    }

    res.json(expense)
  }),
)

// Update expense
router.put(
  "/:id",
  protect,
  asyncHandler(async (req, res) => {
    const expense = await Expense.findById(req.params.id)

    if (!expense) {
      return res.status(404).json({ message: "Expense not found" })
    }

    if (expense.paidBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Only expense creator can update" })
    }

    const { description, amount, category, splitType, participants, notes } = req.body

    expense.description = description || expense.description
    expense.amount = amount || expense.amount
    expense.category = category || expense.category
    expense.splitType = splitType || expense.splitType
    expense.participants = participants || expense.participants
    expense.notes = notes !== undefined ? notes : expense.notes

    await expense.save()
    res.json(expense)
  }),
)

// Delete expense
router.delete(
  "/:id",
  protect,
  asyncHandler(async (req, res) => {
    const expense = await Expense.findById(req.params.id)

    if (!expense) {
      return res.status(404).json({ message: "Expense not found" })
    }

    if (expense.paidBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Only expense creator can delete" })
    }

    await Group.findByIdAndUpdate(expense.group, {
      $pull: { expenses: expense._id },
    })

    await expense.deleteOne()
    res.json({ message: "Expense deleted successfully" })
  }),
)

export default router

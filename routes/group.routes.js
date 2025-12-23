import express from "express";
import asyncHandler from "express-async-handler";
import { protect } from "../middleware/auth.middleware.js";
import Group from "../models/Group.model.js";
import User from "../models/User.model.js";
import Expense from "../models/Expense.model.js";

const router = express.Router();

// ================= CREATE GROUP =================
router.post(
  "/",
  protect,
  asyncHandler(async (req, res) => {
    const { name, description, type, members } = req.body;

    const group = await Group.create({
      name,
      description,
      type,
      createdBy: req.user._id,
      members: [
        { user: req.user._id, joinedAt: new Date() },
        ...(members || []).map((userId) => ({
          user: userId,
          joinedAt: new Date(),
        })),
      ],
    });

    await User.updateMany(
      { _id: { $in: [req.user._id, ...(members || [])] } },
      { $push: { groups: group._id } }
    );

    const populatedGroup = await Group.findById(group._id)
      .populate("createdBy", "name email")
      .populate("members.user", "name email");

    res.status(201).json(populatedGroup);
  })
);

// ================= GET ALL GROUPS =================
router.get(
  "/",
  protect,
  asyncHandler(async (req, res) => {
    const groups = await Group.find({
      "members.user": req.user._id,
      isActive: true,
    })
      .populate("createdBy", "name email")
      .populate("members.user", "name email")
      .sort("-createdAt");

    res.json(groups);
  })
);

// ================= GET SINGLE GROUP =================
router.get(
  "/:id",
  protect,
  asyncHandler(async (req, res) => {
    const group = await Group.findById(req.params.id)
      .populate("createdBy", "name email")
      .populate("members.user", "name email")
      .populate({
        path: "expenses",
        populate: [
          { path: "paidBy", select: "name email" },
          { path: "participants.user", select: "name email" },
        ],
      });

    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    const isMember = group.members.some(
      (m) => m.user._id.toString() === req.user._id.toString()
    );

    if (!isMember) {
      return res.status(403).json({ message: "Not authorized" });
    }

    res.json(group);
  })
);

// ================= GROUP BALANCE (IMPORTANT) =================
router.get(
  "/:id/balance",
  protect,
  asyncHandler(async (req, res) => {
    const groupId = req.params.id;
    const userId = req.user._id.toString();

    const expenses = await Expense.find({ group: groupId });

    let balance = 0;

    expenses.forEach((expense) => {
      const splitAmount = expense.amount / expense.participants.length;

      // If user paid
      if (expense.paidBy.toString() === userId) {
        balance += expense.amount - splitAmount;
      }
      // If user participated but didn't pay
      else if (
        expense.participants.some(
          (p) => p.user.toString() === userId
        )
      ) {
        balance -= splitAmount;
      }
    });

    res.json({ balance });
  })
);

// ================= ADD MEMBER =================
router.post(
  "/:id/members",
  protect,
  asyncHandler(async (req, res) => {
    const { userId } = req.body;
    const group = await Group.findById(req.params.id);

    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    const isMember = group.members.some(
      (m) => m.user.toString() === userId
    );

    if (isMember) {
      return res.status(400).json({ message: "User already a member" });
    }

    group.members.push({ user: userId, joinedAt: new Date() });
    await group.save();

    await User.findByIdAndUpdate(userId, {
      $push: { groups: group._id },
    });

    const updatedGroup = await Group.findById(group._id).populate(
      "members.user",
      "name email"
    );

    res.json(updatedGroup);
  })
);

// ================= UPDATE GROUP =================
router.put(
  "/:id",
  protect,
  asyncHandler(async (req, res) => {
    const { name, description, type } = req.body;
    const group = await Group.findById(req.params.id);

    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    if (group.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Only creator can update" });
    }

    group.name = name || group.name;
    group.description =
      description !== undefined ? description : group.description;
    group.type = type || group.type;

    await group.save();
    res.json(group);
  })
);

// ================= DELETE GROUP =================
router.delete(
  "/:id",
  protect,
  asyncHandler(async (req, res) => {
    const group = await Group.findById(req.params.id);

    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    if (group.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Only creator can delete" });
    }

    group.isActive = false;
    await group.save();

    res.json({ message: "Group deleted successfully" });
  })
);

export default router;

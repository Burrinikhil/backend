import express from "express"
import asyncHandler from "express-async-handler"
import { protect } from "../middleware/auth.middleware.js"
import User from "../models/User.model.js"

const router = express.Router()

// Get user profile
router.get(
  "/profile",
  protect,
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id).populate("groups")
    res.json(user)
  }),
)

// Update user profile
router.put(
  "/profile",
  protect,
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id)

    if (user) {
      user.name = req.body.name || user.name
      user.email = req.body.email || user.email

      const updatedUser = await user.save()
      res.json(updatedUser)
    } else {
      res.status(404).json({ message: "User not found" })
    }
  }),
)

// Search users by email
router.get(
  "/search",
  protect,
  asyncHandler(async (req, res) => {
    const { email } = req.query

    if (!email) {
      return res.status(400).json({ message: "Email query is required" })
    }

    const users = await User.find({
      email: { $regex: email, $options: "i" },
      _id: { $ne: req.user._id },
    })
      .select("name email")
      .limit(10)

    res.json(users)
  }),
)

export default router

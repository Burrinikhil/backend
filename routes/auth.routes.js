import express from "express"
import { body,validationResult } from "express-validator"
import asyncHandler from "express-async-handler"
import User from "../models/User.model.js"
import { generateToken } from "../utils/tokenGenerator.js"

const router = express.Router()

// Validation middleware
const validateRequest = (req, res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }
  next()
}

// Register
router.post(
  "/register",
  body("name").trim().isLength({ min: 2 }).withMessage("Name must be at least 2 characters"),
  body("email").isEmail().normalizeEmail().withMessage("Invalid email"),
  body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
  validateRequest,
  asyncHandler(async (req, res) => {
    const { name, email, password } = req.body

    const userExists = await User.findOne({ email })
    if (userExists) {
      return res.status(400).json({ message: "User already exists" })
    }

    const user = await User.create({ name, email, password })
    const token = generateToken(user._id)

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      token,
    })
  }),
)

// Login
router.post(
  "/login",
  body("email").isEmail().normalizeEmail(),
  body("password").notEmpty(),
  validateRequest,
  asyncHandler(async (req, res) => {
    const { email, password } = req.body

    const user = await User.findOne({ email })
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" })
    }

    const isMatch = await user.comparePassword(password)
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" })
    }

    const token = generateToken(user._id)

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      token,
    })
  }),
)

export default router

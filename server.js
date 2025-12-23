import express from "express"
import mongoose from "mongoose"
import cors from "cors"
import dotenv from "dotenv"

// Import routes
import authRoutes from "./routes/auth.routes.js"
import userRoutes from "./routes/user.routes.js"
import groupRoutes from "./routes/group.routes.js"
import expenseRoutes from "./routes/expense.routes.js"
import settlementRoutes from "./routes/settlement.routes.js"
import exportRoutes from "./routes/export.routes.js"
import activityRoutes from "./routes/activity.routes.js"

// Load environment variables
dotenv.config()

const app = express()

// Middleware
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// MongoDB Connection
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("✅ MongoDB Connected Successfully"))
  .catch((err) => console.error("❌ MongoDB Connection Error:", err))

// Routes
app.use("/api/auth", authRoutes)
app.use("/api/users", userRoutes)
app.use("/api/groups", groupRoutes)
app.use("/api/expenses", expenseRoutes)
app.use("/api/settlements", settlementRoutes)
app.use("/api/export", exportRoutes)
app.use("/api/activity", activityRoutes)

// Health check
app.get("/", (req, res) => {
  res.json({ message: "Smart Expense Splitter API is running!" })
})

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(err.statusCode || 500).json({
    message: err.message || "Internal Server Error",
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
  })
})

// Start server
const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`)
})

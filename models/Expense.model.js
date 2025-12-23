import mongoose from "mongoose";

const expenseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
      required: true,
    },
    paidBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    participants: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
      },
    ],
    category: {
      type: String,
      default: "General",
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Expense", expenseSchema);

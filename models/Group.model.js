import mongoose from "mongoose"

const groupSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Group name is required"],
      trim: true,
      maxlength: [100, "Group name cannot exceed 100 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, "Description cannot exceed 500 characters"],
    },
    type: {
      type: String,
      enum: ["trip", "household", "event", "other"],
      default: "other",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    members: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        joinedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    expenses: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Expense",
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
)

export default mongoose.model("Group", groupSchema)

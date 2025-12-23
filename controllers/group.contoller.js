import Group from "../models/Group.js";
import Expense from "../models/Expense.js";

export const getGroups = async (req, res) => {
  try {
    const groups = await Group.find({ members: req.user.id });
    res.json(groups);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getGroupBalance = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user.id;

    const expenses = await Expense.find({ group: groupId });

    let balance = 0;

    expenses.forEach(exp => {
      const splitAmount = exp.amount / exp.participants.length;

      if (exp.paidBy.toString() === userId) {
        balance += exp.amount - splitAmount;
      } else if (exp.participants.includes(userId)) {
        balance -= splitAmount;
      }
    });

    res.json({ balance });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

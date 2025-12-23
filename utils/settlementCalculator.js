export const calculateSettlements = (expenses, members) => {
  const balances = {}

  // Initialize balances for all members
  members.forEach((member) => {
    balances[member._id.toString()] = 0
  })

  // Calculate net balances
  expenses.forEach((expense) => {
    const paidById = expense.paidBy._id.toString()
    balances[paidById] += expense.amount

    expense.participants.forEach((participant) => {
      const userId = participant.user._id.toString()
      balances[userId] -= participant.share
    })
  })

  // Separate debtors and creditors
  const debtors = []
  const creditors = []

  Object.entries(balances).forEach(([userId, balance]) => {
    if (balance < -0.01) {
      debtors.push({ userId, amount: Math.abs(balance) })
    } else if (balance > 0.01) {
      creditors.push({ userId, amount: balance })
    }
  })

  // Calculate settlements using greedy algorithm
  const settlements = []
  let i = 0,
    j = 0

  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i]
    const creditor = creditors[j]
    const amount = Math.min(debtor.amount, creditor.amount)

    if (amount > 0.01) {
      settlements.push({
        from: debtor.userId,
        to: creditor.userId,
        amount: Number.parseFloat(amount.toFixed(2)),
      })
    }

    debtor.amount -= amount
    creditor.amount -= amount

    if (debtor.amount < 0.01) i++
    if (creditor.amount < 0.01) j++
  }

  return { balances, settlements }
}

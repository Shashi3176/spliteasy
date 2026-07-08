import { runGreedy, runOptimal } from './runner';
import type { AlgorithmResult, Balance, OptimalResult } from './runner';
import { connectDB } from '@/lib/db';
import Expense from '@/models/Expense';

const AMOUNT_SCALE = 100;

type SettlementMetadata = {
  groupId: string;
  expenseCount: number;
  personCount: number;
  totalExpenseAmount: number;
  totalPaidAmount: number;
  totalOwedAmount: number;
  balanceTotal: number;
  greedyTimeMs: number;
  optimalTimeMs: number;
};

type CalculateSettlementsResult = {
  groupId: string;
  balances: Balance[];
  greedy: AlgorithmResult;
  optimal: OptimalResult;
  metadata: SettlementMetadata;
};

type BuildBalancesResult = {
  balances: Balance[];
  metadata: SettlementMetadata;
};

function toAmountUnits(value: number): number {
  return Math.round(value * AMOUNT_SCALE);
}

function fromAmountUnits(amountUnits: number): number {
  return Math.round(amountUnits) / AMOUNT_SCALE;
}

function addBalanceUnits(
  balances: Map<string, number>,
  userId: string,
  amountUnits: number
): void {
  balances.set(userId, (balances.get(userId) ?? 0) + amountUnits);
}

export function buildBalancesFromExpenses(
  groupId: string,
  expenses: Awaited<ReturnType<typeof Expense.find>>
): BuildBalancesResult {
  const balancesByUser = new Map<string, number>();

  let totalExpenseUnits = 0;
  let totalPaidUnits = 0;
  let totalOwedUnits = 0;

  for (const expense of expenses) {
    const expenseAmountUnits = toAmountUnits(expense.amount);
    const splitItems = expense.splitAmong ?? [];

    if (expenseAmountUnits <= 0) {
      throw new Error(`Invalid expense amount for ${expense._id.toString()}`);
    }

    if (splitItems.length === 0) {
      throw new Error(`Expense ${expense._id.toString()} has no splitAmong entries`);
    }

    const splitAmountUnits = splitItems.reduce((sum, split) => {
      const splitAmountUnit = toAmountUnits(split.amount);

      if (splitAmountUnit < 0) {
        throw new Error(`Invalid split amount for expense ${expense._id.toString()}`);
      }

      return sum + splitAmountUnit;
    }, 0);

    if (splitAmountUnits !== expenseAmountUnits) {
      throw new Error(
        `Expense ${expense._id.toString()} split amounts do not match total amount`
      );
    }

    totalExpenseUnits += expenseAmountUnits;
    totalPaidUnits += expenseAmountUnits;
    totalOwedUnits += splitAmountUnits;

    addBalanceUnits(
      balancesByUser,
      expense.paidBy.toString(),
      expenseAmountUnits
    );

    for (const split of splitItems) {
      addBalanceUnits(
        balancesByUser,
        split.userId.toString(),
        -toAmountUnits(split.amount)
      );
    }
  }

  const balanceTotalUnits = totalPaidUnits - totalOwedUnits;

  if (balanceTotalUnits !== 0) {
    throw new Error('Total balances do not sum to zero');
  }

  const balances = Array.from(balancesByUser.entries())
    .map(([userId, amountUnits]) => ({
      userId,
      amount: fromAmountUnits(amountUnits),
    }))
    .filter(({ amount }) => amount !== 0)
    .sort((a, b) => b.amount - a.amount);

  const metadata: SettlementMetadata = {
    groupId,
    expenseCount: expenses.length,
    personCount: balances.length,
    totalExpenseAmount: fromAmountUnits(totalExpenseUnits),
    totalPaidAmount: fromAmountUnits(totalPaidUnits),
    totalOwedAmount: fromAmountUnits(totalOwedUnits),
    balanceTotal: fromAmountUnits(balanceTotalUnits),
    greedyTimeMs: 0,
    optimalTimeMs: 0,
  };

  return { balances, metadata };
}

export async function calculateSettlements(
  groupId: string
): Promise<CalculateSettlementsResult> {
  if (!groupId.trim()) {
    throw new Error('groupId is required');
  }

  await connectDB();

  const expenses = await Expense.find({ groupId }).sort({ date: -1 });

  const { balances, metadata } = buildBalancesFromExpenses(groupId, expenses);

  const [greedy, optimal] = await Promise.all([
    runGreedy(balances),
    runOptimal(balances),
  ]);

  return {
    groupId,
    balances,
    greedy,
    optimal,
    metadata: {
      ...metadata,
      greedyTimeMs: greedy.timeMs,
      optimalTimeMs: optimal.timeMs,
    },
  };
}
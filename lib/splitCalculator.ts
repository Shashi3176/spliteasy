export type SplitMember = { userId: string; name: string };
export type SplitResult = { userId: string; amount: number; percentage: number };

export function calculateEqualSplit(
  totalAmount: number,
  members: SplitMember[]
): SplitResult[] {
  if (members.length === 0) return [];

  const baseAmount = totalAmount / members.length;
  const results: SplitResult[] = [];
  let runningSum = 0;

  for (let i = 0; i < members.length; i++) {
    const isLast = i === members.length - 1;
    let amount: number;

    if (isLast) {
      amount = Number((totalAmount - runningSum).toFixed(2));
    } else {
      amount = Number(baseAmount.toFixed(2));
      runningSum += amount;
    }

    const percentage = Number(((amount / totalAmount) * 100).toFixed(2));

    results.push({
      userId: members[i].userId,
      amount,
      percentage,
    });
  }

  return results;
}

export function calculatePercentageSplit(
  totalAmount: number,
  memberPercentages: { userId: string; percentage: number }[]
): SplitResult[] {
  return memberPercentages.map((mp) => {
    const amount = Number(((mp.percentage / 100) * totalAmount).toFixed(2));
    return {
      userId: mp.userId,
      amount,
      percentage: mp.percentage,
    };
  });
}

export function calculateExactSplit(
  memberAmounts: { userId: string; amount: number }[],
  totalAmount: number
): SplitResult[] {
  return memberAmounts.map((ma) => {
    const percentage = Number(((ma.amount / totalAmount) * 100).toFixed(2));
    return {
      userId: ma.userId,
      amount: ma.amount,
      percentage,
    };
  });
}

export function validateSplitSum(
  splits: SplitResult[],
  totalAmount: number,
  tolerance = 0.01
): { isValid: boolean; difference: number } {
  const sum = splits.reduce((acc, split) => acc + split.amount, 0);
  const difference = Number((sum - totalAmount).toFixed(2));
  const isValid = Math.abs(difference) <= tolerance;
  return { isValid, difference };
}

const splitCalculator = {
  calculateEqualSplit,
  calculatePercentageSplit,
  calculateExactSplit,
  validateSplitSum,
};

export default splitCalculator;
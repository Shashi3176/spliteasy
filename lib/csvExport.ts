'use client';

type SplitAmong = {
  userId: {
    _id: string;
    name?: string;
    avatar?: string;
  };
  amount: number;
};

type Expense = {
  _id: string;
  description: string;
  amount: number;
  category: 'food' | 'travel' | 'accommodation' | 'other';
  date: string;
  paidBy: {
    _id: string;
    name?: string;
    avatar?: string;
  };
  splitAmong: SplitAmong[];
  createdBy: {
    _id: string;
    name?: string;
  };
};

function escapeCsvField(value: string): string {
  if (/[,"\r\n]/.test(value)) {
    return '"' + value.replace(/"/g, '""') + '"';
  }
  return value;
}

export function exportExpensesToCsv(expenses: Expense[], groupName: string): void {
  const headers = ['Description', 'Amount', 'Category', 'Paid By', 'Date', 'Split Among'];

  const rows: string[] = [headers.map(escapeCsvField).join(',')];

  for (const expense of expenses) {
    const splitAmongStr = expense.splitAmong
      .map((s) => `${s.userId.name || s.userId._id}: ${s.amount.toFixed(2)}`)
      .join('; ');

    const row = [
      expense.description,
      expense.amount.toFixed(2),
      expense.category,
      expense.paidBy.name || expense.paidBy._id,
      expense.date,
      splitAmongStr,
    ];

    rows.push(row.map(escapeCsvField).join(','));
  }

  const csvContent = rows.join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv' });
  const objectUrl = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = `${groupName}-expenses.csv`;

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(objectUrl);
}

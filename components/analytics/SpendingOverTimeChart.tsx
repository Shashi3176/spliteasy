'use client';

import { memo } from 'react';
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

export type TimeSeriesPoint = {
  period: string;
  total: number;
};

type SpendingOverTimeChartProps = {
  data: TimeSeriesPoint[];
  currency: string;
};

function formatMoney(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

function SpendingOverTimeChartInner({ data, currency }: SpendingOverTimeChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-[300px] flex-col items-center justify-center text-center text-sm text-muted-foreground">
        <p>No time series data</p>
        <p>Add expenses to see spending timelines.</p>
      </div>
    );
  }

  return (
    <div className="h-[320px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
          <XAxis dataKey="period" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} tickFormatter={(value) => formatMoney(value, currency)} width={80} />
          <Tooltip formatter={(value) => [formatMoney(Number(value), currency), 'Total']} />
          <Line type="monotone" dataKey="total" stroke="#6366f1" strokeWidth={2} dot={{ r: 3 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export const SpendingOverTimeChart = memo(SpendingOverTimeChartInner);
SpendingOverTimeChart.displayName = 'SpendingOverTimeChart';

export default SpendingOverTimeChart;

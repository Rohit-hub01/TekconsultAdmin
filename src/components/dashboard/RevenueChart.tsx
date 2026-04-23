import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Transaction } from "@/lib/api";
import { useMemo } from "react";

interface RevenueChartProps {
  transactions: Transaction[];
}

export function RevenueChart({ transactions }: RevenueChartProps) {
  const chartData = useMemo(() => {
    // Process last 14 days of revenue
    const dailyRevenue: Record<string, number> = {};
    const today = new Date();

    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      dailyRevenue[dateStr] = 0;
    }

    transactions.forEach(txn => {
      if (txn.type === 'credit' && txn.status === 'success') {
        const date = new Date(txn.date);
        const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        if (dailyRevenue[dateStr] !== undefined) {
          dailyRevenue[dateStr] += txn.amount;
        }
      }
    });

    return Object.entries(dailyRevenue).map(([date, revenue]) => ({ date, revenue }));
  }, [transactions]);

  return (
    <Card className="border-0 shadow-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">Revenue Trend</CardTitle>
        <p className="text-sm text-muted-foreground">Daily revenue over the last 14 days</p>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis
                dataKey="date"
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                dy={10}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}K`}
                dx={-10}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  boxShadow: 'var(--shadow-md)',
                }}
                formatter={(value: number) => [`₹${value.toLocaleString()}`, 'Revenue']}
                labelStyle={{ color: 'hsl(var(--foreground))' }}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="hsl(var(--accent))"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorRevenue)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

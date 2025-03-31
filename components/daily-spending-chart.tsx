"use client"

import { useMemo } from "react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import type { Expense } from "@/utils/supabase/data-services"

interface DailySpendingChartProps {
  expenses: Expense[]
}

export function DailySpendingChart({ expenses }: DailySpendingChartProps) {
  // Process expenses to get daily totals
  const chartData = useMemo(() => {
    // Create a map to store daily totals
    const dailyTotals = new Map<string, number>()

    // Get the month from the first expense (if available)
    const firstExpense = expenses[0]
    const month = firstExpense ? new Date(firstExpense.date).getMonth() : new Date().getMonth()
    const year = firstExpense ? new Date(firstExpense.date).getFullYear() : new Date().getFullYear()

    // Create entries for all days in the month (to ensure continuous line)
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day)
      const dateStr = date.toISOString().split("T")[0]
      dailyTotals.set(dateStr, 0)
    }

    // Sum expenses by date
    expenses.forEach((expense) => {
      const dateStr = expense.date
      const currentTotal = dailyTotals.get(dateStr) || 0
      dailyTotals.set(dateStr, currentTotal + expense.amount)
    })

    // Convert to array and sort by date
    return Array.from(dailyTotals.entries())
      .map(([dateStr, amount]) => {
        const date = new Date(dateStr)
        return {
          date: `${date.getMonth() + 1}/${date.getDate()}`,
          amount,
          rawDate: dateStr,
        }
      })
      .sort((a, b) => a.rawDate.localeCompare(b.rawDate))
  }, [expenses])

  if (expenses.length === 0) {
    return (
      <div className="flex items-center justify-center h-[400px] bg-muted/50 rounded-md">
        <div className="text-center">
          <p className="text-muted-foreground">No expense data available for this month.</p>
        </div>
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart
        data={chartData}
        margin={{
          top: 20,
          right: 30,
          left: 20,
          bottom: 10,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis tickFormatter={(value) => `$${value}`} />
        <Tooltip
          formatter={(value) => [`$${value.toLocaleString()}`, "Daily Spending"]}
          labelFormatter={(label) => `Date: ${label}`}
        />
        <Line
          type="monotone"
          dataKey="amount"
          name="Daily Spending"
          stroke="#8884d8"
          strokeWidth={2}
          dot={{ r: 4 }}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}


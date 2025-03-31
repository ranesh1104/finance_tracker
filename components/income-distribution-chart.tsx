"use client"

import { useMemo } from "react"
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface IncomeDistributionChartProps {
  income: number
  expenses: Array<{
    category: string
    total: number
  }>
}

// Helper function to classify expenses as needs or wants
const classifyNeedWant = (category: string): "need" | "want" => {
  const lower = category.toLowerCase()
  if (
    [
      "rent",
      "mortgage",
      "grocer",
      "gas",
      "electric",
      "wifi",
      "insurance",
      "student",
      "phone",
      "car",
      "utilities",
      "healthcare",
      "water",
    ].some((k) => lower.includes(k))
  )
    return "need"
  return "want"
}

export function IncomeDistributionChart({ income, expenses }: IncomeDistributionChartProps) {
  // Calculate distribution data
  const data = useMemo(() => {
    // Group expenses into needs and wants
    const needsTotal = expenses
      .filter((expense) => classifyNeedWant(expense.category) === "need")
      .reduce((sum, expense) => sum + expense.total, 0)

    const wantsTotal = expenses
      .filter((expense) => classifyNeedWant(expense.category) === "want")
      .reduce((sum, expense) => sum + expense.total, 0)

    // Calculate savings (income - expenses)
    const totalExpenses = needsTotal + wantsTotal
    const savings = Math.max(0, income - totalExpenses)

    // Calculate percentages
    const needsPercentage = income > 0 ? (needsTotal / income) * 100 : 0
    const wantsPercentage = income > 0 ? (wantsTotal / income) * 100 : 0
    const savingsPercentage = income > 0 ? (savings / income) * 100 : 0

    return [
      { name: "Needs", value: needsTotal, percentage: needsPercentage },
      { name: "Wants", value: wantsTotal, percentage: wantsPercentage },
      { name: "Saved", value: savings, percentage: savingsPercentage },
    ]
  }, [income, expenses])

  // Colors for the pie chart
  const COLORS = ["#ff9800", "#e91e63", "#4caf50"]

  // If no income, show a message
  if (income === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Income Distribution</CardTitle>
          <CardDescription>How your income is distributed</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <p className="text-muted-foreground">No income data available for this month</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Income Distribution</CardTitle>
        <CardDescription>How your income is distributed between needs, wants, and savings</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percentage }) => `${name}: ${percentage.toFixed(1)}%`}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value) => (value !== undefined ? [`$${Number(value).toLocaleString()}`, ""] : ["$0", ""])}
                itemSorter={(item) => (item.value !== undefined ? -item.value : 0)}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="grid grid-cols-3 gap-4 mt-4 text-center">
          {data.map((item, index) => (
            <div key={index} className="space-y-1">
              <div className="text-sm font-medium" style={{ color: COLORS[index] }}>
                {item.name}
              </div>
              <div className="text-xl font-bold">${item.value.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground">{item.percentage.toFixed(1)}% of income</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}


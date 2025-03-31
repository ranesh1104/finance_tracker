"use client"

import { useMemo } from "react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell } from "recharts"

interface BudgetBarChartProps {
  data: Array<{
    category: string
    budget: number
    actual: number
  }>
}

export function BudgetBarChart({ data }: BudgetBarChartProps) {
  // Process data to include percentage and color
  const chartData = useMemo(() => {
    return data.map((item) => {
      const hasActualData = item.actual > 0
      return {
        ...item,
        // If there's no actual spending data, use the budget as the display value
        displayValue: hasActualData ? item.actual : item.budget,
        percentSpent: item.budget > 0 ? (item.actual / item.budget) * 100 : 0,
        // Color based on whether we're over budget or if it's just the budget placeholder
        color: !hasActualData
          ? "rgba(150, 150, 150, 0.3)" // Translucent grey for budget placeholders
          : item.actual > item.budget
            ? "#ef4444" // Red if over budget
            : "#4ade80", // Green if under budget
      }
    })
  }, [data])

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={chartData}
        margin={{
          top: 20,
          right: 30,
          left: 20,
          bottom: 70,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="category" angle={-45} textAnchor="end" height={70} tick={{ fontSize: 12 }} />
        <YAxis tickFormatter={(value) => `$${value}`} />
        <Tooltip
          formatter={(value, name, props) => {
            const item = props.payload
            if (item) {
              // If it's just showing the budget (no actual data)
              if (item.actual === 0) {
                return [`$${item.budget}`, "Budget"]
              }

              // If showing actual data
              const percentage = item.budget > 0 ? Math.round((item.actual / item.budget) * 100) : 0
              return [`$${item.actual} (${percentage}% of budget)`, "Actual Spending"]
            }
            return [value, name]
          }}
          labelFormatter={(label) => `Category: ${label}`}
        />
        <Legend
          payload={[
            { value: "Budget (No Spending Data)", type: "rect", color: "rgba(150, 150, 150, 0.3)" },
            { value: "Under Budget", type: "rect", color: "#4ade80" },
            { value: "Over Budget", type: "rect", color: "#ef4444" },
          ]}
        />

        {/* Single bar that changes color based on budget status */}
        <Bar dataKey="displayValue" name="Spending" radius={[4, 4, 0, 0]}>
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}


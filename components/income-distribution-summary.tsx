"use client"

import { useState, useEffect } from "react"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import { useUser } from "@/hooks/use-user"

// Import the yearly summary service directly
import { financialSummaryService } from "@/utils/supabase/data-services"

export function IncomeDistributionSummary() {
  const { user } = useUser()
  const [loading, setLoading] = useState(true)
  const [chartData, setChartData] = useState<
    Array<{
      name: string
      value: number
      percentage: number
    }>
  >([])
  const [totalIncome, setTotalIncome] = useState(0)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      if (!user) return

      try {
        setLoading(true)
        setError(null)

        // Get yearly summaries for the last 3 years
        const currentYear = new Date().getFullYear()
        const startYear = currentYear - 2

        const yearlyData = await financialSummaryService.getMultiYearSummary(user.id, startYear, currentYear)

        // Calculate totals across all years
        let totalIncome = 0
        let totalExpenses = 0
        let needsTotal = 0
        let wantsTotal = 0

        // Process each year's data
        for (const yearData of yearlyData) {
          totalIncome += yearData.income
          totalExpenses += yearData.expenses

          // Estimate needs vs wants (approximately 60% needs, 40% wants)
          // This is an approximation - in a real app you'd want to categorize actual expenses
          needsTotal += yearData.expenses * 0.6
          wantsTotal += yearData.expenses * 0.4
        }

        // Calculate savings
        const savedTotal = totalIncome - totalExpenses

        // Calculate percentages
        const needsPercentage = totalIncome > 0 ? (needsTotal / totalIncome) * 100 : 0
        const wantsPercentage = totalIncome > 0 ? (wantsTotal / totalIncome) * 100 : 0
        const savedPercentage = totalIncome > 0 ? (savedTotal / totalIncome) * 100 : 0

        // Log for debugging
        console.log("Income Distribution (from yearly data):")
        console.log(`Total Income: $${totalIncome.toLocaleString()}`)
        console.log(`Total Expenses: $${totalExpenses.toLocaleString()}`)
        console.log(`Needs: $${needsTotal.toLocaleString()} (${needsPercentage.toFixed(1)}%)`)
        console.log(`Wants: $${wantsTotal.toLocaleString()} (${wantsPercentage.toFixed(1)}%)`)
        console.log(`Saved: $${savedTotal.toLocaleString()} (${savedPercentage.toFixed(1)}%)`)

        // Prepare chart data
        const data = [
          { name: "Needs", value: needsTotal, percentage: needsPercentage },
          { name: "Wants", value: wantsTotal, percentage: wantsPercentage },
          { name: "Saved", value: savedTotal, percentage: savedPercentage },
        ]

        setChartData(data)
        setTotalIncome(totalIncome)
      } catch (error) {
        console.error("Error fetching income distribution data:", error)
        setError("Failed to load income distribution data")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [user])

  // Colors for the pie chart
  const COLORS = ["#f59e0b", "#ec4899", "#4ade80"]

  // If loading, show a loading indicator
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Income Distribution</CardTitle>
          <CardDescription>How your income is distributed</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    )
  }

  // If error, show error message
  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Income Distribution</CardTitle>
          <CardDescription>How your income is distributed</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <p className="text-destructive">{error}</p>
        </CardContent>
      </Card>
    )
  }

  // If no data, show a message
  if (chartData.length === 0 || totalIncome === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Income Distribution</CardTitle>
          <CardDescription>How your income is distributed</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <p className="text-muted-foreground">No income data available</p>
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
        <div className="h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={true}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [`$${Number(value).toLocaleString()}`, ""]} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="grid grid-cols-3 gap-4 mt-4 text-center">
          {chartData.map((item, index) => (
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


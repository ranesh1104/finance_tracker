"use client"

import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Wallet, Calendar, TrendingDown } from "lucide-react"

interface WorkingCapitalMetricsProps {
  assets: Array<{
    name: string
    value: number
    type: string
  }>
  monthlyExpenses: Array<{
    month: string
    year: number
    total: number
  }>
}

export function WorkingCapitalMetrics({ assets, monthlyExpenses }: WorkingCapitalMetricsProps) {
  const metrics = useMemo(() => {
    // Calculate working capital (cash on hand)
    const cashAssets = assets.filter((asset) =>
      ["cash", "checking", "savings", "bank", "money market"].some(
        (term) => asset.type.toLowerCase().includes(term) || asset.name.toLowerCase().includes(term),
      ),
    )
    const workingCapital = cashAssets.reduce((sum, asset) => sum + asset.value, 0)

    // Calculate average monthly expenses (last 3 months)
    const sortedExpenses = [...monthlyExpenses].sort((a, b) => {
      const dateA = new Date(`${a.year}-${a.month}-01`)
      const dateB = new Date(`${b.year}-${b.month}-01`)
      return dateB.getTime() - dateA.getTime() // Sort descending
    })

    const recentExpenses = sortedExpenses.slice(0, 3)
    const avgMonthlyExpenses =
      recentExpenses.length > 0
        ? recentExpenses.reduce((sum, month) => sum + month.total, 0) / recentExpenses.length
        : 0

    // Calculate months of working capital
    const monthsOfCapital = avgMonthlyExpenses > 0 ? workingCapital / avgMonthlyExpenses : 0

    return {
      workingCapital,
      avgMonthlyExpenses,
      monthsOfCapital,
      recentMonths: recentExpenses.length,
    }
  }, [assets, monthlyExpenses])

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Working Capital</CardTitle>
          <Wallet className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">${metrics.workingCapital.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground mt-1">Cash available across all accounts</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Avg. Monthly Expenses</CardTitle>
          <TrendingDown className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            ${metrics.avgMonthlyExpenses.toLocaleString(undefined, { maximumFractionDigits: 2 })}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Based on{" "}
            {metrics.recentMonths === 0
              ? "no data"
              : metrics.recentMonths === 1
                ? "last month"
                : `last ${metrics.recentMonths} months`}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Months of Capital</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {metrics.monthsOfCapital === 0 ? "N/A" : metrics.monthsOfCapital.toFixed(1)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {metrics.monthsOfCapital >= 6
              ? "Excellent emergency fund"
              : metrics.monthsOfCapital >= 3
                ? "Good emergency fund"
                : metrics.monthsOfCapital > 0
                  ? "Building emergency fund"
                  : "Add data to calculate"}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}


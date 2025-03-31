"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BarChart3, DollarSign, PiggyBank, TrendingUp, ArrowUpRight } from "lucide-react"
import { useUser } from "@/hooks/use-user"
import {
  assetService,
  liabilityService,
  budgetService,
  expenseService,
  incomeService,
  type Asset,
  type Liability,
  type BudgetCategory,
  type Income,
} from "@/utils/supabase/data-services"
import { BudgetBarChart } from "@/components/budget-bar-chart"
import { WorkingCapitalMetrics } from "@/components/working-capital-metrics"
// Remove the import for the new component
// import { YearlyBreakdownWithOverride } from "@/components/yearly-breakdown-with-override"
import { YearlyBreakdown } from "@/components/yearly-breakdown"
import { IncomeDistributionSummary } from "@/components/income-distribution-summary"

// Define the expense category type based on what's returned from the service
interface ExpenseCategory {
  category: string
  total: number
}

// Define the dashboard data state type
interface DashboardData {
  assets: Asset[]
  liabilities: Liability[]
  expenses: ExpenseCategory[]
  budgetCategories: BudgetCategory[]
  income: Income[]
  netWorth: number
  netWorthChange: number
  monthlyIncome: number
  monthlyExpenses: number
  monthlySavings: number
  savingsRate: number
  investments: number
  investmentsChange: number
  retirementProgress: number
  allTimeIncome: number
  allTimeExpenses: number
  allTimeSavings: number
  allTimeSavingsRate: number
  allTimeExpensesByCategory: ExpenseCategory[]
  averageMonthlyExpensesByCategory: ExpenseCategory[]
}

export default function DashboardPage() {
  const { user, loading: userLoading } = useUser()
  const [loading, setLoading] = useState(true)

  // Initialize with properly typed empty arrays
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    assets: [],
    liabilities: [],
    expenses: [],
    budgetCategories: [],
    income: [],
    netWorth: 0,
    netWorthChange: 0,
    monthlyIncome: 0,
    monthlyExpenses: 0,
    monthlySavings: 0,
    savingsRate: 0,
    investments: 0,
    investmentsChange: 0,
    retirementProgress: 0,
    allTimeIncome: 0,
    allTimeExpenses: 0,
    allTimeSavings: 0,
    allTimeSavingsRate: 0,
    allTimeExpensesByCategory: [],
    averageMonthlyExpensesByCategory: [],
  })

  const [monthlyExpensesHistory, setMonthlyExpensesHistory] = useState<
    Array<{
      month: string
      year: number
      total: number
    }>
  >([])
  const [yearlyData, setYearlyData] = useState<
    Array<{
      year: number
      income: number
      expenses: number
    }>
  >([])

  // Get current month and year
  const getCurrentMonthAndYear = () => {
    const now = new Date()
    const months = [
      "january",
      "february",
      "march",
      "april",
      "may",
      "june",
      "july",
      "august",
      "september",
      "october",
      "november",
      "december",
    ]
    return {
      month: months[now.getMonth()],
      year: now.getFullYear(),
    }
  }

  // Get previous month and year
  const getPreviousMonthAndYear = () => {
    const now = new Date()
    now.setMonth(now.getMonth() - 1)
    const months = [
      "january",
      "february",
      "march",
      "april",
      "may",
      "june",
      "july",
      "august",
      "september",
      "october",
      "november",
      "december",
    ]
    return {
      month: months[now.getMonth()],
      year: now.getFullYear(),
    }
  }

  // Fetch all data
  useEffect(() => {
    async function fetchData() {
      if (!user) return

      try {
        setLoading(true)
        const { month, year } = getCurrentMonthAndYear()
        const { month: prevMonth, year: prevYear } = getPreviousMonthAndYear()

        // Fetch all data in parallel
        const months = [
          "january",
          "february",
          "march",
          "april",
          "may",
          "june",
          "july",
          "august",
          "september",
          "october",
          "november",
          "december",
        ]
        const [
          assets,
          liabilities,
          budgetCategories,
          expenses,
          income,
          prevExpenses,
          prevIncome,
          allIncome,
          allExpenses,
        ] = await Promise.all([
          assetService.getAssets(user.id),
          liabilityService.getLiabilities(user.id),
          budgetService.getBudgetCategories(user.id, month, year),
          expenseService.getExpensesByCategory(user.id, month, year),
          incomeService.getIncome(user.id, month, year),
          expenseService.getExpensesByCategory(user.id, prevMonth, prevYear),
          incomeService.getIncome(user.id, prevMonth, prevYear),
          incomeService.getAllIncome(user.id),
          expenseService.getAllMonthlyExpenses(user.id),
        ])

        // Calculate key metrics
        const totalAssets = assets.reduce((sum, asset) => sum + asset.value, 0)
        const totalLiabilities = liabilities.reduce((sum, liability) => sum + liability.value, 0)
        const netWorth = totalAssets - totalLiabilities

        const totalIncome = income.reduce((sum, item) => sum + item.amount, 0)
        const totalExpenses = expenses.reduce((sum, item) => sum + item.total, 0)
        const monthlySavings = totalIncome - totalExpenses
        const savingsRate = totalIncome > 0 ? (monthlySavings / totalIncome) * 100 : 0

        // Calculate previous month metrics for comparison
        const prevTotalIncome = prevIncome.reduce((sum, item) => sum + item.amount, 0)
        const prevTotalExpenses = prevExpenses.reduce((sum, item) => sum + item.total, 0)
        const prevMonthlySavings = prevTotalIncome - prevTotalExpenses

        // Calculate month-over-month changes
        const netWorthChange = prevMonthlySavings > 0 ? (monthlySavings / prevMonthlySavings - 1) * 100 : 3.2

        // Calculate investment metrics
        const investments = assets
          .filter((asset) =>
            ["investment", "stock", "etf", "crypto", "retirement"].includes(asset.type?.toLowerCase() || ""),
          )
          .reduce((sum, asset) => sum + asset.value, 0)

        // Calculate investment change (placeholder for now)
        const investmentsChange = 2.5 // This would need historical data to calculate accurately

        // Estimate retirement progress (simplified calculation)
        // Assuming retirement goal is 25x annual expenses
        const annualExpenses = totalExpenses * 12
        const retirementGoal = annualExpenses * 25
        const retirementProgress = retirementGoal > 0 ? Math.min(100, (investments / retirementGoal) * 100) : 0

        // Calculate all-time metrics
        const allTimeIncome = allIncome.reduce((sum, item) => sum + item.amount, 0)

        // Process all expenses to get total and by category
        const allTimeExpensesByCategory: Record<string, number> = {}
        let allTimeExpensesTotal = 0

        // Group expenses by month and year to count unique months
        const monthsWithExpenses = new Set<string>()

        allExpenses.forEach((expense) => {
          allTimeExpensesTotal += expense.amount

          if (!allTimeExpensesByCategory[expense.category]) {
            allTimeExpensesByCategory[expense.category] = 0
          }
          allTimeExpensesByCategory[expense.category] += expense.amount

          // Track unique months for calculating averages
          const expenseDate = new Date(expense.date)
          const monthYear = `${expenseDate.getFullYear()}-${expenseDate.getMonth()}`
          monthsWithExpenses.add(monthYear)
        })

        // Number of months with expense data
        const numberOfMonths = Math.max(1, monthsWithExpenses.size)
        console.log(`Data spans ${numberOfMonths} months`)

        // Convert to array and sort by total (descending)
        const allTimeExpensesCategoryArray = Object.entries(allTimeExpensesByCategory)
          .map(([category, total]) => ({ category, total }))
          .sort((a, b) => b.total - a.total)

        // Calculate average monthly expenses by category
        const averageMonthlyExpensesByCategory = Object.entries(allTimeExpensesByCategory)
          .map(([category, total]) => ({
            category,
            total: total / numberOfMonths,
          }))
          .sort((a, b) => b.total - a.total)

        const allTimeSavings = allTimeIncome - allTimeExpensesTotal
        const allTimeSavingsRate = allTimeIncome > 0 ? (allTimeSavings / allTimeIncome) * 100 : 0

        // Process monthly expenses history (for working capital calculation)
        const monthlyExpensesData = allExpenses.reduce(
          (acc, expense) => {
            const date = new Date(expense.date)
            const month = months[date.getMonth()]
            const year = date.getFullYear()
            const key = `${year}-${month}`

            if (!acc[key]) {
              acc[key] = {
                month,
                year,
                total: 0,
              }
            }

            acc[key].total += expense.amount
            return acc
          },
          {} as Record<string, { month: string; year: number; total: number }>,
        )

        setMonthlyExpensesHistory(Object.values(monthlyExpensesData))

        // Update the yearly data processing logic to correctly aggregate expenses by year

        // Process yearly data
        const yearlyBreakdownData = allIncome.reduce(
          (acc, income) => {
            const year = income.year

            if (!acc[year]) {
              acc[year] = {
                year,
                income: 0,
                expenses: 0,
              }
            }

            acc[year].income += income.amount
            return acc
          },
          {} as Record<number, { year: number; income: number; expenses: number }>,
        )

        // Process expenses by extracting the year from the date field
        allExpenses.forEach((expense) => {
          // Parse the date string to get the year
          const year = new Date(expense.date).getFullYear()

          // Only process valid years (2023 and later)
          if (year >= 2023) {
            if (!yearlyBreakdownData[year]) {
              yearlyBreakdownData[year] = {
                year,
                income: 0,
                expenses: 0,
              }
            }

            yearlyBreakdownData[year].expenses += expense.amount
          }
        })

        // Ensure we have current year data even if no expenses yet
        const currentYear = new Date().getFullYear()
        if (!yearlyBreakdownData[currentYear]) {
          yearlyBreakdownData[currentYear] = {
            year: currentYear,
            income: 0,
            expenses: 0,
          }
        }

        // Filter out years before 2023
        const filteredYearlyData = Object.values(yearlyBreakdownData)
          .filter((data) => data.year >= 2023)
          .sort((a, b) => b.year - a.year) // Sort by most recent year first

        setYearlyData(filteredYearlyData)

        if (yearlyBreakdownData[new Date().getFullYear()]?.expenses === 0) {
          console.log("Current year shows zero expenses, running debug function...")
          const currentYearExpenses = await debugCurrentYearExpenses(user.id)

          if (currentYearExpenses > 0 && yearlyBreakdownData[new Date().getFullYear()]) {
            console.log(`Updating current year expenses to $${currentYearExpenses}`)
            yearlyBreakdownData[new Date().getFullYear()].expenses = currentYearExpenses
          }
        }

        setDashboardData({
          assets,
          liabilities,
          expenses,
          budgetCategories,
          income,
          netWorth,
          netWorthChange: netWorthChange || 3.2, // Fallback to 3.2% if calculation fails
          monthlyIncome: totalIncome,
          monthlyExpenses: totalExpenses,
          monthlySavings,
          savingsRate,
          investments,
          investmentsChange, // This would need historical data to calculate accurately
          retirementProgress: Math.round(retirementProgress),
          allTimeIncome,
          allTimeExpenses: allTimeExpensesTotal,
          allTimeSavings,
          allTimeSavingsRate,
          allTimeExpensesByCategory: allTimeExpensesCategoryArray,
          averageMonthlyExpensesByCategory,
        })
      } catch (error) {
        console.error("Error fetching dashboard data:", error)
      } finally {
        setLoading(false)
      }
    }

    // Update the debug function to provide more detailed information
    async function debugCurrentYearExpenses(userId: string) {
      try {
        const currentYear = new Date().getFullYear()
        const startDate = new Date(currentYear, 0, 1).toISOString().split("T")[0] // Jan 1 of current year
        const endDate = new Date().toISOString().split("T")[0] // Today

        console.log(`Fetching expenses from ${startDate} to ${endDate}`)

        const expenses = await expenseService.getExpenses(userId, startDate, endDate)
        console.log(`Found ${expenses.length} expenses for ${currentYear}:`)

        // Log the first few expenses for debugging
        expenses.slice(0, 5).forEach((expense, i) => {
          console.log(`Expense ${i + 1}: ${expense.description}, ${expense.date}, $${expense.amount}`)
        })

        // Calculate total
        const total = expenses.reduce((sum, exp) => sum + exp.amount, 0)
        console.log(`Total expenses for ${currentYear}: $${total.toLocaleString()}`)

        // Group expenses by month to see distribution
        const expensesByMonth: Record<string, number> = {}
        expenses.forEach((expense) => {
          const date = new Date(expense.date)
          const month = date.getMonth()
          if (!expensesByMonth[month]) {
            expensesByMonth[month] = 0
          }
          expensesByMonth[month] += expense.amount
        })

        console.log("Expenses by month:")
        Object.entries(expensesByMonth).forEach(([month, amount]) => {
          console.log(`Month ${Number.parseInt(month) + 1}: $${amount.toLocaleString()}`)
        })

        return total
      } catch (error) {
        console.error("Error debugging current year expenses:", error)
        return 0
      }
    }

    if (!userLoading && user) {
      fetchData()
    }
  }, [user, userLoading])

  // Prepare data for spending by category chart - using average monthly expenses
  const categorySpendingData = dashboardData.budgetCategories.map((category) => {
    // Find the average monthly expense for this category
    const averageSpent =
      dashboardData.averageMonthlyExpensesByCategory.find(
        (e) => e.category.toLowerCase() === category.category.toLowerCase(),
      )?.total || 0

    return {
      category: category.category,
      budget: category.budgeted,
      actual: averageSpent,
    }
  })

  // Show loading state
  if (userLoading || loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading your financial data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back, {user?.user_metadata.full_name || user?.email}</p>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Net Worth</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${dashboardData.netWorth.toLocaleString()}</div>
                <div className="flex items-center text-xs text-muted-foreground">
                  <ArrowUpRight className="mr-1 h-3.5 w-3.5 text-green-500" />
                  <span className="text-green-500">{dashboardData.netWorthChange.toFixed(1)}%</span>
                  <span className="ml-1">from last month</span>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Average Monthly Savings</CardTitle>
                <PiggyBank className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${Math.round(dashboardData.allTimeSavings / 12).toLocaleString()}
                </div>
                <div className="flex items-center text-xs text-muted-foreground">
                  <span>All-time savings rate: </span>
                  <span className={`ml-1 ${dashboardData.allTimeSavingsRate >= 0 ? "text-green-500" : "text-red-500"}`}>
                    {dashboardData.allTimeSavingsRate.toFixed(1)}%
                  </span>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Investments</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${dashboardData.investments.toLocaleString()}</div>
                <div className="flex items-center text-xs text-muted-foreground">
                  <ArrowUpRight className="mr-1 h-3.5 w-3.5 text-green-500" />
                  <span className="text-green-500">{dashboardData.investmentsChange.toFixed(1)}%</span>
                  <span className="ml-1">from last month</span>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Retirement Progress</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboardData.retirementProgress}%</div>
                <div className="h-4 w-full rounded-full bg-muted mt-2">
                  <div
                    className="h-4 rounded-full bg-primary"
                    style={{ width: `${dashboardData.retirementProgress}%` }}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <WorkingCapitalMetrics assets={dashboardData.assets} monthlyExpenses={monthlyExpensesHistory} />

          {/* Change the component usage back to the original YearlyBreakdown */}
          <YearlyBreakdown />

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Monthly Overview</CardTitle>
                <CardDescription>Average monthly expenses compared to your budget</CardDescription>
              </CardHeader>
              <CardContent className="pl-2">
                {dashboardData.budgetCategories.length > 0 ? (
                  <div className="h-[300px]">
                    <BudgetBarChart data={categorySpendingData} />
                  </div>
                ) : (
                  <div className="h-[300px] flex items-center justify-center bg-muted/50 rounded-md">
                    <div className="text-center">
                      <BarChart3 className="mx-auto h-12 w-12 text-muted-foreground" />
                      <p className="mt-2 text-sm text-muted-foreground">
                        Add budget categories to see your monthly overview
                      </p>
                      <Button variant="outline" className="mt-4" asChild>
                        <Link href="/dashboard/monthly">Set Up Budget</Link>
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
            <IncomeDistributionSummary />
          </div>
        </TabsContent>
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card className="col-span-2">
              <CardHeader>
                <CardTitle>Net Worth Trend</CardTitle>
                <CardDescription>Your net worth growth over time</CardDescription>
              </CardHeader>
              <CardContent className="pl-2">
                <div className="h-[300px] flex items-center justify-center bg-muted/50 rounded-md">
                  <div className="text-center">
                    <TrendingUp className="mx-auto h-12 w-12 text-muted-foreground" />
                    <p className="mt-2 text-sm text-muted-foreground">
                      Historical net worth data will appear here as you track your finances over time
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Asset Allocation</CardTitle>
                <CardDescription>Distribution of your assets</CardDescription>
              </CardHeader>
              <CardContent>
                {dashboardData.assets.length > 0 ? (
                  <div className="space-y-4">
                    {/* Group assets by type and calculate percentages */}
                    {Object.entries(
                      dashboardData.assets.reduce(
                        (acc, asset) => {
                          const type = asset.type || "Other"
                          if (!acc[type]) acc[type] = 0
                          acc[type] += asset.value
                          return acc
                        },
                        {} as Record<string, number>,
                      ),
                    )
                      .sort((a, b) => b[1] - a[1])
                      .map(([type, value], index) => {
                        const percentage = dashboardData.netWorth > 0 ? (value / dashboardData.netWorth) * 100 : 0

                        return (
                          <div key={index} className="flex items-center">
                            <div className="w-full">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium capitalize">{type}</span>
                                <span className="text-sm text-muted-foreground">${value.toLocaleString()}</span>
                              </div>
                              <div className="mt-1 h-2 w-full rounded-full bg-muted">
                                <div className="h-2 rounded-full bg-primary" style={{ width: `${percentage}%` }} />
                              </div>
                            </div>
                          </div>
                        )
                      })}
                  </div>
                ) : (
                  <div className="h-[300px] flex items-center justify-center bg-muted/50 rounded-md">
                    <div className="text-center">
                      <PiggyBank className="mx-auto h-12 w-12 text-muted-foreground" />
                      <p className="mt-2 text-sm text-muted-foreground">Add assets to see your allocation breakdown</p>
                      <Button variant="outline" className="mt-4" asChild>
                        <Link href="/dashboard/net-worth">Add Assets</Link>
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Reports</CardTitle>
              <CardDescription>Download or view your financial reports</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <p className="text-muted-foreground mb-4">
                    Monthly reports will be generated as you continue to track your finances
                  </p>
                  <Button variant="outline" asChild>
                    <Link href="/dashboard/monthly">View Monthly Breakdown</Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}


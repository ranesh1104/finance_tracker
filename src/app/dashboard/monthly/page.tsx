"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PlusCircle, Trash2, DollarSign, CreditCard, PiggyBank, Receipt } from "lucide-react"
import { toast } from "sonner"
import { useUser } from "@/hooks/use-user"
import {
  budgetService,
  expenseService,
  incomeService,
  type BudgetCategory,
  type Income,
  type Expense,
} from "@/utils/supabase/data-services"
import { CSVUpload } from "@/components/csv-upload"
import Link from "next/link"
import { BudgetBarChart } from "@/components/budget-bar-chart"
import { IncomeFlowSankey } from "@/components/income-flow-sankey"
import { IncomeCSVUpload } from "@/components/income-csv-upload"
import { BudgetCategoryImport } from "@/components/budget-category-import"
import { DailySpendingChart } from "@/components/daily-spending-chart"
import { IncomeDistributionChart } from "@/components/income-distribution-chart"

export default function MonthlyBreakdownPage() {
  const { user, loading: userLoading } = useUser()
  const [budget, setBudget] = useState<BudgetCategory[]>([])
  const [income, setIncome] = useState<Income[]>([])
  const [expenses, setExpenses] = useState<{ category: string; total: number }[]>([])
  const [dailyExpenses, setDailyExpenses] = useState<Expense[]>([])
  const [newCategory, setNewCategory] = useState({ category: "", budgeted: "", spent: "0" })
  const [newIncome, setNewIncome] = useState({ source: "", amount: "" })
  const [selectedMonth, setSelectedMonth] = useState("current")
  const [currentMonth, setCurrentMonth] = useState("march") // Default, will be updated
  const [currentYear, setCurrentYear] = useState(2025) // Default, will be updated
  const [loading, setLoading] = useState(true)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Set current month and year
  useEffect(() => {
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
    setCurrentMonth(months[now.getMonth()])
    setCurrentYear(now.getFullYear())
  }, [])

  // Fetch budget, income, and expenses
  useEffect(() => {
    async function fetchData() {
      if (!user) return

      try {
        setLoading(true)
        const [budgetData, incomeData, expensesData] = await Promise.all([
          budgetService.getBudgetCategories(user.id, currentMonth, currentYear),
          incomeService.getIncome(user.id, currentMonth, currentYear),
          expenseService.getExpensesByCategory(user.id, currentMonth, currentYear),
        ])

        setBudget(budgetData)
        setIncome(incomeData)
        setExpenses(expensesData)

        // Fetch raw expense data for daily view
        const startDate = new Date(currentYear, getMonthNumber(currentMonth), 1).toISOString().split("T")[0]
        const endDate = new Date(currentYear, getMonthNumber(currentMonth) + 1, 0).toISOString().split("T")[0]
        const rawExpenses = await expenseService.getExpenses(user.id, startDate, endDate)
        setDailyExpenses(rawExpenses)
      } catch (error: any) {
        toast.error("Error loading data", {
          description: error.message || "Failed to load your monthly data",
        })
      } finally {
        setLoading(false)
      }
    }

    if (!userLoading && user) {
      fetchData()
    }
  }, [user, userLoading, currentMonth, currentYear])

  // Calculate totals
  const totalBudgeted = budget.reduce((sum, item) => sum + item.budgeted, 0)
  const totalSpent = expenses.reduce((sum, item) => sum + item.total, 0)
  const totalIncome = income.reduce((sum, item) => sum + item.amount, 0)
  const remainingBudget = totalBudgeted - totalSpent
  const savingsAmount = totalIncome - totalSpent
  const savingsRate = totalIncome > 0 ? (savingsAmount / totalIncome) * 100 : 0

  // Prepare data for chart
  const categorySpending = budget.map((category) => {
    const actualSpent = expenses.find((e) => e.category.toLowerCase() === category.category.toLowerCase())?.total || 0
    const percentSpent = category.budgeted > 0 ? (actualSpent / category.budgeted) * 100 : 0
    return {
      category: category.category,
      budget: category.budgeted,
      actual: actualSpent,
      percentSpent: percentSpent,
      // Color based on whether we're over budget
      color: actualSpent > category.budgeted ? "#ef4444" : "#4ade80", // Red if over budget, green otherwise
    }
  })

  // Add new budget category
  const handleAddCategory = async () => {
    if (!user) return
    if (newCategory.category && newCategory.budgeted) {
      try {
        const category = await budgetService.addBudgetCategory({
          user_id: user.id,
          category: newCategory.category,
          budgeted: Number(newCategory.budgeted),
          month: currentMonth,
          year: currentYear,
        })

        setBudget([...budget, category])
        setNewCategory({ category: "", budgeted: "", spent: "0" })
        toast.success("Budget category added successfully")
      } catch (error: any) {
        toast.error("Error adding budget category", {
          description: error.message || "Failed to add the budget category",
        })
      }
    } else {
      toast.error("Please fill in all fields")
    }
  }

  // Add new income source
  const handleAddIncome = async () => {
    if (!user) return
    if (newIncome.source && newIncome.amount) {
      try {
        const incomeItem = await incomeService.addIncome({
          user_id: user.id,
          source: newIncome.source,
          amount: Number(newIncome.amount),
          month: currentMonth,
          year: currentYear,
        })

        setIncome([...income, incomeItem])
        setNewIncome({ source: "", amount: "" })
        toast.success("Income added successfully")
      } catch (error: any) {
        toast.error("Error adding income", {
          description: error.message || "Failed to add the income",
        })
      }
    } else {
      toast.error("Please fill in all fields")
    }
  }

  // Remove budget category
  const handleRemoveCategory = async (id: string) => {
    try {
      await budgetService.deleteBudgetCategory(id)
      setBudget(budget.filter((item) => item.id !== id))
      toast.success("Budget category removed successfully")
    } catch (error: any) {
      toast.error("Error removing budget category", {
        description: error.message || "Failed to remove the budget category",
      })
    }
  }

  // Remove income source
  const handleRemoveIncome = async (id: string) => {
    try {
      await incomeService.deleteIncome(id)
      setIncome(income.filter((item) => item.id !== id))
      toast.success("Income removed successfully")
    } catch (error: any) {
      toast.error("Error removing income", {
        description: error.message || "Failed to remove the income",
      })
    }
  }

  // Update budget category
  const handleUpdateBudget = async (id: string, budgeted: number) => {
    try {
      await budgetService.updateBudgetCategory(id, { budgeted })
      setBudget(budget.map((item) => (item.id === id ? { ...item, budgeted } : item)))
      toast.success("Budget updated successfully")
    } catch (error: any) {
      toast.error("Error updating budget", {
        description: error.message || "Failed to update the budget",
      })
    }
  }

  // Helper function to convert month name to number (0-based)
  const getMonthNumber = (month: string): number => {
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
    return months.indexOf(month.toLowerCase())
  }

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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Monthly Breakdown</h1>
          <p className="text-muted-foreground">Track your monthly income, expenses, and savings</p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/dashboard/monthly/expenses" className="flex items-center gap-2">
            <Receipt className="h-4 w-4" />
            View All Expenses
          </Link>
        </Button>
      </div>

      <div className="flex justify-between items-center">
        <Tabs defaultValue="current" value={selectedMonth} onValueChange={setSelectedMonth}>
          <TabsList>
            <TabsTrigger value="current">Current Month</TabsTrigger>
            <TabsTrigger value="daily">Daily View</TabsTrigger>
            <TabsTrigger value="next">Next Month (Planning)</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="flex gap-2">
          <Select value={currentMonth} onValueChange={setCurrentMonth}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select month" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="january">January</SelectItem>
              <SelectItem value="february">February</SelectItem>
              <SelectItem value="march">March</SelectItem>
              <SelectItem value="april">April</SelectItem>
              <SelectItem value="may">May</SelectItem>
              <SelectItem value="june">June</SelectItem>
              <SelectItem value="july">July</SelectItem>
              <SelectItem value="august">August</SelectItem>
              <SelectItem value="september">September</SelectItem>
              <SelectItem value="october">October</SelectItem>
              <SelectItem value="november">November</SelectItem>
              <SelectItem value="december">December</SelectItem>
            </SelectContent>
          </Select>

          <Select value={currentYear.toString()} onValueChange={(value) => setCurrentYear(Number(value))}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Select year" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2023">2023</SelectItem>
              <SelectItem value="2024">2024</SelectItem>
              <SelectItem value="2025">2025</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {selectedMonth === "current" && (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Income</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">${totalIncome.toLocaleString()}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-500">${totalSpent.toLocaleString()}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {totalBudgeted > 0 ? `${Math.round((totalSpent / totalBudgeted) * 100)}% of budget` : "No budget set"}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Remaining Budget</CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${remainingBudget >= 0 ? "text-green-600" : "text-red-500"}`}>
                  ${remainingBudget.toLocaleString()}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Savings</CardTitle>
                <PiggyBank className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${savingsAmount >= 0 ? "text-green-600" : "text-red-500"}`}>
                  ${savingsAmount.toLocaleString()}
                </div>
                <div className="text-xs text-muted-foreground mt-1">{savingsRate.toFixed(1)}% of income</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Spending by Category</CardTitle>
              <CardDescription>Compare your actual spending to your budget</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <BudgetBarChart data={categorySpending} />
              </div>
            </CardContent>
          </Card>

          {/* Sankey Diagram */}
          <Card>
            <CardHeader>
              <CardTitle>Money Flow</CardTitle>
              <CardDescription>Visualize how your income flows to different spending categories</CardDescription>
            </CardHeader>
            <CardContent>
              <IncomeFlowSankey
                income={income}
                expenses={expenses.map((e) => ({
                  category: e.category,
                  total: e.total,
                }))}
                savings={savingsAmount}
              />
            </CardContent>
          </Card>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Budget Categories</CardTitle>
                <CardDescription>Manage your monthly budget categories</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-12 gap-4">
                    <div className="col-span-5">
                      <Label htmlFor="category-name">Category</Label>
                      <Input
                        id="category-name"
                        value={newCategory.category}
                        onChange={(e) => setNewCategory({ ...newCategory, category: e.target.value })}
                        placeholder="e.g., Groceries"
                      />
                    </div>
                    <div className="col-span-3">
                      <Label htmlFor="category-budget">Budget ($)</Label>
                      <Input
                        id="category-budget"
                        type="number"
                        value={newCategory.budgeted}
                        onChange={(e) => setNewCategory({ ...newCategory, budgeted: e.target.value })}
                        placeholder="500"
                      />
                    </div>
                    <div className="col-span-3">
                      <Label htmlFor="category-spent">Spent ($)</Label>
                      <Input
                        id="category-spent"
                        type="number"
                        value={newCategory.spent}
                        onChange={(e) => setNewCategory({ ...newCategory, spent: e.target.value })}
                        placeholder="0"
                        disabled
                      />
                    </div>
                    <div className="col-span-1 flex items-end">
                      <Button onClick={handleAddCategory} size="icon" className="w-full">
                        <PlusCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="rounded-md border">
                    <div className="grid grid-cols-12 gap-4 p-3 font-medium bg-muted/50">
                      <div className="col-span-4">Category</div>
                      <div className="col-span-2">Budgeted</div>
                      <div className="col-span-2">Spent</div>
                      <div className="col-span-3">% Spent</div>
                      <div className="col-span-1"></div>
                    </div>
                    <div className="divide-y">
                      {budget.map((item) => {
                        const spent =
                          expenses.find((e) => e.category.toLowerCase() === item.category.toLowerCase())?.total || 0
                        const percentage = item.budgeted > 0 ? (spent / item.budgeted) * 100 : 0

                        return (
                          <div key={item.id} className="grid grid-cols-12 gap-4 p-3 items-center">
                            <div className="col-span-4">{item.category}</div>
                            <div className="col-span-2">
                              <Input
                                type="number"
                                value={item.budgeted}
                                onChange={(e) => handleUpdateBudget(item.id, Number(e.target.value))}
                                className="h-8"
                              />
                            </div>
                            <div className="col-span-2">${spent.toLocaleString()}</div>
                            <div className="col-span-3">
                              <div className="flex items-center gap-2">
                                <div className="relative w-full h-2 bg-muted rounded-full overflow-hidden">
                                  <div
                                    className={`absolute h-full ${spent > item.budgeted ? "bg-red-500" : "bg-primary"}`}
                                    style={{ width: `${Math.min(percentage, 100)}%` }}
                                  />
                                </div>
                                <span className="text-xs w-12">{Math.round(percentage)}%</span>
                              </div>
                            </div>
                            <div className="col-span-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRemoveCategory(item.id)}
                                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Income Sources</CardTitle>
                <CardDescription>Manage your monthly income sources</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-12 gap-4">
                    <div className="col-span-7">
                      <Label htmlFor="income-source">Source</Label>
                      <Input
                        id="income-source"
                        value={newIncome.source}
                        onChange={(e) => setNewIncome({ ...newIncome, source: e.target.value })}
                        placeholder="e.g., Salary"
                      />
                    </div>
                    <div className="col-span-4">
                      <Label htmlFor="income-amount">Amount ($)</Label>
                      <Input
                        id="income-amount"
                        type="number"
                        value={newIncome.amount}
                        onChange={(e) => setNewIncome({ ...newIncome, amount: e.target.value })}
                        placeholder="5000"
                      />
                    </div>
                    <div className="col-span-1 flex items-end">
                      <Button onClick={handleAddIncome} size="icon" className="w-full">
                        <PlusCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="rounded-md border">
                    <div className="grid grid-cols-12 gap-4 p-3 font-medium bg-muted/50">
                      <div className="col-span-8">Source</div>
                      <div className="col-span-3">Amount</div>
                      <div className="col-span-1"></div>
                    </div>
                    <div className="divide-y">
                      {income.map((item) => (
                        <div key={item.id} className="grid grid-cols-12 gap-4 p-3 items-center">
                          <div className="col-span-8">{item.source}</div>
                          <div className="col-span-3">${item.amount.toLocaleString()}</div>
                          <div className="col-span-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveIncome(item.id)}
                              className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {selectedMonth === "daily" && (
        <div className="grid gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Daily Spending</CardTitle>
              <CardDescription>Track your spending patterns throughout the month</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[500px]">
                <DailySpendingChart expenses={dailyExpenses} />
              </div>
            </CardContent>
          </Card>

          <IncomeDistributionChart income={totalIncome} expenses={expenses} />
        </div>
      )}

      {selectedMonth === "next" && (
        <div className="grid gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Next Month Planning</CardTitle>
              <CardDescription>Plan your budget for next month</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Use this space to plan your budget for next month. You can copy your current budget categories or create
                new ones.
              </p>
              <Button className="mt-4" variant="outline">
                Copy Current Budget to Next Month
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {selectedMonth !== "daily" && (
        <>
          <CSVUpload
            month={currentMonth}
            year={currentYear}
            onSuccess={() => {
              // Refresh expenses data
              if (user) {
                expenseService
                  .getExpensesByCategory(user.id, currentMonth, currentYear)
                  .then((expensesData) => setExpenses(expensesData))
                  .catch((error) => {
                    toast.error("Error refreshing expenses", {
                      description: error.message || "Failed to refresh your expense data",
                    })
                  })

                // Also refresh raw expenses for daily view
                const startDate = new Date(currentYear, getMonthNumber(currentMonth), 1).toISOString().split("T")[0]
                const endDate = new Date(currentYear, getMonthNumber(currentMonth) + 1, 0).toISOString().split("T")[0]
                expenseService
                  .getExpenses(user.id, startDate, endDate)
                  .then((rawExpenses) => setDailyExpenses(rawExpenses))
                  .catch((error) => {
                    toast.error("Error refreshing daily expenses", {
                      description: error.message || "Failed to refresh your daily expense data",
                    })
                  })
              }
            }}
          />
          <IncomeCSVUpload
            month={currentMonth}
            year={currentYear}
            onSuccess={() => {
              // Refresh income data
              if (user) {
                incomeService
                  .getIncome(user.id, currentMonth, currentYear)
                  .then((incomeData) => setIncome(incomeData))
                  .catch((error) => {
                    toast.error("Error refreshing income", {
                      description: error.message || "Failed to refresh your income data",
                    })
                  })
              }
            }}
          />
          <BudgetCategoryImport
            month={currentMonth}
            year={currentYear}
            onSuccess={() => {
              // Refresh budget categories
              if (user) {
                budgetService
                  .getBudgetCategories(user.id, currentMonth, currentYear)
                  .then((budgetData) => setBudget(budgetData))
                  .catch((error) => {
                    toast.error("Error refreshing budget categories", {
                      description: error.message || "Failed to refresh your budget data",
                    })
                  })
              }
            }}
          />
        </>
      )}
    </div>
  )
}


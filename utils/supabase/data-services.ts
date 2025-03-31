import { createClient } from "./client"
import type { Database } from "@/types/supabase"

// Type definitions for our data models
export type Profile = Database["public"]["Tables"]["profiles"]["Row"]
export type Asset = Database["public"]["Tables"]["assets"]["Row"]
export type Liability = Database["public"]["Tables"]["liabilities"]["Row"]
export type BudgetCategory = Database["public"]["Tables"]["budget_categories"]["Row"]
export type Expense = Database["public"]["Tables"]["expenses"]["Row"]
export type Income = Database["public"]["Tables"]["income"]["Row"]

// New type for yearly summary data
export type YearlySummary = {
  year: number
  income: number
  expenses: number
  savings: number
  savingsRate: number
}

// Asset service
export const assetService = {
  async getAssets(userId: string): Promise<Asset[]> {
    const supabase = createClient()
    const { data, error } = await supabase.from("assets").select("*").eq("user_id", userId).order("name")

    if (error) throw error
    return data || []
  },

  async addAsset(asset: Omit<Asset, "id" | "created_at" | "updated_at">): Promise<Asset> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from("assets")
      .insert([
        {
          ...asset,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ])
      .select()
      .single()

    if (error) throw error
    return data
  },

  async updateAsset(id: string, asset: Partial<Omit<Asset, "id" | "user_id" | "created_at">>): Promise<Asset> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from("assets")
      .update({
        ...asset,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async deleteAsset(id: string): Promise<void> {
    const supabase = createClient()
    const { error } = await supabase.from("assets").delete().eq("id", id)

    if (error) throw error
  },
}

// Liability service
export const liabilityService = {
  async getLiabilities(userId: string): Promise<Liability[]> {
    const supabase = createClient()
    const { data, error } = await supabase.from("liabilities").select("*").eq("user_id", userId).order("name")

    if (error) throw error
    return data || []
  },

  async addLiability(liability: Omit<Liability, "id" | "created_at" | "updated_at">): Promise<Liability> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from("liabilities")
      .insert([
        {
          ...liability,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ])
      .select()
      .single()

    if (error) throw error
    return data
  },

  async updateLiability(
    id: string,
    liability: Partial<Omit<Liability, "id" | "user_id" | "created_at">>,
  ): Promise<Liability> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from("liabilities")
      .update({
        ...liability,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async deleteLiability(id: string): Promise<void> {
    const supabase = createClient()
    const { error } = await supabase.from("liabilities").delete().eq("id", id)

    if (error) throw error
  },
}

// Budget category service
export const budgetService = {
  async getBudgetCategories(userId: string, month: string, year: number): Promise<BudgetCategory[]> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from("budget_categories")
      .select("*")
      .eq("user_id", userId)
      .eq("month", month)
      .eq("year", year)
      .order("category")

    if (error) throw error
    return data || []
  },

  async addBudgetCategory(category: Omit<BudgetCategory, "id" | "created_at" | "updated_at">): Promise<BudgetCategory> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from("budget_categories")
      .insert([
        {
          ...category,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ])
      .select()
      .single()

    if (error) throw error
    return data
  },

  async updateBudgetCategory(
    id: string,
    category: Partial<Omit<BudgetCategory, "id" | "user_id" | "created_at">>,
  ): Promise<BudgetCategory> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from("budget_categories")
      .update({
        ...category,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async deleteBudgetCategory(id: string): Promise<void> {
    const supabase = createClient()
    const { error } = await supabase.from("budget_categories").delete().eq("id", id)

    if (error) throw error
  },
}

// Expense service
export const expenseService = {
  async getExpenses(userId: string, startDate?: string, endDate?: string): Promise<Expense[]> {
    const supabase = createClient()
    let query = supabase.from("expenses").select("*").eq("user_id", userId)

    if (startDate) {
      query = query.gte("date", startDate)
    }

    if (endDate) {
      query = query.lte("date", endDate)
    }

    const { data, error } = await query.order("date", { ascending: false })

    if (error) throw error
    return data || []
  },

  async getAllMonthlyExpenses(userId: string): Promise<Expense[]> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from("expenses")
      .select("*")
      .eq("user_id", userId)
      .order("date", { ascending: true })

    if (error) {
      console.error("Error fetching all monthly expenses:", error)
      throw error
    }

    // Log some debug information about the data
    console.log(`Retrieved ${data?.length || 0} expenses for user ${userId}`)

    // Log the date range of the expenses
    if (data && data.length > 0) {
      const dates = data.map((e) => new Date(e.date))
      const minDate = new Date(Math.min(...dates.map((d) => d.getTime()))).toISOString().split("T")[0]
      const maxDate = new Date(Math.max(...dates.map((d) => d.getTime()))).toISOString().split("T")[0]
      console.log(`Expense date range: ${minDate} to ${maxDate}`)

      // Log expenses by year
      const expensesByYear: Record<number, number> = {}
      data.forEach((expense) => {
        const year = new Date(expense.date).getFullYear()
        if (!expensesByYear[year]) {
          expensesByYear[year] = 0
        }
        expensesByYear[year] += expense.amount
      })

      console.log("Expenses by year:")
      Object.entries(expensesByYear).forEach(([year, amount]) => {
        console.log(`Year ${year}: $${amount.toLocaleString()}`)
      })
    }

    return data || []
  },

  async getExpensesByCategory(
    userId: string,
    month: string,
    year: number,
  ): Promise<{ category: string; total: number }[]> {
    const supabase = createClient()
    // This is a simplified approach - in a real app, you might want to use a database function for this
    const startDate = new Date(year, getMonthNumber(month), 1).toISOString().split("T")[0]
    const endDate = new Date(year, getMonthNumber(month) + 1, 0).toISOString().split("T")[0]

    const { data, error } = await supabase
      .from("expenses")
      .select("category, amount")
      .eq("user_id", userId)
      .gte("date", startDate)
      .lte("date", endDate)

    if (error) throw error

    // Group by category and sum amounts
    const categoryTotals: Record<string, number> = {}
    data.forEach((expense) => {
      if (!categoryTotals[expense.category]) {
        categoryTotals[expense.category] = 0
      }
      categoryTotals[expense.category] += expense.amount
    })

    return Object.entries(categoryTotals).map(([category, total]) => ({ category, total }))
  },

  async getYearlyExpenses(userId: string, year: number): Promise<number> {
    const supabase = createClient()
    const startDate = new Date(year, 0, 1).toISOString().split("T")[0] // January 1st of the year
    const endDate = new Date(year, 11, 31).toISOString().split("T")[0] // December 31st of the year

    const { data, error } = await supabase
      .from("expenses")
      .select("amount")
      .eq("user_id", userId)
      .gte("date", startDate)
      .lte("date", endDate)

    if (error) throw error

    // Sum all expenses for the year
    const totalExpenses = data.reduce((sum, expense) => sum + expense.amount, 0)
    console.log(`Total expenses for ${year}: $${totalExpenses.toLocaleString()}`)

    return totalExpenses
  },

  async addExpense(expense: Omit<Expense, "id" | "created_at" | "updated_at">): Promise<Expense> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from("expenses")
      .insert([
        {
          ...expense,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ])
      .select()
      .single()

    if (error) throw error
    return data
  },

  async updateExpense(id: string, expense: Partial<Omit<Expense, "id" | "user_id" | "created_at">>): Promise<Expense> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from("expenses")
      .update({
        ...expense,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async deleteExpense(id: string): Promise<void> {
    const supabase = createClient()
    const { error } = await supabase.from("expenses").delete().eq("id", id)

    if (error) throw error
  },
}

// Income service
export const incomeService = {
  async getIncome(userId: string, month: string, year: number): Promise<Income[]> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from("income")
      .select("*")
      .eq("user_id", userId)
      .eq("month", month)
      .eq("year", year)
      .order("source")

    if (error) throw error
    return data || []
  },

  async getAllIncome(userId: string): Promise<Income[]> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from("income")
      .select("*")
      .eq("user_id", userId)
      .order("year", { ascending: true })
      .order("month", { ascending: true })

    if (error) throw error
    return data || []
  },

  async getYearlyIncome(userId: string, year: number): Promise<number> {
    const supabase = createClient()
    const { data, error } = await supabase.from("income").select("amount").eq("user_id", userId).eq("year", year)

    if (error) throw error

    // Sum all income for the year
    const totalIncome = data.reduce((sum, income) => sum + income.amount, 0)
    console.log(`Total income for ${year}: $${totalIncome.toLocaleString()}`)

    return totalIncome
  },

  async addIncome(income: Omit<Income, "id" | "created_at" | "updated_at">): Promise<Income> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from("income")
      .insert([
        {
          ...income,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ])
      .select()
      .single()

    if (error) throw error
    return data
  },

  async updateIncome(id: string, income: Partial<Omit<Income, "id" | "user_id" | "created_at">>): Promise<Income> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from("income")
      .update({
        ...income,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async deleteIncome(id: string): Promise<void> {
    const supabase = createClient()
    const { error } = await supabase.from("income").delete().eq("id", id)

    if (error) throw error
  },
}

// Financial summary service
// Define a type for income distribution data
export type IncomeDistribution = {
  needs: {
    total: number
    percentage: number
    categories: Array<{ category: string; amount: number }>
  }
  wants: {
    total: number
    percentage: number
    categories: Array<{ category: string; amount: number }>
  }
  saved: {
    total: number
    percentage: number
  }
  totalIncome: number
}

export const financialSummaryService = {
  async getYearlySummary(userId: string, year: number): Promise<YearlySummary> {
    // Get yearly income and expenses in parallel
    const [yearlyIncome, yearlyExpenses] = await Promise.all([
      incomeService.getYearlyIncome(userId, year),
      expenseService.getYearlyExpenses(userId, year),
    ])

    // Calculate savings and savings rate
    const savings = yearlyIncome - yearlyExpenses
    const savingsRate = yearlyIncome > 0 ? (savings / yearlyIncome) * 100 : 0

    return {
      year,
      income: yearlyIncome,
      expenses: yearlyExpenses,
      savings,
      savingsRate,
    }
  },

  async getMultiYearSummary(userId: string, startYear: number, endYear: number): Promise<YearlySummary[]> {
    const years = Array.from({ length: endYear - startYear + 1 }, (_, i) => startYear + i)

    // Get yearly summaries for all years in parallel
    const summaries = await Promise.all(years.map((year) => this.getYearlySummary(userId, year)))

    return summaries
  },

  async getIncomeDistribution(userId: string): Promise<IncomeDistribution> {
    try {
      // Get all income and expenses across all years
      const allIncome = await incomeService.getAllIncome(userId)
      const allExpenses = await expenseService.getAllMonthlyExpenses(userId)

      // Calculate total income
      const totalIncome = allIncome.reduce((sum, income) => sum + income.amount, 0)

      // Calculate total expenses
      const totalExpenses = allExpenses.reduce((sum, expense) => sum + expense.amount, 0)

      // Calculate total saved (income - expenses)
      const savedTotal = Math.max(0, totalIncome - totalExpenses)

      // Classify expenses as needs or wants
      const needsExpenses = allExpenses.filter((expense) => this.classifyExpenseType(expense.category) === "need")

      const wantsExpenses = allExpenses.filter((expense) => this.classifyExpenseType(expense.category) === "want")

      // Calculate totals for needs and wants
      const needsTotal = needsExpenses.reduce((sum, expense) => sum + expense.amount, 0)
      const wantsTotal = wantsExpenses.reduce((sum, expense) => sum + expense.amount, 0)

      // Calculate percentages based on total income
      const needsPercentage = totalIncome > 0 ? (needsTotal / totalIncome) * 100 : 0
      const wantsPercentage = totalIncome > 0 ? (wantsTotal / totalIncome) * 100 : 0
      const savedPercentage = totalIncome > 0 ? (savedTotal / totalIncome) * 100 : 0

      // Log values for debugging
      console.log("Income Distribution Calculation:")
      console.log(`Total Income: $${totalIncome.toLocaleString()}`)
      console.log(`Total Expenses: $${totalExpenses.toLocaleString()}`)
      console.log(`Needs: $${needsTotal.toLocaleString()} (${needsPercentage.toFixed(1)}%)`)
      console.log(`Wants: $${wantsTotal.toLocaleString()} (${wantsPercentage.toFixed(1)}%)`)
      console.log(`Saved: $${savedTotal.toLocaleString()} (${savedPercentage.toFixed(1)}%)`)

      // Group expenses by category for detailed breakdown
      const needsCategories = this.groupExpensesByCategory(needsExpenses)
      const wantsCategories = this.groupExpensesByCategory(wantsExpenses)

      return {
        needs: {
          total: needsTotal,
          percentage: needsPercentage,
          categories: needsCategories,
        },
        wants: {
          total: wantsTotal,
          percentage: wantsPercentage,
          categories: wantsCategories,
        },
        saved: {
          total: savedTotal,
          percentage: savedPercentage,
        },
        totalIncome,
      }
    } catch (error) {
      console.error("Error calculating income distribution:", error)
      // Return default values in case of error
      return {
        needs: { total: 0, percentage: 0, categories: [] },
        wants: { total: 0, percentage: 0, categories: [] },
        saved: { total: 0, percentage: 0 },
        totalIncome: 0,
      }
    }
  },

  // Helper method to classify expense type
  classifyExpenseType(category: string): "need" | "want" {
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
        "medical",
        "education",
        "tax",
      ].some((k) => lower.includes(k))
    ) {
      return "need"
    }
    return "want"
  },

  // Helper method to group expenses by category
  groupExpensesByCategory(expenses: Expense[]): Array<{ category: string; amount: number }> {
    const categoryMap: Record<string, number> = {}

    expenses.forEach((expense) => {
      if (!categoryMap[expense.category]) {
        categoryMap[expense.category] = 0
      }
      categoryMap[expense.category] += expense.amount
    })

    return Object.entries(categoryMap)
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount)
  },
}

// Helper function to convert month name to number (0-based)
function getMonthNumber(month: string): number {
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


"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/utils/supabase/server"
import type { DetailedExpense } from "@/components/editable-expense-grid"

// Helper function to extract month and year from a date string (MM/DD format)
function extractMonthYear(dateStr: string, year: number) {
  const parts = dateStr.split("/")
  if (parts.length >= 2) {
    const month = Number.parseInt(parts[0])
    return {
      month: new Date(year, month - 1).toLocaleString("default", { month: "long" }),
      year,
    }
  }
  return { month: "", year }
}

export async function saveDetailedExpenses(expenses: DetailedExpense[], userId: string) {
  try {
    const supabase = await createClient()

    // Format the expenses for database storage
    // We'll store the additional fields in the description as JSON
    const formattedExpenses = expenses.map((expense: DetailedExpense) => {
      // Extract additional fields that aren't in the database schema
      const { vendor, paymentMethod, cardUsed, cashBackRate, cashBackEarned } = expense

      // Create a formatted description that includes the original description and the additional fields
      const detailedDescription = JSON.stringify({
        description: expense.description,
        vendor,
        paymentMethod,
        cardUsed,
        cashBackRate,
        cashBackEarned,
      })

      return {
        id: expense.id,
        user_id: userId,
        category: expense.category,
        amount: expense.amount,
        description: detailedDescription, // Store additional fields in description as JSON
        date: expense.date,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
    })

    // Insert or update the expenses
    const { error } = await supabase.from("expenses").upsert(formattedExpenses, { onConflict: "id" })

    if (error) {
      throw new Error(`Error saving expenses: ${error.message}`)
    }

    // Revalidate the monthly breakdown page
    revalidatePath("/dashboard/monthly")

    return { success: true }
  } catch (error) {
    console.error("Error saving expenses:", error)
    return { success: false, error: (error as Error).message }
  }
}

export async function fetchDetailedExpenses(userId: string, month: string, year: number) {
  try {
    const supabase = await createClient()

    // Get all expenses for the month
    const { data, error } = await supabase
      .from("expenses")
      .select("*")
      .eq("user_id", userId)
      .order("date", { ascending: true })

    if (error) {
      throw new Error(`Error fetching expenses: ${error.message}`)
    }

    // Filter expenses for the specific month and year
    const monthlyExpenses = data.filter((expense: any) => {
      const { month: expenseMonth, year: expenseYear } = extractMonthYear(expense.date, year)
      return expenseMonth.toLowerCase() === month.toLowerCase() && expenseYear === year
    })

    // Transform the data to include the additional fields
    return monthlyExpenses.map((expense: any) => {
      let additionalFields = {
        vendor: "",
        paymentMethod: "Credit Card",
        cardUsed: "",
        cashBackRate: 0,
        cashBackEarned: 0,
        description: expense.description,
      }

      // Try to parse the description as JSON to extract additional fields
      try {
        const parsedDescription = JSON.parse(expense.description)
        if (typeof parsedDescription === "object" && parsedDescription !== null) {
          additionalFields = {
            ...additionalFields,
            ...parsedDescription,
          }
        }
      } catch (e) {
        // If parsing fails, use the description as is
      }

      return {
        id: expense.id,
        description: additionalFields.description,
        category: expense.category,
        amount: expense.amount,
        date: expense.date,
        vendor: additionalFields.vendor,
        paymentMethod: additionalFields.paymentMethod,
        cardUsed: additionalFields.cardUsed,
        cashBackRate: additionalFields.cashBackRate,
        cashBackEarned: additionalFields.cashBackEarned,
      }
    })
  } catch (error) {
    console.error("Error fetching detailed expenses:", error)
    return []
  }
}

export async function fetchCategories(userId: string) {
  try {
    const supabase = await createClient()

    // Get all unique categories from expenses
    const { data, error } = await supabase
      .from("expenses")
      .select("category")
      .eq("user_id", userId)
      .order("category", { ascending: true })

    if (error) {
      throw new Error(`Error fetching categories: ${error.message}`)
    }

    // Extract unique categories
    const categories = [...new Set(data.map((item: any) => item.category))]

    return categories.filter(Boolean) // Remove empty categories
  } catch (error) {
    console.error("Error fetching categories:", error)
    return ["Food", "Transportation", "Housing", "Entertainment", "Utilities", "Cat", "Misc"]
  }
}


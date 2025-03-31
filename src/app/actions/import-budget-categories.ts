"use server"

import { createServerActionClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import type { Database } from "@/types/supabase"

interface ImportResult {
  success: boolean
  message?: string
  error?: string
  count?: number
}

interface ImportParams {
  text: string
  month: string
  year: number
}

export async function importBudgetCategories({ text, month, year }: ImportParams): Promise<ImportResult> {
  try {
    // Initialize Supabase client
    const supabase = createServerActionClient<Database>({ cookies })

    // Get the current user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: "User not authenticated" }
    }

    // Parse the text to extract budget categories
    const categories = parseBudgetCategories(text)

    if (categories.length === 0) {
      return { success: false, error: "No valid budget categories found in the text" }
    }

    console.log(`Parsed ${categories.length} budget categories`)

    // Prepare the budget categories for insertion
    const budgetCategories = categories.map((category) => ({
      user_id: user.id,
      category: category.name,
      budgeted: category.amount,
      month,
      year,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }))

    // Delete existing budget categories for this month/year
    const { error: deleteError } = await supabase
      .from("budget_categories")
      .delete()
      .eq("user_id", user.id)
      .eq("month", month)
      .eq("year", year)

    if (deleteError) {
      console.error("Error deleting existing budget categories:", deleteError)
      return { success: false, error: `Error clearing existing budget categories: ${deleteError.message}` }
    }

    // Insert the budget categories
    const { error } = await supabase.from("budget_categories").insert(budgetCategories)

    if (error) {
      console.error("Error inserting budget categories:", error)
      return { success: false, error: error.message }
    }

    return {
      success: true,
      message: `Successfully imported ${budgetCategories.length} budget categories`,
      count: budgetCategories.length,
    }
  } catch (error) {
    console.error("Error importing budget categories:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unknown error occurred",
    }
  }
}

// Helper function to parse budget categories from text
function parseBudgetCategories(text: string): Array<{ name: string; amount: number }> {
  const result: Array<{ name: string; amount: number }> = []

  // Try different parsing strategies

  // First, split by newlines to handle multi-line input
  const lines = text.split(/\r?\n/).filter((line) => line.trim() !== "")

  for (const line of lines) {
    // Try to extract category and amount using various patterns

    // Pattern 1: "Category $Amount" or "Category Amount"
    const dollarPattern = /(.+?)\s*\$\s*([\d,]+\.?\d*)/
    const simplePattern = /(.+?)\s+([\d,]+\.?\d*)/

    let match = line.match(dollarPattern) || line.match(simplePattern)

    if (match) {
      const categoryName = match[1].trim()
      // Remove commas and convert to number
      const amount = Number.parseFloat(match[2].replace(/,/g, ""))

      if (categoryName && !isNaN(amount)) {
        result.push({ name: categoryName, amount })
        continue
      }
    }

    // Pattern 2: Try to find any number in the line and use the rest as category
    const numberPattern = /([\d,]+\.?\d*)/
    match = line.match(numberPattern)

    if (match) {
      const amount = Number.parseFloat(match[1].replace(/,/g, ""))
      // Get the category by removing the amount and any currency symbols
      let categoryName = line.replace(/\$?\s*([\d,]+\.?\d*)/, "").trim()

      // Clean up the category name
      categoryName = categoryName.replace(/^\W+|\W+$/g, "").trim()

      if (categoryName && !isNaN(amount)) {
        result.push({ name: categoryName, amount })
      }
    }
  }

  return result
}


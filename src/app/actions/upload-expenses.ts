"use server"

import { createServerActionClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { parseExpenseCSV } from "@/utils/csv-parser"
import type { Database } from "@/types/supabase"

interface UploadResult {
  success: boolean
  message?: string
  error?: string
  count?: number
  invalidCount?: number
  invalidRecords?: Array<{
    row: number
    data: any
    issues: string[]
  }>
  debugInfo?: any
}

export async function uploadExpenses(formData: FormData): Promise<UploadResult> {
  try {
    // Get the file from the form data
    const file = formData.get("csvFile") as File
    if (!file) {
      return { success: false, error: "No file provided" }
    }

    // Get the month and year from the form data
    const month = formData.get("month") as string
    const yearStr = formData.get("year") as string
    const year = Number.parseInt(yearStr, 10)

    if (isNaN(year)) {
      return { success: false, error: "Invalid year provided" }
    }

    // Read the file content
    const fileContent = await file.text()
    console.log("File content sample:", fileContent.substring(0, 200) + "...")

    // Parse the CSV
    let expenses
    try {
      expenses = parseExpenseCSV(fileContent)
      console.log(`Parsed ${expenses.length} expenses from CSV`)

      // Debug: Log all date values from the CSV
      console.log("Date values from CSV:")
      expenses.slice(0, 10).forEach((e, i) => {
        console.log(`Expense ${i + 1} date: "${e.date}"`)
      })
    } catch (error) {
      console.error("CSV parsing error:", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Error parsing CSV file. Please check the format.",
      }
    }

    if (expenses.length === 0) {
      return { success: false, error: "No valid expense data found in the CSV file." }
    }

    // Initialize Supabase client
    const supabase = createServerActionClient<Database>({ cookies })

    // Get the current user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: "User not authenticated" }
    }

    // Get the month number (0-based)
    const monthNumber = getMonthNumber(month)

    // Create a date object for the first day of the month
    const monthDate = new Date(year, monthNumber, 1)
    console.log(`Month date: ${monthDate.toISOString()}`)

    // Prepare the expenses for insertion with DIRECT date handling
    const validationResults = expenses.map((expense, index) => {
      // Validate expense data
      const validationIssues = []

      if (!expense.category) {
        validationIssues.push("Missing category")
      }

      if (!expense.amount || expense.amount <= 0) {
        validationIssues.push(`Missing or invalid amount: ${expense.amount}`)
      }

      if (!expense.date) {
        validationIssues.push("Missing date")
      }

      // If there are validation issues, log them and return null
      if (validationIssues.length > 0) {
        console.warn(`Row ${index + 1} validation issues:`, validationIssues, "Row data:", expense)
        return {
          expense,
          valid: false,
          issues: validationIssues,
          row: index + 1,
        }
      }

      // DIRECT DATE HANDLING - Parse the date string to get the day
      let day = 1 // Default to first day of month

      try {
        // Try to extract just the day number from various formats
        const dateStr = expense.date.trim()

        // Case 1: Just a number (e.g., "28")
        if (/^\d{1,2}$/.test(dateStr)) {
          day = Number.parseInt(dateStr, 10)
        }
        // Case 2: MM/DD or M/D format
        else if (/^\d{1,2}\/\d{1,2}$/.test(dateStr)) {
          day = Number.parseInt(dateStr.split("/")[1], 10)
        }
        // Case 3: MM/DD/YYYY format
        else if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateStr)) {
          day = Number.parseInt(dateStr.split("/")[1], 10)
        }
        // Case 4: Month name format (e.g., "Feb 28")
        else if (/^[A-Za-z]{3,9}\s+\d{1,2}$/.test(dateStr)) {
          day = Number.parseInt(dateStr.split(/\s+/)[1], 10)
        }
        // Default case - try to extract any number
        else {
          const matches = dateStr.match(/\d+/)
          if (matches && matches.length > 0) {
            day = Number.parseInt(matches[0], 10)
          }
        }

        // Validate day is within reasonable range
        if (day < 1 || day > 31) {
          console.warn(`Invalid day ${day} from date "${dateStr}", defaulting to 1`)
          day = 1
        }
      } catch (error) {
        console.error(`Error parsing date "${expense.date}":`, error)
        day = 1 // Default to first day if parsing fails
      }

      // Create a new date object for this specific day in the month
      const expenseDate = new Date(year, monthNumber, day)
      const formattedDate = expenseDate.toISOString().split("T")[0]

      console.log(`Row ${index + 1}: "${expense.date}" -> day ${day} -> "${formattedDate}"`)

      // Create the expense object for insertion
      return {
        expense: {
          user_id: user.id,
          category: expense.category,
          amount: expense.amount,
          description: expense.vendor
            ? `${expense.vendor}${expense.description ? ` - ${expense.description}` : ""}`
            : expense.description || "Unnamed expense",
          date: formattedDate,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        valid: true,
        issues: [],
        row: index + 1,
      }
    })

    // Filter out invalid expenses
    const validExpenses = validationResults.filter((result) => result.valid).map((result) => result.expense)
    const invalidExpenses = validationResults.filter((result) => !result.valid)

    console.log(`Validation results: ${validExpenses.length} valid, ${invalidExpenses.length} invalid`)

    // Log the first few invalid expenses for debugging
    if (invalidExpenses.length > 0) {
      console.log("Sample of invalid expenses:")
      invalidExpenses.slice(0, 3).forEach((result, i) => {
        console.log(`Invalid expense ${i + 1}:`, result.expense, "Issues:", result.issues)
      })
    }

    if (validExpenses.length === 0) {
      return {
        success: false,
        error: "No valid expenses to insert after validation.",
        debugInfo: {
          totalParsed: expenses.length,
          invalidCount: invalidExpenses.length,
          sampleInvalid: invalidExpenses.slice(0, 3).map((r) => ({
            expense: r.expense,
            issues: r.issues,
          })),
        },
      }
    }

    // Debug: Log all expenses to be inserted
    console.log("All expenses to be inserted:")
    validExpenses.forEach((expense, i) => {
      console.log(`Expense ${i + 1}:`, {
        category: expense.category,
        amount: expense.amount,
        description: expense.description,
        date: expense.date,
      })
    })

    // CRITICAL FIX: Delete existing expenses for this month before inserting new ones
    // This prevents duplicate entries and ensures we're working with fresh data
    const monthStart = new Date(year, monthNumber, 1).toISOString().split("T")[0]
    const monthEnd = new Date(year, monthNumber + 1, 0).toISOString().split("T")[0]

    console.log(`Deleting existing expenses from ${monthStart} to ${monthEnd}`)

    const { error: deleteError } = await supabase
      .from("expenses")
      .delete()
      .eq("user_id", user.id)
      .gte("date", monthStart)
      .lte("date", monthEnd)

    if (deleteError) {
      console.error("Error deleting existing expenses:", deleteError)
      return { success: false, error: `Error clearing existing expenses: ${deleteError.message}` }
    }

    // Insert the expenses into Supabase
    const { data, error } = await supabase.from("expenses").insert(validExpenses)

    if (error) {
      console.error("Error inserting expenses:", error)
      return { success: false, error: error.message }
    }

    // Prepare invalid records for the response
    const invalidRecords = invalidExpenses.map((record) => {
      // Check if the expense is an ExpenseCSVRow (has vendor property)
      const isCSVRow = "vendor" in record.expense

      return {
        row: record.row,
        issues: record.issues,
        data: {
          category: record.expense.category,
          amount: record.expense.amount,
          date: record.expense.date,
          description: isCSVRow
            ? record.expense.description || (record.expense as any).vendor || "Unnamed expense"
            : record.expense.description || "Unnamed expense",
        },
      }
    })

    return {
      success: true,
      message: `Successfully imported ${validExpenses.length} expenses${
        invalidExpenses.length > 0 ? ` (${invalidExpenses.length} were invalid and skipped)` : ""
      }`,
      count: validExpenses.length,
      invalidCount: invalidExpenses.length,
      invalidRecords: invalidRecords.slice(0, 10), // Limit to first 10 for performance
    }
  } catch (error) {
    console.error("Error processing CSV:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unknown error occurred",
    }
  }
}

// Helper function to convert month name to number (0-based)
function getMonthNumber(monthName: string): number {
  const months: Record<string, number> = {
    january: 0,
    february: 1,
    march: 2,
    april: 3,
    may: 4,
    june: 5,
    july: 6,
    august: 7,
    september: 8,
    october: 9,
    november: 10,
    december: 11,
  }

  return months[monthName.toLowerCase()] ?? 0
}


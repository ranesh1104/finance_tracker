"use server"

import { createServerActionClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import type { Database } from "@/types/supabase"

interface IncomeCSVRow {
  incomeType: string
  incomeAmount: number
}

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

export async function uploadIncome(formData: FormData): Promise<UploadResult> {
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
    let incomeData: IncomeCSVRow[] = []
    try {
      incomeData = parseIncomeCSV(fileContent)
      console.log(`Parsed ${incomeData.length} income entries from CSV`)
    } catch (error) {
      console.error("CSV parsing error:", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Error parsing CSV file. Please check the format.",
      }
    }

    if (incomeData.length === 0) {
      return { success: false, error: "No valid income data found in the CSV file." }
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

    // Validate income data
    const validationResults = incomeData.map((income, index) => {
      const validationIssues = []

      if (!income.incomeType) {
        validationIssues.push("Missing income type")
      }

      if (!income.incomeAmount || income.incomeAmount <= 0) {
        validationIssues.push(`Missing or invalid amount: ${income.incomeAmount}`)
      }

      // If there are validation issues, log them and return null
      if (validationIssues.length > 0) {
        console.warn(`Row ${index + 1} validation issues:`, validationIssues, "Row data:", income)
        return {
          income,
          valid: false,
          issues: validationIssues,
          row: index + 1,
        }
      }

      // Create the income object for insertion
      return {
        income: {
          user_id: user.id,
          source: income.incomeType,
          amount: income.incomeAmount,
          month: month,
          year: year,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        valid: true,
        issues: [],
        row: index + 1,
      }
    })

    // Filter out invalid income entries
    const validIncome = validationResults.filter((result) => result.valid).map((result) => result.income)
    const invalidIncome = validationResults.filter((result) => !result.valid)

    console.log(`Validation results: ${validIncome.length} valid, ${invalidIncome.length} invalid`)

    if (validIncome.length === 0) {
      return {
        success: false,
        error: "No valid income entries to insert after validation.",
        debugInfo: {
          totalParsed: incomeData.length,
          invalidCount: invalidIncome.length,
          sampleInvalid: invalidIncome.slice(0, 3).map((r) => ({
            income: r.income,
            issues: r.issues,
          })),
        },
      }
    }

    // Delete existing income for this month before inserting new ones
    console.log(`Deleting existing income for ${month} ${year}`)

    const { error: deleteError } = await supabase
      .from("income")
      .delete()
      .eq("user_id", user.id)
      .eq("month", month)
      .eq("year", year)

    if (deleteError) {
      console.error("Error deleting existing income:", deleteError)
      return { success: false, error: `Error clearing existing income: ${deleteError.message}` }
    }

    // Insert the income into Supabase
    const { data, error } = await supabase.from("income").insert(validIncome)

    if (error) {
      console.error("Error inserting income:", error)
      return { success: false, error: error.message }
    }

    // Prepare invalid records for the response
    const invalidRecords = invalidIncome.map((record) => {
      // Use type assertion with a type guard function
      const isCSVRow = (obj: any): obj is IncomeCSVRow => {
        return obj && typeof obj === 'object' && 'incomeType' in obj;
      };
      
      const incomeData = record.income;
      
      return {
        row: record.row,
        issues: record.issues,
        data: {
          incomeType: isCSVRow(incomeData) ? incomeData.incomeType : (incomeData as any).source,
          incomeAmount: isCSVRow(incomeData) ? incomeData.incomeAmount : (incomeData as any).amount,
        },
      };
    });

    return {
      success: true,
      message: `Successfully imported ${validIncome.length} income entries${
        invalidIncome.length > 0 ? ` (${invalidIncome.length} were invalid and skipped)` : ""
      }`,
      count: validIncome.length,
      invalidCount: invalidIncome.length,
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

// Helper function to parse income CSV
function parseIncomeCSV(csvText: string): IncomeCSVRow[] {
  console.log("Starting Income CSV parsing...")

  // Split the CSV into lines and filter out empty lines
  const lines = csvText.split(/\r?\n/).filter((line) => line.trim() !== "")
  console.log(`Found ${lines.length} non-empty lines in CSV`)

  // Try to detect the delimiter (tab, comma, or pipe)
  const firstLine = lines[0] || ""
  let delimiter = "\t" // Default to tab

  if (firstLine.includes(",") && !firstLine.includes("\t")) {
    delimiter = ","
  } else if (firstLine.includes("|") && !firstLine.includes("\t")) {
    delimiter = "|"
  }

  console.log(`Detected delimiter: "${delimiter === "\t" ? "tab" : delimiter}"`)

  // Find the header row
  let headerLine = ""
  let headerIndex = -1

  // Look for a line with common income column names
  for (let i = 0; i < Math.min(10, lines.length); i++) {
    const line = lines[i].toLowerCase()
    if ((line.includes("income") || line.includes("source")) && (line.includes("amount") || line.includes("value"))) {
      headerLine = lines[i]
      headerIndex = i
      console.log(`Found header at line ${i + 1}: ${headerLine}`)
      break
    }
  }

  // If no header found, assume the first line is the header
  if (headerIndex === -1) {
    headerLine = lines[0]
    headerIndex = 0
    console.log(`Assuming first line is header: ${headerLine}`)
  }

  // Split the header by the detected delimiter
  const headers = headerLine.split(delimiter).map((h) => h.trim())
  console.log("Parsed headers:", headers)

  // Get indices for each column
  const incomeTypeIndex = findColumnIndex(headers, ["income type", "source", "income source", "type"])
  const incomeAmountIndex = findColumnIndex(headers, ["income amount", "amount", "value", "income"])

  console.log("Column indices:", {
    incomeType: incomeTypeIndex,
    incomeAmount: incomeAmountIndex,
  })

  // Validate required columns
  if (incomeTypeIndex === -1) {
    throw new Error("Required column missing: Income Type. Please ensure your CSV has an Income Type or Source column.")
  }

  if (incomeAmountIndex === -1) {
    throw new Error(
      "Required column missing: Income Amount. Please ensure your CSV has an Income Amount or Amount column.",
    )
  }

  // Skip the header row and empty lines
  const dataLines = lines.filter((line, index) => index > headerIndex && line.trim() !== "")
  console.log(`Found ${dataLines.length} data lines after header`)

  // Parse each line
  const parsedRows = dataLines.map((line, index) => {
    try {
      // Split the line by the detected delimiter
      let columns: string[]

      if (delimiter === ",") {
        // For comma delimiter, we need special handling to avoid splitting numbers with commas
        columns = splitCSVLine(line)
      } else {
        columns = line.split(delimiter)
      }

      columns = columns.map((col) => col.trim())

      // Extract income type
      const incomeType = incomeTypeIndex >= 0 && incomeTypeIndex < columns.length ? columns[incomeTypeIndex] : ""

      // Extract income amount
      let incomeAmount = 0
      if (incomeAmountIndex >= 0 && incomeAmountIndex < columns.length) {
        const rawAmount = columns[incomeAmountIndex]
        incomeAmount = parseAmountString(rawAmount)
      }

      return {
        incomeType,
        incomeAmount,
      }
    } catch (error) {
      console.error(`Error parsing row ${index + 1}:`, error, "Row content:", line)
      return {
        incomeType: `Error parsing row ${index + 1}`,
        incomeAmount: 0,
      }
    }
  })

  console.log(`Successfully parsed ${parsedRows.length} rows`)
  return parsedRows
}

// Helper function to parse amount strings with proper comma handling
function parseAmountString(amountStr: string): number {
  if (!amountStr) return 0

  // Remove currency symbols and spaces
  let cleanedStr = amountStr.replace(/[$€£¥\s]/g, "")

  // Check if the string contains a comma
  if (cleanedStr.includes(",")) {
    // Replace all commas with nothing
    cleanedStr = cleanedStr.replace(/,/g, "")
  }

  // Parse as float
  const amount = Number.parseFloat(cleanedStr)
  return isNaN(amount) ? 0 : amount
}

// Helper function to split a CSV line properly (handling commas in quoted fields)
function splitCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ""
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]

    if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === "," && !inQuotes) {
      result.push(current)
      current = ""
    } else {
      current += char
    }
  }

  // Add the last field
  result.push(current)

  return result
}

// Helper function to find a column index by trying different possible names
function findColumnIndex(headers: string[], possibleNames: string[]): number {
  const lowerCaseHeaders = headers.map((h) => h.toLowerCase())

  for (const name of possibleNames) {
    const exactIndex = lowerCaseHeaders.indexOf(name)
    if (exactIndex !== -1) return exactIndex

    // Try partial matches
    for (let i = 0; i < lowerCaseHeaders.length; i++) {
      if (lowerCaseHeaders[i].includes(name)) {
        return i
      }
    }
  }

  return -1
}
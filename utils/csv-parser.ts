export interface ExpenseCSVRow {
    description: string
    vendor: string
    category: string
    amount: number
    date: string
    paymentMethod: string
    cardUsed: string
    cashBackRate: number
    cashBackEarned: number
  }
  
  export function parseExpenseCSV(csvText: string): ExpenseCSVRow[] {
    console.log("Starting CSV parsing...")
  
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
  
    // Find the header row - try different approaches
    let headerLine = ""
    let headerIndex = -1
  
    // First, look for a line with common expense column names
    for (let i = 0; i < Math.min(10, lines.length); i++) {
      const line = lines[i].toLowerCase()
      if (
        (line.includes("expense") || line.includes("category")) &&
        (line.includes("amount") || line.includes("paid")) &&
        line.includes("date")
      ) {
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
  
    // Get indices for each column - try different variations of column names
    const descriptionIndex = findColumnIndex(headers, ["current expenses", "expense", "description", "item"])
    const vendorIndex = findColumnIndex(headers, ["vendor", "merchant", "payee", "store"])
    const categoryIndex = findColumnIndex(headers, ["category", "type", "expense type"])
    const amountIndex = findColumnIndex(headers, ["amount paid", "amount", "cost", "price", "paid"])
    const dateIndex = findColumnIndex(headers, ["date", "transaction date", "purchase date"])
    const paymentMethodIndex = findColumnIndex(headers, ["payment method", "method", "payment"])
    const cardUsedIndex = findColumnIndex(headers, ["card used", "card", "credit card"])
    const cashBackRateIndex = findColumnIndex(headers, ["cash back rate", "cashback rate", "reward rate"])
    const cashBackEarnedIndex = findColumnIndex(headers, ["cash back earned", "cashback earned", "rewards"])
  
    console.log("Column indices:", {
      description: descriptionIndex,
      vendor: vendorIndex,
      category: categoryIndex,
      amount: amountIndex,
      date: dateIndex,
      paymentMethod: paymentMethodIndex,
      cardUsed: cardUsedIndex,
      cashBackRate: cashBackRateIndex,
      cashBackEarned: cashBackEarnedIndex,
    })
  
    // Validate required columns
    if (categoryIndex === -1 && descriptionIndex === -1) {
      throw new Error(
        "Required column missing: Category or Description. Please ensure your CSV has at least one of these columns.",
      )
    }
  
    if (amountIndex === -1) {
      throw new Error("Required column missing: Amount. Please ensure your CSV has an Amount or Amount Paid column.")
    }
  
    if (dateIndex === -1) {
      throw new Error("Required column missing: Date. Please ensure your CSV has a Date column.")
    }
  
    // Skip the header row and empty lines
    const dataLines = lines.filter((line, index) => index > headerIndex && line.trim() !== "")
    console.log(`Found ${dataLines.length} data lines after header`)
  
    // Parse each line
    const parsedRows = dataLines.map((line, index) => {
      try {
        // For debugging, log the entire line if it contains "rent" (case insensitive)
        if (line.toLowerCase().includes("rent")) {
          console.log(`FOUND RENT LINE: "${line}"`)
        }
  
        // Split the line by the detected delimiter
        // IMPORTANT: For tab or pipe delimiters, split normally
        let columns: string[]
  
        if (delimiter === ",") {
          // For comma delimiter, we need special handling to avoid splitting numbers with commas
          // This is a simplified approach - for a real CSV parser, you'd need a more robust solution
          columns = splitCSVLine(line)
        } else {
          columns = line.split(delimiter)
        }
  
        columns = columns.map((col) => col.trim())
  
        // Safely extract the amount, handling undefined values and commas
        let amount = 0
        if (amountIndex >= 0 && amountIndex < columns.length) {
          const rawAmount = columns[amountIndex]
          console.log(`Row ${index + 1} raw amount: "${rawAmount}"`)
  
          // DIRECT FIX: Parse amount with a specific function that handles commas correctly
          amount = parseAmountString(rawAmount)
          console.log(`Row ${index + 1} parsed amount: ${amount}`)
        }
  
        // If amount is 0 or NaN, try to find it in another column
        if (amount === 0 || isNaN(amount)) {
          for (let i = 0; i < columns.length; i++) {
            if (i !== amountIndex && columns[i]) {
              const parsedAmount = parseAmountString(columns[i])
              if (!isNaN(parsedAmount) && parsedAmount > 0) {
                amount = parsedAmount
                console.log(`Row ${index + 1}: Found amount in column ${i}: ${amount}`)
                break
              }
            }
          }
        }
  
        // Safely extract the cash back rate, handling undefined values
        let cashBackRate = 0
        if (cashBackRateIndex !== -1 && cashBackRateIndex < columns.length && columns[cashBackRateIndex]) {
          const cashBackRateStr = columns[cashBackRateIndex].replace(/%/g, "")
          cashBackRate = (Number.parseFloat(cashBackRateStr) || 0) / 100 // Convert to decimal
        }
  
        // Safely extract the cash back earned, handling undefined values
        let cashBackEarned = 0
        if (cashBackEarnedIndex !== -1 && cashBackEarnedIndex < columns.length && columns[cashBackEarnedIndex]) {
          cashBackEarned = parseAmountString(columns[cashBackEarnedIndex])
        }
  
        // Determine category - use the category column if available, otherwise try to infer from description
        let category = "Uncategorized"
        if (categoryIndex !== -1 && categoryIndex < columns.length && columns[categoryIndex]) {
          category = columns[categoryIndex]
        } else if (descriptionIndex !== -1 && descriptionIndex < columns.length) {
          // Try to infer category from description
          const description = columns[descriptionIndex].toLowerCase()
          if (description.includes("grocery") || description.includes("food")) {
            category = "Groceries"
          } else if (description.includes("gas") || description.includes("fuel")) {
            category = "Transportation"
          } else if (description.includes("rent") || description.includes("mortgage")) {
            category = "Housing"
          }
        }
  
        // Safely get other column values
        const description = descriptionIndex !== -1 && descriptionIndex < columns.length ? columns[descriptionIndex] : ""
        const vendor = vendorIndex !== -1 && vendorIndex < columns.length ? columns[vendorIndex] : ""
        const date = dateIndex !== -1 && dateIndex < columns.length ? columns[dateIndex] : ""
        const paymentMethod =
          paymentMethodIndex !== -1 && paymentMethodIndex < columns.length ? columns[paymentMethodIndex] : ""
        const cardUsed = cardUsedIndex !== -1 && cardUsedIndex < columns.length ? columns[cardUsedIndex] : ""
  
        // Special logging for high-value items or specific categories
        if (category.toLowerCase() === "rent" || category.toLowerCase().includes("rent")) {
          console.log(`RENT EXPENSE: Category=${category}, Amount=${amount}, Original=${columns[amountIndex]}`)
        }
  
        // Debug log for date values
        console.log(`Row ${index + 1} date value: "${date}"`)
  
        return {
          description,
          vendor,
          category,
          amount,
          date,
          paymentMethod,
          cardUsed,
          cashBackRate,
          cashBackEarned,
        }
      } catch (error) {
        console.error(`Error parsing row ${index + 1}:`, error, "Row content:", line)
        // Return a default object to avoid breaking the map function
        return {
          description: `Error parsing row ${index + 1}`,
          vendor: "",
          category: "Error",
          amount: 0,
          date: "",
          paymentMethod: "",
          cardUsed: "",
          cashBackRate: 0,
          cashBackEarned: 0,
        }
      }
    })
  
    console.log(`Successfully parsed ${parsedRows.length} rows`)
    return parsedRows
  }
  
  // Helper function to parse amount strings with proper comma handling
  function parseAmountString(amountStr: string): number {
    if (!amountStr) return 0
  
    // Log the original string
    console.log(`Parsing amount string: "${amountStr}"`)
  
    // Remove currency symbols and spaces
    let cleanedStr = amountStr.replace(/[$€£¥\s]/g, "")
    console.log(`After removing currency and spaces: "${cleanedStr}"`)
  
    // Check if the string contains a comma
    if (cleanedStr.includes(",")) {
      console.log(`String contains commas: "${cleanedStr}"`)
  
      // Replace all commas with nothing
      cleanedStr = cleanedStr.replace(/,/g, "")
      console.log(`After removing commas: "${cleanedStr}"`)
    }
  
    // Parse as float
    const amount = Number.parseFloat(cleanedStr)
    console.log(`Final parsed amount: ${amount}`)
  
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
  
  // Helper function to convert date from various formats to YYYY-MM-DD
  export function formatDate(dateStr: string, year: number): string {
    try {
      // Handle empty or invalid date strings
      if (!dateStr || dateStr.trim() === "") {
        console.warn("Empty date string, using current date")
        return new Date().toISOString().split("T")[0] // Default to today
      }
  
      console.log(`Formatting date: "${dateStr}" with year ${year}`)
  
      // CRITICAL FIX: Directly use the original date string if it's just a day number
      // This is to handle cases where the date is just "28" for the 28th day of the month
      if (/^\d{1,2}$/.test(dateStr)) {
        const day = parseInt(dateStr, 10)
        // Use the current month and the provided year
        const now = new Date()
        const month = now.getMonth() // 0-based month
        
        // Create a new date with the provided year, current month, and the day from the string
        const date = new Date(year, month, day)
        
        // Format as YYYY-MM-DD
        const formattedDate = date.toISOString().split("T")[0]
        console.log(`Formatted single day "${dateStr}" -> "${formattedDate}"`)
        return formattedDate
      }
  
      // Check if the date is already in ISO format (YYYY-MM-DD)
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        return dateStr
      }
  
      // Check for MM/DD/YYYY format
      if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateStr)) {
        const parts = dateStr.split("/")
        const month = parseInt(parts[0], 10) - 1 // JS months are 0-based
        const day = parseInt(parts[1], 10)
        const yr = parseInt(parts[2], 10)
        
        const date = new Date(yr, month, day)
        const formattedDate = date.toISOString().split("T")[0]
        console.log(`Formatted MM/DD/YYYY "${dateStr}" -> "${formattedDate}"`)
        return formattedDate
      }
      
      // Check for MM/DD format
      if (/^\d{1,2}\/\d{1,2}$/.test(dateStr)) {
        const parts = dateStr.split("/")
        const month = parseInt(parts[0], 10) - 1 // JS months are 0-based
        const day = parseInt(parts[1], 10)
        
        const date = new Date(year, month, day)
        const formattedDate = date.toISOString().split("T")[0]
        console.log(`Formatted MM/DD "${dateStr}" -> "${formattedDate}"`)
        return formattedDate
      }
  
      // Check for Month name format (e.g., "Feb 28" or "February 28")
      if (/^[A-Za-z]{3,9}\s+\d{1,2}$/.test(dateStr)) {
        const parts = dateStr.trim().split(/\s+/)
        const month = getMonthNumber(parts[0])
        const day = parseInt(parts[1], 10)
        
        const date = new Date(year, month, day)
        const formattedDate = date.toISOString().split("T")[0]
        console.log(`Formatted Month Name "${dateStr}" -> "${formattedDate}"`)
        return formattedDate
      }
  
      // If we can't parse the date, log a warning and use today's date
      console.warn(`Unrecognized date format: "${dateStr}", using current date`)
      return new Date().toISOString().split("T")[0]
    } catch (error) {
      console.error("Error formatting date:", error, "Date string:", dateStr)
      return new Date().toISOString().split("T")[0] // Default to today if any error occurs
    }
  }
  
  // Helper function to convert month name to number (0-based)
  function getMonthNumber(monthName: string): number {
    const months = {
      "january": 0, "jan": 0,
      "february": 1, "feb": 1,
      "march": 2, "mar": 2,
      "april": 3, "apr": 3,
      "may": 4,
      "june": 5, "jun": 5,
      "july": 6, "jul": 6,
      "august": 7, "aug": 7,
      "september": 8, "sep": 8, "sept": 8,
      "october": 9, "oct": 9,
      "november": 10, "nov": 10,
      "december": 11, "dec": 11
    };
  
    const normalizedMonth = monthName.toLowerCase();
    return months[normalizedMonth as keyof typeof months] ?? new Date().getMonth();
  }
  
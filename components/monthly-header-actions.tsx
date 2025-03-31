"use client"

import { useState, useEffect } from "react"
import { MonthlyExpenseLink } from "./monthly-expense-link"

export function MonthlyHeaderActions() {
  // Get the currently selected month and year from your UI
  const [selectedMonth, setSelectedMonth] = useState("")
  const [selectedYear, setSelectedYear] = useState(0)

  useEffect(() => {
    // Get the month/year from your UI elements
    // This is a placeholder - you'll need to adapt this to your actual UI
    const monthElement = document.querySelector("[data-selected-month]")
    const yearElement = document.querySelector("[data-selected-year]")

    if (monthElement && yearElement) {
      setSelectedMonth(monthElement.textContent || "")
      setSelectedYear(Number.parseInt(yearElement.textContent || "0"))
    } else {
      // Fallback to current month/year
      const now = new Date()
      setSelectedMonth(now.toLocaleString("default", { month: "long" }))
      setSelectedYear(now.getFullYear())
    }
  }, [])

  if (!selectedMonth || !selectedYear) return null

  return (
    <div className="flex items-center gap-2">
      <MonthlyExpenseLink month={selectedMonth} year={selectedYear} />
    </div>
  )
}


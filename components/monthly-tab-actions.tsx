"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Edit } from "lucide-react"

export function MonthlyTabActions() {
  // Function to get the month and year from the UI
  const getSelectedMonthYear = () => {
    // This is a placeholder - you'll need to adapt this to your actual UI
    // Try to get the month/year from your dropdown or selector
    const monthSelect = document.querySelector("select[name='month']") as HTMLSelectElement
    const yearSelect = document.querySelector("select[name='year']") as HTMLSelectElement

    if (monthSelect && yearSelect) {
      return {
        month: monthSelect.value.toLowerCase(),
        year: Number.parseInt(yearSelect.value),
      }
    }

    // Fallback to March 2025 as shown in your screenshot
    return { month: "march", year: 2025 }
  }

  const { month, year } = getSelectedMonthYear()

  return (
    <Button asChild variant="outline" size="sm" className="ml-2">
      <Link href={`/dashboard/monthly/${year}/${month}`}>
        <Edit className="h-4 w-4 mr-1" />
        Edit Expenses
      </Link>
    </Button>
  )
}


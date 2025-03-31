"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChevronRight } from "lucide-react"

export function MonthlyNavigation() {
  const router = useRouter()
  const currentYear = new Date().getFullYear()
  const currentMonth = new Date().toLocaleString("default", { month: "long" })

  const [selectedYear, setSelectedYear] = useState<string>(currentYear.toString())
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonth.toLowerCase())

  // Generate array of years (current year and 5 years back)
  const years = Array.from({ length: 6 }, (_, i) => (currentYear - i).toString())

  // All months
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

  const navigateToMonth = () => {
    router.push(`/dashboard/monthly/${selectedYear}/${selectedMonth}`)
  }

  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <div className="grid gap-2 flex-1">
        <label htmlFor="year-select" className="text-sm font-medium">
          Year
        </label>
        <Select value={selectedYear} onValueChange={setSelectedYear}>
          <SelectTrigger id="year-select">
            <SelectValue placeholder="Select Year" />
          </SelectTrigger>
          <SelectContent>
            {years.map((year) => (
              <SelectItem key={year} value={year}>
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-2 flex-1">
        <label htmlFor="month-select" className="text-sm font-medium">
          Month
        </label>
        <Select value={selectedMonth} onValueChange={setSelectedMonth}>
          <SelectTrigger id="month-select">
            <SelectValue placeholder="Select Month" />
          </SelectTrigger>
          <SelectContent>
            {months.map((month) => (
              <SelectItem key={month} value={month}>
                {month.charAt(0).toUpperCase() + month.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-end">
        <Button onClick={navigateToMonth} className="w-full sm:w-auto">
          Go <ChevronRight className="ml-1 h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}


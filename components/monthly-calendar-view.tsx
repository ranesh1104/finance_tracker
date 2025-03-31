"use client"

import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { CalendarIcon } from "lucide-react"

export function MonthlyCalendarView() {
  const currentDate = new Date()
  const months = []

  // Generate the last 6 months (including current)
  for (let i = 0; i < 6; i++) {
    const date = new Date(currentDate)
    date.setMonth(date.getMonth() - i)

    const month = date.toLocaleString("default", { month: "long" }).toLowerCase()
    const year = date.getFullYear()

    // Add a unique index to ensure keys are unique
    months.push({
      month,
      year,
      label: date.toLocaleString("default", { month: "long" }),
      index: i, // Add an index to make keys unique
    })
  }

  return (
    <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
      {months.map((item) => (
        <Link
          key={`${item.year}-${item.month}-${item.index}`} // Add index to make keys unique
          href={`/dashboard/monthly/${item.year}/${item.month}`}
        >
          <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
            <CardContent className="flex flex-col items-center justify-center p-4 text-center h-full">
              <CalendarIcon className="h-8 w-8 mb-2 text-primary" />
              <div className="font-medium">{item.label}</div>
              <div className="text-sm text-muted-foreground">{item.year}</div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  )
}


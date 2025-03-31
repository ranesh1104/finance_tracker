"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowUpRight, ArrowDownRight, Loader2 } from "lucide-react"
import { financialSummaryService, type YearlySummary } from "@/utils/supabase/data-services"
import { useUser } from "@/hooks/use-user"

export function YearlyBreakdown() {
  const { user } = useUser()
  const [loading, setLoading] = useState(true)
  const [yearlyData, setYearlyData] = useState<YearlySummary[]>([])

  useEffect(() => {
    async function fetchYearlySummaries() {
      if (!user) return

      try {
        setLoading(true)
        // Get current year and calculate a reasonable start year (e.g., 3 years back)
        const currentYear = new Date().getFullYear()
        const startYear = currentYear - 2 // Go back 2 years (so 3 years total including current)

        // Fetch yearly summaries
        const summaries = await financialSummaryService.getMultiYearSummary(user.id, startYear, currentYear)

        setYearlyData(summaries)
      } catch (error) {
        console.error("Error fetching yearly summaries:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchYearlySummaries()
  }, [user])

  // If loading, show a loading indicator
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Yearly Breakdown</CardTitle>
          <CardDescription>Income, expenses, and savings by year</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </CardContent>
      </Card>
    )
  }

  // If no data, show placeholder
  if (yearlyData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Yearly Breakdown</CardTitle>
          <CardDescription>Income, expenses, and savings by year</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-muted-foreground">
            <p>No yearly data available yet.</p>
            <p className="text-sm mt-1">Add income and expenses to see your yearly breakdown.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Yearly Breakdown</CardTitle>
        <CardDescription>Income, expenses, and savings by year</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <div className="grid grid-cols-12 gap-4 p-3 font-medium bg-muted/50">
            <div className="col-span-2">Year</div>
            <div className="col-span-3">Income</div>
            <div className="col-span-3">Expenses</div>
            <div className="col-span-2">Saved</div>
            <div className="col-span-2">% Saved</div>
          </div>
          <div className="divide-y">
            {yearlyData
              .sort((a, b) => b.year - a.year) // Sort by most recent year first
              .map((year) => (
                <div key={year.year} className="grid grid-cols-12 gap-4 p-3 items-center">
                  <div className="col-span-2 font-medium">{year.year}</div>
                  <div className="col-span-3">${year.income.toLocaleString()}</div>
                  <div className="col-span-3">${year.expenses.toLocaleString()}</div>
                  <div className={`col-span-2 ${year.savings >= 0 ? "text-green-600" : "text-red-500"}`}>
                    ${year.savings.toLocaleString()}
                  </div>
                  <div className="col-span-2 flex items-center">
                    {year.savingsRate >= 0 ? (
                      <ArrowUpRight className="mr-1 h-3.5 w-3.5 text-green-500" />
                    ) : (
                      <ArrowDownRight className="mr-1 h-3.5 w-3.5 text-red-500" />
                    )}
                    <span className={year.savingsRate >= 0 ? "text-green-500" : "text-red-500"}>
                      {Math.abs(year.savingsRate).toFixed(1)}%
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}


import { Suspense } from "react"
import { MonthlyExpenseEditor } from "@/components/monthly-expense-editor"

export default function MonthlyBreakdownPage({
  params,
}: {
  params: { year: string; month: string }
}) {
  const year = Number.parseInt(params.year)
  const month = params.month.charAt(0).toUpperCase() + params.month.slice(1)

  return (
    <div className="container py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {month} {year} Breakdown
        </h1>
        <p className="text-muted-foreground">Monthly financial summary and expense tracking</p>
      </div>

      {/* Add the expense editor */}
      <Suspense fallback={<div>Loading expense editor...</div>}>
        <MonthlyExpenseEditor month={month} year={year} />
      </Suspense>
    </div>
  )
}


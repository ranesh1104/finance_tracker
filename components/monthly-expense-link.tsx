"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Edit } from "lucide-react"

interface MonthlyExpenseLinkProps {
  month: string
  year: number
}

export function MonthlyExpenseLink({ month, year }: MonthlyExpenseLinkProps) {
  const router = useRouter()

  const navigateToExpenseEditor = () => {
    router.push(`/dashboard/monthly/${year}/${month.toLowerCase()}`)
  }

  return (
    <Button onClick={navigateToExpenseEditor} variant="outline" className="flex items-center gap-2">
      <Edit className="h-4 w-4" />
      Edit Expenses
    </Button>
  )
}


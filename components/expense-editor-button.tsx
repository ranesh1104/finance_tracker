"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Edit } from "lucide-react"

export function ExpenseEditorButton() {
  const router = useRouter()

  const navigateToCurrentMonthEditor = () => {
    const now = new Date()
    const month = now.toLocaleString("default", { month: "long" }).toLowerCase()
    const year = now.getFullYear()

    router.push(`/dashboard/monthly/${year}/${month}`)
  }

  return (
    <Button onClick={navigateToCurrentMonthEditor} variant="outline" className="flex items-center gap-2 ml-2">
      <Edit className="h-4 w-4" />
      Edit Monthly Expenses
    </Button>
  )
}


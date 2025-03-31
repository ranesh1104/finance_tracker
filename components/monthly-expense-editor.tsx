"use client"

import { useState, useEffect } from "react"
import { EditableExpenseGrid, type DetailedExpense } from "./editable-expense-grid"
import { saveDetailedExpenses, fetchDetailedExpenses, fetchCategories } from "@/src/app/actions/expense-actions"
import { toast } from "sonner" // Import directly from sonner
import { useUser } from "@/hooks/use-user"

interface MonthlyExpenseEditorProps {
  month: string
  year: number
}

export function MonthlyExpenseEditor({ month, year }: MonthlyExpenseEditorProps) {
  const [expenses, setExpenses] = useState<DetailedExpense[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useUser()

  useEffect(() => {
    const loadData = async () => {
      if (!user?.id) return

      try {
        setLoading(true)
        const [expensesData, categoriesData] = await Promise.all([
          fetchDetailedExpenses(user.id, month, year),
          fetchCategories(user.id),
        ])

        setExpenses(expensesData)
        setCategories(categoriesData)
      } catch (error) {
        toast.error("Failed to load expenses", {
          description: "Please try again.",
        })
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [month, year, user])

  const handleSave = async (updatedExpenses: DetailedExpense[]) => {
    if (!user?.id) {
      return { success: false, error: "User not authenticated" }
    }

    return await saveDetailedExpenses(updatedExpenses, user.id)
  }

  if (loading) {
    return <div className="py-4 text-center">Loading expenses...</div>
  }

  return (
    <EditableExpenseGrid
      initialExpenses={expenses}
      categories={categories}
      month={month}
      year={year}
      onSave={handleSave}
    />
  )
}


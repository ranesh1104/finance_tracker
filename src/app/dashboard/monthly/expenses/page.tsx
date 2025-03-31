"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PlusCircle, Trash2, Search, Calendar, RefreshCw, Edit, Check, X } from "lucide-react"
import { toast } from "sonner"
import { useUser } from "@/hooks/use-user"
import { expenseService, type Expense } from "@/utils/supabase/data-services"
import { Breadcrumb } from "@/components/breadcrumb"
import { AddExpenseModal } from "@/components/add-expense-modal"
import { usePersistentState } from "@/hooks/use-persistent-state"

export default function ExpensesPage() {
  const { user, loading: userLoading } = useUser()
  const [expenses, setExpenses] = usePersistentState<Expense[]>("expenses", [])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [searchTerm, setSearchTerm] = usePersistentState<string>("expenses_search", "")
  const [selectedCategory, setSelectedCategory] = usePersistentState<string | null>("expenses_category", null)
  const [startDate, setStartDate] = usePersistentState<string>("expenses_start_date", "")
  const [endDate, setEndDate] = usePersistentState<string>("expenses_end_date", "")
  const [categories, setCategories] = usePersistentState<string[]>("expenses_categories", [])
  const [isAddExpenseModalOpen, setIsAddExpenseModalOpen] = useState(false)

  // State for editing
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null)
  const [editedExpense, setEditedExpense] = useState<{
    description: string
    category: string
    amount: string
    date: string
  }>({
    description: "",
    category: "",
    amount: "",
    date: "",
  })

  // Get the current month's start and end dates
  useEffect(() => {
    if (!startDate || !endDate) {
      const now = new Date()
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)

      setStartDate(firstDay.toISOString().split("T")[0])
      setEndDate(lastDay.toISOString().split("T")[0])
    }
  }, [startDate, endDate, setStartDate, setEndDate])

  // Fetch expenses
  const fetchExpenses = async () => {
    if (!user || !startDate || !endDate) return

    try {
      setLoading(true)
      const data = await expenseService.getExpenses(user.id, startDate, endDate)

      console.log(
        "Fetched expenses:",
        data.map((e) => ({
          id: e.id,
          description: e.description,
          date: e.date,
          amount: e.amount,
        })),
      )

      setExpenses(data)

      // Extract unique categories
      const uniqueCategories = Array.from(new Set(data.map((expense) => expense.category)))
      setCategories(uniqueCategories)
    } catch (error: any) {
      toast.error("Error loading expenses", {
        description: error.message || "Failed to load your expenses",
      })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    if (!userLoading && user) {
      fetchExpenses()
    }
  }, [user, userLoading, startDate, endDate])

  // Handle refresh
  const handleRefresh = () => {
    setRefreshing(true)
    fetchExpenses()
  }

  // Filter expenses
  const filteredExpenses = expenses.filter((expense) => {
    const matchesSearch =
      searchTerm === "" ||
      expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expense.category.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesCategory = selectedCategory === null || expense.category === selectedCategory

    return matchesSearch && matchesCategory
  })

  // Calculate total
  const totalAmount = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0)

  // Delete expense
  const handleDeleteExpense = async (id: string) => {
    try {
      await expenseService.deleteExpense(id)
      setExpenses(expenses.filter((expense) => expense.id !== id))
      toast.success("Expense deleted successfully")
    } catch (error: any) {
      toast.error("Error deleting expense", {
        description: error.message || "Failed to delete the expense",
      })
    }
  }

  // Start editing expense
  const handleStartEditing = (expense: Expense) => {
    setEditingExpenseId(expense.id)
    setEditedExpense({
      description: expense.description,
      category: expense.category,
      amount: expense.amount.toString(),
      date: expense.date,
    })
  }

  // Save edited expense
  const handleSaveExpense = async () => {
    if (!editingExpenseId) return

    try {
      const amount = Number.parseFloat(editedExpense.amount)
      if (isNaN(amount)) {
        toast.error("Please enter a valid amount")
        return
      }

      await expenseService.updateExpense(editingExpenseId, {
        description: editedExpense.description,
        category: editedExpense.category,
        amount: amount,
        date: editedExpense.date,
      })

      // Update the local state
      setExpenses(
        expenses.map((expense) =>
          expense.id === editingExpenseId
            ? {
                ...expense,
                description: editedExpense.description,
                category: editedExpense.category,
                amount: amount,
                date: editedExpense.date,
              }
            : expense,
        ),
      )

      setEditingExpenseId(null)
      toast.success("Expense updated successfully")
    } catch (error: any) {
      toast.error("Error updating expense", {
        description: error.message || "Failed to update the expense",
      })
    }
  }

  // Cancel editing
  const handleCancelEditing = () => {
    setEditingExpenseId(null)
  }

  if (userLoading || loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading your expenses...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <Breadcrumb
          items={[
            { label: "Monthly Breakdown", href: "/dashboard/monthly" },
            { label: "Expenses", href: "/dashboard/monthly/expenses" },
          ]}
        />
        <h1 className="text-3xl font-bold tracking-tight">Expenses</h1>
        <p className="text-muted-foreground">View and manage your individual expenses</p>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search expenses..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="w-full md:w-[200px]">
          <Select
            value={selectedCategory || "all"}
            onValueChange={(value) => setSelectedCategory(value === "all" ? null : value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2">
          <div className="w-full md:w-[150px]">
            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div className="w-full md:w-[150px]">
            <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
        </div>

        <Button variant="outline" size="icon" onClick={handleRefresh} disabled={refreshing} className="h-10 w-10">
          <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Expense List</CardTitle>
              <CardDescription>
                {filteredExpenses.length} expenses totaling ${totalAmount.toLocaleString()}
              </CardDescription>
            </div>
            <Button onClick={() => setIsAddExpenseModalOpen(true)}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Expense
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <div className="grid grid-cols-12 gap-4 p-3 font-medium bg-muted/50">
              <div className="col-span-2">Date</div>
              <div className="col-span-4">Description</div>
              <div className="col-span-2">Category</div>
              <div className="col-span-2">Amount</div>
              <div className="col-span-2 text-right">Actions</div>
            </div>
            <div className="divide-y">
              {filteredExpenses.length > 0 ? (
                filteredExpenses.map((expense) => (
                  <div key={expense.id} className="grid grid-cols-12 gap-4 p-3 items-center">
                    {editingExpenseId === expense.id ? (
                      // Editing mode
                      <>
                        <div className="col-span-2">
                          <Input
                            type="date"
                            value={editedExpense.date}
                            onChange={(e) => setEditedExpense({ ...editedExpense, date: e.target.value })}
                            className="h-8"
                          />
                        </div>
                        <div className="col-span-4">
                          <Input
                            value={editedExpense.description}
                            onChange={(e) => setEditedExpense({ ...editedExpense, description: e.target.value })}
                            className="h-8"
                          />
                        </div>
                        <div className="col-span-2">
                          <Select
                            value={editedExpense.category}
                            onValueChange={(value) => setEditedExpense({ ...editedExpense, category: value })}
                          >
                            <SelectTrigger className="h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {categories.map((category) => (
                                <SelectItem key={category} value={category}>
                                  {category}
                                </SelectItem>
                              ))}
                              <SelectItem value="Other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="col-span-2">
                          <Input
                            type="number"
                            value={editedExpense.amount}
                            onChange={(e) => setEditedExpense({ ...editedExpense, amount: e.target.value })}
                            className="h-8"
                            step="0.01"
                          />
                        </div>
                        <div className="col-span-2 flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleSaveExpense}
                            className="h-8 w-8 text-green-600"
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleCancelEditing}
                            className="h-8 w-8 text-red-500"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </>
                    ) : (
                      // Display mode
                      <>
                        <div className="col-span-2">{new Date(expense.date).toLocaleDateString()}</div>
                        <div className="col-span-4">{expense.description}</div>
                        <div className="col-span-2">{expense.category}</div>
                        <div className="col-span-2 font-medium">${expense.amount.toLocaleString()}</div>
                        <div className="col-span-2 flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleStartEditing(expense)}
                            className="h-8 w-8 text-muted-foreground hover:text-blue-500"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteExpense(expense.id)}
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-muted-foreground">
                  <Calendar className="mx-auto h-12 w-12 mb-2 text-muted-foreground/50" />
                  <p>No expenses found for the selected filters.</p>
                  <p className="text-sm mt-1">Try adjusting your search or date range.</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {user && (
        <AddExpenseModal
          isOpen={isAddExpenseModalOpen}
          onClose={() => setIsAddExpenseModalOpen(false)}
          onExpenseAdded={fetchExpenses}
          userId={user.id}
          categories={categories.includes("Other") ? categories : [...categories, "Other"]}
        />
      )}
    </div>
  )
}


"use client"

import { useState, useRef, useEffect, type KeyboardEvent } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Save, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner" // Import directly from sonner

// Define the expense structure with additional fields
export interface DetailedExpense {
  id: string
  description: string
  category: string
  amount: number
  date: string
  // Additional fields not in the database schema
  vendor: string
  paymentMethod: string
  cardUsed: string
  cashBackRate: number
  cashBackEarned: number
}

interface EditableExpenseGridProps {
  initialExpenses: DetailedExpense[]
  categories: string[]
  month: string
  year: number
  onSave: (expenses: DetailedExpense[]) => Promise<{ success: boolean; error?: string }>
}

export function EditableExpenseGrid({ initialExpenses, categories, month, year, onSave }: EditableExpenseGridProps) {
  const [expenses, setExpenses] = useState<DetailedExpense[]>(initialExpenses)
  const [activeCell, setActiveCell] = useState<{ rowIndex: number; colIndex: number } | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const cellRefs = useRef<Array<Array<HTMLTableCellElement | null>>>([])
  const inputRefs = useRef<Array<Array<HTMLInputElement | HTMLButtonElement | null>>>([])

  // Common payment methods and cards
  const paymentMethods = ["Credit Card", "Debit Card", "Cash", "Bank Transfer", "PayPal"]
  const cards = ["Ink Unlimited", "Chase Sapphire", "Amex Platinum", "Discover It", "None"]

  // Initialize the refs arrays
  useEffect(() => {
    cellRefs.current = Array(expenses.length + 1)
      .fill(null)
      .map(() => Array(9).fill(null))

    inputRefs.current = Array(expenses.length + 1)
      .fill(null)
      .map(() => Array(9).fill(null))
  }, [expenses.length])

  // Add a new empty expense row
  const addNewRow = () => {
    const newExpense: DetailedExpense = {
      id: crypto.randomUUID(),
      description: "",
      vendor: "",
      category: "",
      amount: 0,
      date: `${month.substring(0, 3)}/${year.toString().substring(2)}`,
      paymentMethod: "Credit Card",
      cardUsed: "",
      cashBackRate: 0,
      cashBackEarned: 0,
    }
    setExpenses([...expenses, newExpense])

    // Focus the first cell of the new row after it's added
    setTimeout(() => {
      setActiveCell({ rowIndex: expenses.length, colIndex: 0 })
    }, 0)
  }

  // Remove an expense row
  const removeRow = (index: number) => {
    const newExpenses = [...expenses]
    newExpenses.splice(index, 1)
    setExpenses(newExpenses)
    setActiveCell(null)
  }

  // Update expense data
  const updateExpense = (rowIndex: number, field: keyof DetailedExpense, value: any) => {
    const newExpenses = [...expenses]
    newExpenses[rowIndex] = { ...newExpenses[rowIndex], [field]: value }

    // Auto-calculate cash back earned
    if (field === "amount" || field === "cashBackRate") {
      const amount = field === "amount" ? value : newExpenses[rowIndex].amount
      const rate = field === "cashBackRate" ? value : newExpenses[rowIndex].cashBackRate
      newExpenses[rowIndex].cashBackEarned = Number((amount * (rate / 100)).toFixed(2))
    }

    setExpenses(newExpenses)
  }

  // Handle keyboard navigation
  const handleKeyDown = (e: KeyboardEvent<HTMLTableElement>, rowIndex: number, colIndex: number) => {
    if (activeCell === null) return

    switch (e.key) {
      case "ArrowUp":
        e.preventDefault()
        if (rowIndex > 0) {
          setActiveCell({ rowIndex: rowIndex - 1, colIndex })
        }
        break
      case "ArrowDown":
      case "Enter":
        e.preventDefault()
        if (rowIndex < expenses.length - 1) {
          setActiveCell({ rowIndex: rowIndex + 1, colIndex })
        } else if (e.key === "Enter" && rowIndex === expenses.length - 1) {
          // Add a new row when pressing Enter on the last row
          addNewRow()
        }
        break
      case "ArrowLeft":
        e.preventDefault()
        if (colIndex > 0) {
          setActiveCell({ rowIndex, colIndex: colIndex - 1 })
        }
        break
      case "ArrowRight":
      case "Tab":
        e.preventDefault()
        if (colIndex < 8) {
          setActiveCell({ rowIndex, colIndex: colIndex + 1 })
        } else if (rowIndex < expenses.length - 1) {
          setActiveCell({ rowIndex: rowIndex + 1, colIndex: 0 })
        }
        break
    }
  }

  // Focus the active cell when it changes
  useEffect(() => {
    if (activeCell) {
      const { rowIndex, colIndex } = activeCell
      const input = inputRefs.current[rowIndex]?.[colIndex]
      if (input) {
        input.focus()
      }
    }
  }, [activeCell])

  // Save all expenses
  const handleSave = async () => {
    try {
      setIsSaving(true)
      const result = await onSave(expenses)

      if (result.success) {
        toast.success("Expenses saved successfully")
      } else {
        throw new Error(result.error || "Failed to save expenses")
      }
    } catch (error) {
      toast.error("Error saving expenses", {
        description: (error as Error).message,
      })
    } finally {
      setIsSaving(false)
    }
  }

  // Function to set cell ref
  const setCellRef = (rowIndex: number, colIndex: number, el: HTMLTableCellElement | null) => {
    if (!cellRefs.current[rowIndex]) {
      cellRefs.current[rowIndex] = []
    }
    cellRefs.current[rowIndex][colIndex] = el
  }

  // Function to set input ref
  const setInputRef = (rowIndex: number, colIndex: number, el: HTMLInputElement | HTMLButtonElement | null) => {
    if (!inputRefs.current[rowIndex]) {
      inputRefs.current[rowIndex] = []
    }
    inputRefs.current[rowIndex][colIndex] = el
  }

  return (
    <Card className="mt-6">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xl font-bold">Monthly Expenses</CardTitle>
        <div className="flex gap-2">
          <Button onClick={addNewRow} size="sm" variant="outline">
            <Plus className="h-4 w-4 mr-1" /> Add Expense
          </Button>
          <Button onClick={handleSave} size="sm" disabled={isSaving}>
            <Save className="h-4 w-4 mr-1" /> {isSaving ? "Saving..." : "Save All"}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="border rounded-md overflow-x-auto">
          <Table
            onKeyDown={(e) => {
              if (activeCell) {
                handleKeyDown(e, activeCell.rowIndex, activeCell.colIndex)
              }
            }}
          >
            <TableHeader>
              <TableRow>
                <TableHead>Description</TableHead>
                <TableHead>Vendor</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Payment Method</TableHead>
                <TableHead>Card Used</TableHead>
                <TableHead>Cash Back %</TableHead>
                <TableHead>Cash Back Earned</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {expenses.map((expense, rowIndex) => (
                <TableRow key={expense.id}>
                  {/* Description */}
                  <TableCell
                    ref={(el) => setCellRef(rowIndex, 0, el)}
                    className={cn(
                      "p-0",
                      activeCell?.rowIndex === rowIndex && activeCell?.colIndex === 0 && "bg-muted/50",
                    )}
                    onClick={() => setActiveCell({ rowIndex, colIndex: 0 })}
                  >
                    <Input
                      ref={(el) => setInputRef(rowIndex, 0, el)}
                      value={expense.description}
                      onChange={(e) => updateExpense(rowIndex, "description", e.target.value)}
                      className="border-0 focus:ring-0 focus-visible:ring-0 rounded-none h-10"
                    />
                  </TableCell>

                  {/* Vendor */}
                  <TableCell
                    ref={(el) => setCellRef(rowIndex, 1, el)}
                    className={cn(
                      "p-0",
                      activeCell?.rowIndex === rowIndex && activeCell?.colIndex === 1 && "bg-muted/50",
                    )}
                    onClick={() => setActiveCell({ rowIndex, colIndex: 1 })}
                  >
                    <Input
                      ref={(el) => setInputRef(rowIndex, 1, el)}
                      value={expense.vendor}
                      onChange={(e) => updateExpense(rowIndex, "vendor", e.target.value)}
                      className="border-0 focus:ring-0 focus-visible:ring-0 rounded-none h-10"
                    />
                  </TableCell>

                  {/* Category */}
                  <TableCell
                    ref={(el) => setCellRef(rowIndex, 2, el)}
                    className={cn(
                      "p-0",
                      activeCell?.rowIndex === rowIndex && activeCell?.colIndex === 2 && "bg-muted/50",
                    )}
                    onClick={() => setActiveCell({ rowIndex, colIndex: 2 })}
                  >
                    <Select
                      value={expense.category}
                      onValueChange={(value) => updateExpense(rowIndex, "category", value)}
                    >
                      <SelectTrigger
                        ref={(el) => setInputRef(rowIndex, 2, el)}
                        className="border-0 focus:ring-0 focus-visible:ring-0 rounded-none h-10"
                      >
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>

                  {/* Amount */}
                  <TableCell
                    ref={(el) => setCellRef(rowIndex, 3, el)}
                    className={cn(
                      "p-0",
                      activeCell?.rowIndex === rowIndex && activeCell?.colIndex === 3 && "bg-muted/50",
                    )}
                    onClick={() => setActiveCell({ rowIndex, colIndex: 3 })}
                  >
                    <div className="flex items-center">
                      <span className="pl-3 text-muted-foreground">$</span>
                      <Input
                        ref={(el) => setInputRef(rowIndex, 3, el)}
                        type="number"
                        value={expense.amount || ""}
                        onChange={(e) => updateExpense(rowIndex, "amount", Number(e.target.value))}
                        className="border-0 focus:ring-0 focus-visible:ring-0 rounded-none h-10"
                        step="0.01"
                      />
                    </div>
                  </TableCell>

                  {/* Date */}
                  <TableCell
                    ref={(el) => setCellRef(rowIndex, 4, el)}
                    className={cn(
                      "p-0",
                      activeCell?.rowIndex === rowIndex && activeCell?.colIndex === 4 && "bg-muted/50",
                    )}
                    onClick={() => setActiveCell({ rowIndex, colIndex: 4 })}
                  >
                    <Input
                      ref={(el) => setInputRef(rowIndex, 4, el)}
                      value={expense.date}
                      onChange={(e) => updateExpense(rowIndex, "date", e.target.value)}
                      className="border-0 focus:ring-0 focus-visible:ring-0 rounded-none h-10"
                      placeholder="MM/DD"
                    />
                  </TableCell>

                  {/* Payment Method */}
                  <TableCell
                    ref={(el) => setCellRef(rowIndex, 5, el)}
                    className={cn(
                      "p-0",
                      activeCell?.rowIndex === rowIndex && activeCell?.colIndex === 5 && "bg-muted/50",
                    )}
                    onClick={() => setActiveCell({ rowIndex, colIndex: 5 })}
                  >
                    <Select
                      value={expense.paymentMethod}
                      onValueChange={(value) => updateExpense(rowIndex, "paymentMethod", value)}
                    >
                      <SelectTrigger
                        ref={(el) => setInputRef(rowIndex, 5, el)}
                        className="border-0 focus:ring-0 focus-visible:ring-0 rounded-none h-10"
                      >
                        <SelectValue placeholder="Select method" />
                      </SelectTrigger>
                      <SelectContent>
                        {paymentMethods.map((method) => (
                          <SelectItem key={method} value={method}>
                            {method}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>

                  {/* Card Used */}
                  <TableCell
                    ref={(el) => setCellRef(rowIndex, 6, el)}
                    className={cn(
                      "p-0",
                      activeCell?.rowIndex === rowIndex && activeCell?.colIndex === 6 && "bg-muted/50",
                    )}
                    onClick={() => setActiveCell({ rowIndex, colIndex: 6 })}
                  >
                    <Select
                      value={expense.cardUsed}
                      onValueChange={(value) => updateExpense(rowIndex, "cardUsed", value)}
                    >
                      <SelectTrigger
                        ref={(el) => setInputRef(rowIndex, 6, el)}
                        className="border-0 focus:ring-0 focus-visible:ring-0 rounded-none h-10"
                      >
                        <SelectValue placeholder="Select card" />
                      </SelectTrigger>
                      <SelectContent>
                        {cards.map((card) => (
                          <SelectItem key={card} value={card}>
                            {card}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>

                  {/* Cash Back Rate */}
                  <TableCell
                    ref={(el) => setCellRef(rowIndex, 7, el)}
                    className={cn(
                      "p-0",
                      activeCell?.rowIndex === rowIndex && activeCell?.colIndex === 7 && "bg-muted/50",
                    )}
                    onClick={() => setActiveCell({ rowIndex, colIndex: 7 })}
                  >
                    <div className="flex items-center">
                      <Input
                        ref={(el) => setInputRef(rowIndex, 7, el)}
                        type="number"
                        value={expense.cashBackRate || ""}
                        onChange={(e) => updateExpense(rowIndex, "cashBackRate", Number(e.target.value))}
                        className="border-0 focus:ring-0 focus-visible:ring-0 rounded-none h-10"
                        step="0.1"
                      />
                      <span className="pr-3 text-muted-foreground">%</span>
                    </div>
                  </TableCell>

                  {/* Cash Back Earned */}
                  <TableCell
                    ref={(el) => setCellRef(rowIndex, 8, el)}
                    className={cn(
                      "p-0",
                      activeCell?.rowIndex === rowIndex && activeCell?.colIndex === 8 && "bg-muted/50",
                    )}
                    onClick={() => setActiveCell({ rowIndex, colIndex: 8 })}
                  >
                    <div className="flex items-center">
                      <span className="pl-3 text-muted-foreground">$</span>
                      <Input
                        ref={(el) => setInputRef(rowIndex, 8, el)}
                        value={expense.cashBackEarned.toFixed(2)}
                        readOnly
                        className="border-0 focus:ring-0 focus-visible:ring-0 rounded-none h-10 bg-muted/20"
                      />
                    </div>
                  </TableCell>

                  {/* Actions */}
                  <TableCell className="p-0 w-[50px]">
                    <Button variant="ghost" size="icon" onClick={() => removeRow(rowIndex)} className="h-10 w-10">
                      <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {expenses.length === 0 && (
          <div className="text-center py-4 text-muted-foreground">
            No expenses added. Click "Add Expense" to start entering expenses.
          </div>
        )}
      </CardContent>
    </Card>
  )
}


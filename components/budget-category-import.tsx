"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { importBudgetCategories } from "@/src/app/actions/import-budget-categories"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Info, Upload } from 'lucide-react'

interface BudgetCategoryImportProps {
  month: string
  year: number
  onSuccess: () => void
}

export function BudgetCategoryImport({ month, year, onSuccess }: BudgetCategoryImportProps) {
  const [pastedText, setPastedText] = useState("")
  const [importing, setImporting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [importResult, setImportResult] = useState<{ count: number } | null>(null)

  const handleImport = async () => {
    if (!pastedText.trim()) {
      toast.error("Please paste your budget categories")
      return
    }

    try {
      setImporting(true)
      setError(null)
      setImportResult(null)

      const result = await importBudgetCategories({
        text: pastedText,
        month,
        year,
      })

      if (result.success) {
        setImportResult({ count: result.count || 0 })
        toast.success(result.message || "Import successful")
        setPastedText("") // Clear the textarea
        onSuccess()
      } else {
        setError(result.error || "An unknown error occurred")
        toast.error("Error importing budget categories", {
          description: result.error,
        })
      }
    } catch (error: any) {
      const errorMessage = error.message || "An unknown error occurred"
      setError(errorMessage)
      toast.error("Error importing budget categories", {
        description: errorMessage,
      })
    } finally {
      setImporting(false)
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center">
          <Upload className="h-6 w-6 text-primary mr-2" />
          <CardTitle>Import Budget Categories</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <p className="text-muted-foreground mb-2">
            Paste your budget categories in CSV format or as a simple list with categories and amounts.
          </p>
          <p className="text-xs text-muted-foreground mb-4">
            Example: "Rent $1,255.00, Groceries $800.00" or "Category, Amount" format
          </p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error importing budget categories</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {importResult && (
          <Alert className="mb-4">
            <Info className="h-4 w-4" />
            <AlertTitle>Import successful</AlertTitle>
            <AlertDescription>
              <p>Successfully imported {importResult.count} budget categories.</p>
            </AlertDescription>
          </Alert>
        )}

        <Textarea
          placeholder="Paste your budget categories here..."
          className="min-h-[200px] mb-4"
          value={pastedText}
          onChange={(e) => setPastedText(e.target.value)}
        />

        <Button onClick={handleImport} disabled={importing || !pastedText.trim()}>
          {importing ? (
            <>
              <div className="animate-spin mr-2 h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
              Importing...
            </>
          ) : (
            "Import Categories"
          )}
        </Button>
      </CardContent>
    </Card>
  )
}

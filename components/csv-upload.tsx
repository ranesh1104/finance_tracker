"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Upload, FileQuestion, AlertCircle, Info, ChevronDown } from "lucide-react"
import { toast } from "sonner"
import { CSVFormatModal } from "./csv-format-modal"
import { uploadExpenses } from "@/src/app/actions/upload-expenses"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

interface CSVUploadProps {
  month: string
  year: number
  onSuccess: () => void
}

interface UploadResult {
  count: number
  invalidCount?: number
  invalidRecords?: Array<{
    row: number
    data: any
    issues: string[]
  }>
}

export function CSVUpload({ month, year, onSuccess }: CSVUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [formatModalOpen, setFormatModalOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [debugInfo, setDebugInfo] = useState<any>(null)
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null)
    setDebugInfo(null)
    setUploadResult(null)
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0])
    }
  }

  // Handle file drop
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setError(null)
    setDebugInfo(null)
    setUploadResult(null)

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setSelectedFile(e.dataTransfer.files[0])
    }
  }

  // Prevent default behavior for drag events
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
  }

  // Handle file upload
  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error("Please select a file to upload")
      return
    }

    try {
      setUploading(true)
      setError(null)
      setDebugInfo(null)
      setUploadResult(null)

      const formData = new FormData()
      formData.append("csvFile", selectedFile)
      formData.append("month", month)
      formData.append("year", year.toString())

      const result = await uploadExpenses(formData)

      if (result.success) {
        setUploadResult({
          count: result.count || 0,
          invalidCount: result.invalidCount || 0,
          invalidRecords: result.invalidRecords || [],
        })
        toast.success(result.message || "Upload successful")
        onSuccess()
      } else {
        setError(result.error || "An unknown error occurred")
        if (result.debugInfo) {
          setDebugInfo(result.debugInfo)
          console.log("Debug info:", result.debugInfo)
        }
        toast.error("Error uploading expenses", {
          description: result.error,
        })
      }
    } catch (error: any) {
      const errorMessage = error.message || "An unknown error occurred"
      setError(errorMessage)
      toast.error("Error uploading expenses", {
        description: errorMessage,
      })
    } finally {
      setUploading(false)
    }
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center">
            <Upload className="h-6 w-6 text-primary mr-2" />
            <CardTitle>Expenses</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-4">
            <p className="text-muted-foreground">Upload your expenses CSV file</p>
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center gap-1 text-muted-foreground hover:text-foreground"
              onClick={() => setFormatModalOpen(true)}
            >
              <FileQuestion className="h-4 w-4" />
              CSV Format
            </Button>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error uploading expenses</AlertTitle>
              <AlertDescription>
                {error}
                {debugInfo && (
                  <div className="mt-2 text-xs">
                    <p>Additional information:</p>
                    <ul className="list-disc pl-5 mt-1">
                      <li>Total rows parsed: {debugInfo.totalParsed}</li>
                      <li>Invalid rows: {debugInfo.invalidCount}</li>
                      {debugInfo.sampleInvalid && debugInfo.sampleInvalid.length > 0 && (
                        <li>
                          Sample issues:
                          <ul className="list-disc pl-5 mt-1">
                            {debugInfo.sampleInvalid.map((item: any, i: number) => (
                              <li key={i}>
                                Row {i + 1}: {item.issues.join(", ")}
                              </li>
                            ))}
                          </ul>
                        </li>
                      )}
                    </ul>
                    <p className="mt-2">
                      Please check the browser console for more details and ensure your CSV format matches the expected
                      format.
                    </p>
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}

          {uploadResult && (
            <Alert className="mb-4">
              <Info className="h-4 w-4" />
              <AlertTitle>Upload successful</AlertTitle>
              <AlertDescription>
                <p>Successfully imported {uploadResult.count} expenses.</p>

                {uploadResult.invalidCount && uploadResult.invalidCount > 0 && (
                  <Collapsible className="mt-2">
                    <div className="flex items-center space-x-2">
                      <p className="text-sm text-amber-600">
                        {uploadResult.invalidCount} records were invalid and skipped
                      </p>
                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="sm" className="p-0 h-7 w-7">
                          <ChevronDown className="h-4 w-4" />
                          <span className="sr-only">Toggle details</span>
                        </Button>
                      </CollapsibleTrigger>
                    </div>

                    <CollapsibleContent className="mt-2">
                      <div className="text-sm border rounded-md p-3 bg-muted/50">
                        <p className="font-medium mb-2">Invalid Records:</p>
                        {uploadResult.invalidRecords && uploadResult.invalidRecords.length > 0 ? (
                          <ul className="list-disc pl-5 space-y-2">
                            {uploadResult.invalidRecords.map((record, index) => (
                              <li key={index}>
                                <span className="font-medium">Row {record.row}:</span> {record.issues.join(", ")}
                                {record.data && (
                                  <div className="mt-1 text-xs bg-background p-2 rounded overflow-x-auto">
                                    <pre>{JSON.stringify(record.data, null, 2)}</pre>
                                  </div>
                                )}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p>Detailed information about invalid records is not available.</p>
                        )}
                        <p className="mt-3 text-xs">
                          Common issues include missing required fields (category, amount, date), invalid amounts, or
                          improperly formatted dates.
                        </p>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                )}
              </AlertDescription>
            </Alert>
          )}

          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              selectedFile ? "border-primary/50 bg-primary/5" : "border-muted-foreground/25"
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          >
            {selectedFile ? (
              <div className="space-y-4">
                <div className="flex items-center justify-center gap-2">
                  <Upload className="h-8 w-8 text-primary" />
                  <div className="text-left">
                    <p className="font-medium">{selectedFile.name}</p>
                    <p className="text-sm text-muted-foreground">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                  </div>
                </div>

                <div className="flex gap-2 justify-center">
                  <Button variant="outline" onClick={() => setSelectedFile(null)} disabled={uploading}>
                    Change File
                  </Button>
                  <Button onClick={handleUpload} disabled={uploading}>
                    {uploading ? (
                      <>
                        <div className="animate-spin mr-2 h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                        Uploading...
                      </>
                    ) : (
                      "Upload"
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                <p className="text-muted-foreground mb-4">Drag and drop your CSV file, or click to browse</p>
                <p className="text-xs text-muted-foreground mb-4">
                  Supported date formats: MM/DD/YYYY, MM/DD, M/D, or just the day number
                </p>
                <Button variant="secondary" onClick={() => fileInputRef.current?.click()}>
                  Browse Files
                </Button>
                <input type="file" accept=".csv" onChange={handleFileChange} className="hidden" ref={fileInputRef} />
              </>
            )}
          </div>
        </CardContent>
      </Card>

      <CSVFormatModal open={formatModalOpen} onClose={() => setFormatModalOpen(false)} />
    </>
  )
}


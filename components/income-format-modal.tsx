"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface IncomeFormatModalProps {
  open: boolean
  onClose: () => void
}

export function IncomeFormatModal({ open, onClose }: IncomeFormatModalProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Expected CSV Format</DialogTitle>
          <DialogDescription className="text-base">
            Your CSV file should include these columns for proper data processing.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4">
          <div className="rounded-md border overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium">Income Type</th>
                  <th className="px-4 py-3 text-left font-medium">Income Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t">
                  <td className="px-4 py-3">Isabel School Refund</td>
                  <td className="px-4 py-3">$77.50</td>
                </tr>
                <tr className="border-t">
                  <td className="px-4 py-3">Isabel Paycheck 2</td>
                  <td className="px-4 py-3">$200.00</td>
                </tr>
                <tr className="border-t">
                  <td className="px-4 py-3">Ranesh Paycheck 1</td>
                  <td className="px-4 py-3">$2,390.00</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="mt-6">
            <h3 className="text-lg font-medium mb-2">Required columns:</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <span className="font-medium">Income Type</span> - The source of income (e.g., Salary, Refund, etc.)
              </li>
              <li>
                <span className="font-medium">Income Amount</span> - The amount received (can include $ sign and commas)
              </li>
            </ul>

            <p className="mt-4 text-muted-foreground">
              The CSV can be comma-separated or tab-separated. Headers can be in any order, but must include these
              columns.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

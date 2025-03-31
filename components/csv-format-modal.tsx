"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface CSVFormatModalProps {
  open: boolean
  onClose: () => void
}

export function CSVFormatModal({ open, onClose }: CSVFormatModalProps) {
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
                  <th className="px-4 py-3 text-left font-medium">Current Expenses</th>
                  <th className="px-4 py-3 text-left font-medium">Vendor</th>
                  <th className="px-4 py-3 text-left font-medium">Category</th>
                  <th className="px-4 py-3 text-left font-medium">Amount Paid</th>
                  <th className="px-4 py-3 text-left font-medium">Date</th>
                  <th className="px-4 py-3 text-left font-medium">Payment Method</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t">
                  <td className="px-4 py-3">Walmart (Cat Litter)</td>
                  <td className="px-4 py-3">Walmart</td>
                  <td className="px-4 py-3">Cat</td>
                  <td className="px-4 py-3">$53.96</td>
                  <td className="px-4 py-3">2/28</td>
                  <td className="px-4 py-3">Credit Card</td>
                </tr>
                <tr className="border-t">
                  <td className="px-4 py-3">PetSmart (Cat Food)</td>
                  <td className="px-4 py-3">PetSmart</td>
                  <td className="px-4 py-3">Cat</td>
                  <td className="px-4 py-3">$32.85</td>
                  <td className="px-4 py-3">2/28</td>
                  <td className="px-4 py-3">Credit Card</td>
                </tr>
                <tr className="border-t">
                  <td className="px-4 py-3">TJMaxx (Baby Gifts)</td>
                  <td className="px-4 py-3">TJMaxx</td>
                  <td className="px-4 py-3">Misc</td>
                  <td className="px-4 py-3">$16.14</td>
                  <td className="px-4 py-3">2/28</td>
                  <td className="px-4 py-3">Credit Card</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="mt-6">
            <h3 className="text-lg font-medium mb-2">Required columns:</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <span className="font-medium">Category</span> - The spending category (e.g., Groceries, Rent)
              </li>
              <li>
                <span className="font-medium">Amount Paid</span> - The amount spent (can include $ sign)
              </li>
              <li>
                <span className="font-medium">Date</span> - The transaction date (various formats supported)
              </li>
            </ul>

            <h3 className="text-lg font-medium mt-4 mb-2">Supported date formats:</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <span className="font-medium">MM/DD/YYYY</span> - Example: 3/15/2025
              </li>
              <li>
                <span className="font-medium">MM/DD</span> - Example: 3/15
              </li>
              <li>
                <span className="font-medium">M/D</span> - Example: 3/5
              </li>
              <li>
                <span className="font-medium">Just the day</span> - Example: 15 (uses current month)
              </li>
              <li>
                <span className="font-medium">Month name and day</span> - Example: Mar 15
              </li>
            </ul>

            <p className="mt-4 text-muted-foreground">
              Other columns are optional but can provide additional insights.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}


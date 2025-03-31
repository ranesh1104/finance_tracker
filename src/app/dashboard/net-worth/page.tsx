"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PlusCircle, Trash2, TrendingUp, ArrowUpRight, Edit, Check, X, RefreshCw } from "lucide-react"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { toast } from "sonner"
import { useUser } from "@/hooks/use-user"
import { assetService, liabilityService, type Asset, type Liability } from "@/utils/supabase/data-services"
import { expenseService, incomeService } from "@/utils/supabase/data-services"

export default function NetWorthPage() {
  const { user, loading: userLoading } = useUser()
  const [assets, setAssets] = useState<Asset[]>([])
  const [liabilities, setLiabilities] = useState<Liability[]>([])
  const [newAsset, setNewAsset] = useState({ name: "", value: "", type: "cash" })
  const [newLiability, setNewLiability] = useState({ name: "", value: "", type: "loan" })
  const [loading, setLoading] = useState(true)
  const [netWorthHistory, setNetWorthHistory] = useState<Array<{ month: string; netWorth: number }>>([])
  const [refreshing, setRefreshing] = useState(false)

  // Editing states
  const [editingAssetId, setEditingAssetId] = useState<string | null>(null)
  const [editingLiabilityId, setEditingLiabilityId] = useState<string | null>(null)
  const [editedAsset, setEditedAsset] = useState<{ name: string; value: string; type: string }>({
    name: "",
    value: "",
    type: "",
  })
  const [editedLiability, setEditedLiability] = useState<{ name: string; value: string; type: string }>({
    name: "",
    value: "",
    type: "",
  })

  // Add a new state for the selected year filter at the top of the component
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear())
  const [monthlyData, setMonthlyData] = useState<
    Array<{
      month: string
      monthName: string
      income: number
      expenses: number
      savings: number
    }>
  >([])

  // Fetch assets and liabilities
  useEffect(() => {
    async function fetchData() {
      if (!user) return

      try {
        setLoading(true)
        const [assetsData, liabilitiesData] = await Promise.all([
          assetService.getAssets(user.id),
          liabilityService.getLiabilities(user.id),
        ])

        setAssets(assetsData)
        setLiabilities(liabilitiesData)

        // Fetch historical income and expenses to calculate net worth over time
        await fetchHistoricalNetWorth(user.id)
      } catch (error: any) {
        toast.error("Error loading data", {
          description: error.message || "Failed to load your assets and liabilities",
        })
      } finally {
        setLoading(false)
      }
    }

    if (!userLoading && user) {
      fetchData()
    }
  }, [user, userLoading])

  // Add this function to directly fetch monthly breakdown data for a specific month and year

  // Add this function to directly fetch monthly breakdown data
  const fetchMonthlyBreakdownData = async (userId: string, month: string, year: number) => {
    try {
      // Get expenses for the specific month and year
      const startDate = new Date(year, getMonthNumber(month), 1).toISOString().split("T")[0]
      const endDate = new Date(year, getMonthNumber(month) + 1, 0).toISOString().split("T")[0]

      const expenses = await expenseService.getExpenses(userId, startDate, endDate)
      const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0)

      // Get income for the specific month and year
      const income = await incomeService.getIncome(userId, month, year)
      const totalIncome = income.reduce((sum, item) => sum + item.amount, 0)

      return {
        income: totalIncome,
        expenses: totalExpenses,
        savings: totalIncome - totalExpenses,
      }
    } catch (error) {
      console.error(`Error fetching breakdown data for ${month} ${year}:`, error)
      return { income: 0, expenses: 0, savings: 0 }
    }
  }

  // Helper function to convert month name to number (0-based)
  const getMonthNumber = (month: string): number => {
    const months = [
      "january",
      "february",
      "march",
      "april",
      "may",
      "june",
      "july",
      "august",
      "september",
      "october",
      "november",
      "december",
    ]
    return months.indexOf(month.toLowerCase())
  }

  // Update the fetchHistoricalNetWorth function to use this direct method
  const fetchHistoricalNetWorth = async (userId: string) => {
    try {
      setRefreshing(true)

      // Get all monthly income
      const allMonthlyIncome = await incomeService.getAllIncome(userId)

      // Create a map of year-month to income
      const monthlyData = new Map<string, { income: number; expenses: number; monthName: string }>()

      // Process income data to get all the months we need to check
      allMonthlyIncome.forEach((income) => {
        const key = `${income.year}-${income.month}`
        if (!monthlyData.has(key)) {
          monthlyData.set(key, { income: 0, expenses: 0, monthName: income.month })
        }
        const data = monthlyData.get(key)!
        data.income += income.amount
      })

      // For each month with income, directly fetch the expense data
      const keys = Array.from(monthlyData.keys())
      for (const key of keys) {
        const [year, month] = key.split("-")
        const yearNum = Number.parseInt(year)

        // Directly fetch the monthly breakdown data
        const breakdownData = await fetchMonthlyBreakdownData(userId, month, yearNum)

        // Update the expenses in our monthly data map
        const data = monthlyData.get(key)!
        data.expenses = breakdownData.expenses
      }

      // Sort the keys by year and month
      const sortedKeys = Array.from(monthlyData.keys()).sort((a, b) => {
        const [yearA, monthA] = a.split("-")
        const [yearB, monthB] = b.split("-")

        if (yearA !== yearB) {
          return Number.parseInt(yearA) - Number.parseInt(yearB)
        }

        const months = [
          "january",
          "february",
          "march",
          "april",
          "may",
          "june",
          "july",
          "august",
          "september",
          "october",
          "november",
          "december",
        ]

        return months.indexOf(monthA) - months.indexOf(monthB)
      })

      // Calculate cumulative net worth
      let cumulativeNetWorth = 0
      const history: Array<{ month: string; netWorth: number }> = []

      // Also prepare the monthly data for the table
      const monthlyTableData: Array<{
        month: string
        monthName: string
        income: number
        expenses: number
        savings: number
      }> = []

      sortedKeys.forEach((key) => {
        const data = monthlyData.get(key)!
        const monthlySavings = data.income - data.expenses
        cumulativeNetWorth += monthlySavings

        // Extract month for display
        const [year, monthName] = key.split("-")
        const monthAbbr = monthName.substring(0, 3).charAt(0).toUpperCase() + monthName.substring(1, 3)

        history.push({
          month: `${monthAbbr} ${year}`,
          netWorth: cumulativeNetWorth,
        })

        // Add to monthly table data
        monthlyTableData.push({
          month: key,
          monthName: data.monthName,
          income: data.income,
          expenses: data.expenses,
          savings: monthlySavings,
        })
      })

      setNetWorthHistory(history)
      setMonthlyData(monthlyTableData)

      // Set the selected year to the most recent year in the data if not already set
      if (sortedKeys.length > 0) {
        const mostRecentKey = sortedKeys[sortedKeys.length - 1]
        const [mostRecentYear] = mostRecentKey.split("-")
        setSelectedYear(Number.parseInt(mostRecentYear))
      }
    } catch (error) {
      console.error("Error fetching historical data:", error)
      toast.error("Failed to load historical net worth data")
    } finally {
      setRefreshing(false)
    }
  }

  // Calculate totals
  const totalAssets = assets.reduce((sum, asset) => sum + asset.value, 0)
  const totalLiabilities = liabilities.reduce((sum, liability) => sum + liability.value, 0)
  const netWorth = totalAssets - totalLiabilities

  // Add new asset
  const handleAddAsset = async () => {
    if (!user) return
    if (newAsset.name && newAsset.value) {
      try {
        const asset = await assetService.addAsset({
          user_id: user.id,
          name: newAsset.name,
          value: Number(newAsset.value),
          type: newAsset.type,
        })

        setAssets([...assets, asset])
        setNewAsset({ name: "", value: "", type: "cash" })
        toast.success("Asset added successfully")
      } catch (error: any) {
        toast.error("Error adding asset", {
          description: error.message || "Failed to add the asset",
        })
      }
    } else {
      toast.error("Please fill in all fields")
    }
  }

  // Add new liability
  const handleAddLiability = async () => {
    if (!user) return
    if (newLiability.name && newLiability.value) {
      try {
        const liability = await liabilityService.addLiability({
          user_id: user.id,
          name: newLiability.name,
          value: Number(newLiability.value),
          type: newLiability.type,
        })

        setLiabilities([...liabilities, liability])
        setNewLiability({ name: "", value: "", type: "loan" })
        toast.success("Liability added successfully")
      } catch (error: any) {
        toast.error("Error adding liability", {
          description: error.message || "Failed to add the liability",
        })
      }
    } else {
      toast.error("Please fill in all fields")
    }
  }

  // Start editing asset
  const startEditingAsset = (asset: Asset) => {
    setEditingAssetId(asset.id)
    setEditedAsset({
      name: asset.name,
      value: asset.value.toString(),
      type: asset.type,
    })
  }

  // Start editing liability
  const startEditingLiability = (liability: Liability) => {
    setEditingLiabilityId(liability.id)
    setEditedLiability({
      name: liability.name,
      value: liability.value.toString(),
      type: liability.type,
    })
  }

  // Save edited asset
  const saveEditedAsset = async () => {
    if (!editingAssetId) return

    try {
      const updatedAsset = await assetService.updateAsset(editingAssetId, {
        name: editedAsset.name,
        value: Number(editedAsset.value),
        type: editedAsset.type,
      })

      setAssets(assets.map((asset) => (asset.id === editingAssetId ? updatedAsset : asset)))

      setEditingAssetId(null)
      toast.success("Asset updated successfully")
    } catch (error: any) {
      toast.error("Error updating asset", {
        description: error.message || "Failed to update the asset",
      })
    }
  }

  // Save edited liability
  const saveEditedLiability = async () => {
    if (!editingLiabilityId) return

    try {
      const updatedLiability = await liabilityService.updateLiability(editingLiabilityId, {
        name: editedLiability.name,
        value: Number(editedLiability.value),
        type: editedLiability.type,
      })

      setLiabilities(
        liabilities.map((liability) => (liability.id === editingLiabilityId ? updatedLiability : liability)),
      )

      setEditingLiabilityId(null)
      toast.success("Liability updated successfully")
    } catch (error: any) {
      toast.error("Error updating liability", {
        description: error.message || "Failed to update the liability",
      })
    }
  }

  // Cancel editing
  const cancelEditing = (type: "asset" | "liability") => {
    if (type === "asset") {
      setEditingAssetId(null)
    } else {
      setEditingLiabilityId(null)
    }
  }

  // Remove asset
  const handleRemoveAsset = async (id: string) => {
    try {
      await assetService.deleteAsset(id)
      setAssets(assets.filter((asset) => asset.id !== id))
      toast.success("Asset removed successfully")
    } catch (error: any) {
      toast.error("Error removing asset", {
        description: error.message || "Failed to remove the asset",
      })
    }
  }

  // Remove liability
  const handleRemoveLiability = async (id: string) => {
    try {
      await liabilityService.deleteLiability(id)
      setLiabilities(liabilities.filter((liability) => liability.id !== id))
      toast.success("Liability removed successfully")
    } catch (error: any) {
      toast.error("Error removing liability", {
        description: error.message || "Failed to remove the asset",
      })
    }
  }

  // Handle refresh
  const handleRefresh = () => {
    if (user) {
      fetchHistoricalNetWorth(user.id)
    }
  }

  if (userLoading || loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading your financial data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Net Worth Tracker</h1>
        <p className="text-muted-foreground">Track your assets, liabilities, and overall net worth</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Assets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">${totalAssets.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Liabilities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">${totalLiabilities.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card className="col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Worth</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${netWorth.toLocaleString()}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <ArrowUpRight className="mr-1 h-3.5 w-3.5 text-green-500" />
              <span className="text-green-500">2.4%</span>
              <span className="ml-1">from last month</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Net Worth History</CardTitle>
            <CardDescription>Track your net worth growth over time</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            {netWorthHistory.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={netWorthHistory}
                  margin={{
                    top: 10,
                    right: 30,
                    left: 0,
                    bottom: 0,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={(value) => `$${value / 1000}k`} domain={[0, "dataMax + 10000"]} />
                  <Tooltip
                    formatter={(value) => [`$${value.toLocaleString()}`, "Net Worth"]}
                    labelFormatter={(label) => `${label}`}
                  />
                  <Area type="monotone" dataKey="netWorth" stroke="#8884d8" fill="#8884d8" fillOpacity={0.2} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <TrendingUp className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground">No historical data available</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Monthly Savings ({selectedYear})</CardTitle>
            <CardDescription>Track your monthly income, expenses, and savings</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(Number.parseInt(value))}>
              <SelectTrigger className="w-[100px]">
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent>
                {Array.from(new Set(monthlyData.map((item) => item.month.split("-")[0])))
                  .filter((year) => Number(year) >= 2023)
                  .sort()
                  .map((year) => (
                    <SelectItem key={year} value={year}>
                      {year}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={handleRefresh} disabled={refreshing}>
              <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <div className="grid grid-cols-12 gap-4 p-3 font-medium bg-muted/50">
              <div className="col-span-3">Month</div>
              <div className="col-span-3 text-right">Income</div>
              <div className="col-span-3 text-right">Expenses</div>
              <div className="col-span-3 text-right">Savings</div>
            </div>
            <div className="divide-y">
              {monthlyData
                .filter((item) => item.month.startsWith(selectedYear.toString()))
                .sort((a, b) => {
                  const months = [
                    "january",
                    "february",
                    "march",
                    "april",
                    "may",
                    "june",
                    "july",
                    "august",
                    "september",
                    "october",
                    "november",
                    "december",
                  ]
                  return months.indexOf(a.monthName) - months.indexOf(b.monthName)
                })
                .map((item, index) => {
                  const monthName = item.monthName.charAt(0).toUpperCase() + item.monthName.slice(1)
                  return (
                    <div key={index} className="grid grid-cols-12 gap-4 p-3 items-center hover:bg-muted/30">
                      <div className="col-span-3">{monthName}</div>
                      <div className="col-span-3 text-right">${item.income.toLocaleString()}</div>
                      <div className="col-span-3 text-right">
                        {item.expenses === 0 ? (
                          <span className="text-amber-500">$0 (Check Monthly Breakdown)</span>
                        ) : (
                          `$${item.expenses.toLocaleString()}`
                        )}
                      </div>
                      <div
                        className={`col-span-3 text-right font-medium ${item.savings >= 0 ? "text-green-600" : "text-red-500"}`}
                      >
                        ${item.savings.toLocaleString()}
                      </div>
                    </div>
                  )
                })}
              {monthlyData.filter((item) => item.month.startsWith(selectedYear.toString())).length === 0 && (
                <div className="p-4 text-center text-muted-foreground">No data available for {selectedYear}</div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Assets</CardTitle>
            <CardDescription>Add and manage your assets</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-12 gap-4">
                <div className="col-span-5">
                  <Label htmlFor="asset-name">Asset Name</Label>
                  <Input
                    id="asset-name"
                    value={newAsset.name}
                    onChange={(e) => setNewAsset({ ...newAsset, name: e.target.value })}
                    placeholder="e.g., Checking Account"
                  />
                </div>
                <div className="col-span-3">
                  <Label htmlFor="asset-value">Value ($)</Label>
                  <Input
                    id="asset-value"
                    type="number"
                    value={newAsset.value}
                    onChange={(e) => setNewAsset({ ...newAsset, value: e.target.value })}
                    placeholder="10000"
                  />
                </div>
                <div className="col-span-3">
                  <Label htmlFor="asset-type">Type</Label>
                  <Select value={newAsset.type} onValueChange={(value) => setNewAsset({ ...newAsset, type: value })}>
                    <SelectTrigger id="asset-type">
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="investment">Investment</SelectItem>
                      <SelectItem value="property">Property</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-1 flex items-end">
                  <Button onClick={handleAddAsset} size="icon" className="w-full">
                    <PlusCircle className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="rounded-md border">
                <div className="grid grid-cols-12 gap-4 p-3 font-medium bg-muted/50">
                  <div className="col-span-4">Name</div>
                  <div className="col-span-3">Value</div>
                  <div className="col-span-3">Type</div>
                  <div className="col-span-2 text-right">Actions</div>
                </div>
                <div className="divide-y">
                  {assets.map((asset) => (
                    <div key={asset.id} className="grid grid-cols-12 gap-4 p-3 items-center hover:bg-muted/30">
                      {editingAssetId === asset.id ? (
                        // Editing mode
                        <>
                          <div className="col-span-4">
                            <Input
                              value={editedAsset.name}
                              onChange={(e) => setEditedAsset({ ...editedAsset, name: e.target.value })}
                              className="h-8"
                            />
                          </div>
                          <div className="col-span-3">
                            <Input
                              type="number"
                              value={editedAsset.value}
                              onChange={(e) => setEditedAsset({ ...editedAsset, value: e.target.value })}
                              className="h-8"
                            />
                          </div>
                          <div className="col-span-3">
                            <Select
                              value={editedAsset.type}
                              onValueChange={(value) => setEditedAsset({ ...editedAsset, type: value })}
                            >
                              <SelectTrigger className="h-8">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="cash">Cash</SelectItem>
                                <SelectItem value="investment">Investment</SelectItem>
                                <SelectItem value="property">Property</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="col-span-2 flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={saveEditedAsset}
                              className="h-8 w-8 text-green-600"
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => cancelEditing("asset")}
                              className="h-8 w-8 text-red-500"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </>
                      ) : (
                        // Display mode
                        <>
                          <div className="col-span-4">{asset.name}</div>
                          <div className="col-span-3">${asset.value.toLocaleString()}</div>
                          <div className="col-span-3 capitalize">{asset.type}</div>
                          <div className="col-span-2 flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => startEditingAsset(asset)}
                              className="h-8 w-8 text-muted-foreground hover:text-blue-500"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveAsset(asset.id)}
                              className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Liabilities</CardTitle>
            <CardDescription>Add and manage your liabilities</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-12 gap-4">
                <div className="col-span-5">
                  <Label htmlFor="liability-name">Liability Name</Label>
                  <Input
                    id="liability-name"
                    value={newLiability.name}
                    onChange={(e) => setNewLiability({ ...newLiability, name: e.target.value })}
                    placeholder="e.g., Mortgage"
                  />
                </div>
                <div className="col-span-3">
                  <Label htmlFor="liability-value">Value ($)</Label>
                  <Input
                    id="liability-value"
                    type="number"
                    value={newLiability.value}
                    onChange={(e) => setNewLiability({ ...newLiability, value: e.target.value })}
                    placeholder="10000"
                  />
                </div>
                <div className="col-span-3">
                  <Label htmlFor="liability-type">Type</Label>
                  <Select
                    value={newLiability.type}
                    onValueChange={(value) => setNewLiability({ ...newLiability, type: value })}
                  >
                    <SelectTrigger id="liability-type">
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="loan">Loan</SelectItem>
                      <SelectItem value="debt">Debt</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-1 flex items-end">
                  <Button onClick={handleAddLiability} size="icon" className="w-full">
                    <PlusCircle className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="rounded-md border">
                <div className="grid grid-cols-12 gap-4 p-3 font-medium bg-muted/50">
                  <div className="col-span-4">Name</div>
                  <div className="col-span-3">Value</div>
                  <div className="col-span-3">Type</div>
                  <div className="col-span-2 text-right">Actions</div>
                </div>
                <div className="divide-y">
                  {liabilities.map((liability) => (
                    <div key={liability.id} className="grid grid-cols-12 gap-4 p-3 items-center hover:bg-muted/30">
                      {editingLiabilityId === liability.id ? (
                        // Editing mode
                        <>
                          <div className="col-span-4">
                            <Input
                              value={editedLiability.name}
                              onChange={(e) => setEditedLiability({ ...editedLiability, name: e.target.value })}
                              className="h-8"
                            />
                          </div>
                          <div className="col-span-3">
                            <Input
                              type="number"
                              value={editedLiability.value}
                              onChange={(e) => setEditedLiability({ ...editedLiability, value: e.target.value })}
                              className="h-8"
                            />
                          </div>
                          <div className="col-span-3">
                            <Select
                              value={editedLiability.type}
                              onValueChange={(value) => setEditedLiability({ ...editedLiability, type: value })}
                            >
                              <SelectTrigger className="h-8">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="loan">Loan</SelectItem>
                                <SelectItem value="debt">Debt</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="col-span-2 flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={saveEditedLiability}
                              className="h-8 w-8 text-green-600"
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => cancelEditing("liability")}
                              className="h-8 w-8 text-red-500"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </>
                      ) : (
                        // Display mode
                        <>
                          <div className="col-span-4">{liability.name}</div>
                          <div className="col-span-3">${liability.value.toLocaleString()}</div>
                          <div className="col-span-3 capitalize">{liability.type}</div>
                          <div className="col-span-2 flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => startEditingLiability(liability)}
                              className="h-8 w-8 text-muted-foreground hover:text-blue-500"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveLiability(liability.id)}
                              className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}


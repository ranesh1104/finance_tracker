"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PlusCircle, Trash2, TrendingUp, ArrowUpRight, ArrowDownRight } from "lucide-react"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { createClient } from "@/utils/supabase/client"
import { toast } from "sonner"

// Mock data for the charts
const performanceData = [
  { month: "Jan", value: 100 },
  { month: "Feb", value: 105 },
  { month: "Mar", value: 102 },
  { month: "Apr", value: 110 },
  { month: "May", value: 115 },
  { month: "Jun", value: 120 },
  { month: "Jul", value: 125 },
  { month: "Aug", value: 130 },
  { month: "Sep", value: 135 },
]

const allocationData = [
  { name: "Stocks", value: 65 },
  { name: "Bonds", value: 15 },
  { name: "Cash", value: 10 },
  { name: "Real Estate", value: 10 },
]

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"]

// Initial investments
const initialInvestments = [
  { id: 1, name: "VTSAX", type: "Index Fund", value: 45000, shares: 500, costBasis: 40000, return: 12.5 },
  { id: 2, name: "VBTLX", type: "Bond Fund", value: 15000, shares: 300, costBasis: 14500, return: 3.4 },
  { id: 3, name: "AAPL", type: "Stock", value: 10000, shares: 50, costBasis: 8000, return: 25.0 },
  { id: 4, name: "MSFT", type: "Stock", value: 12000, shares: 40, costBasis: 9600, return: 25.0 },
  { id: 5, name: "Real Estate Fund", type: "REIT", value: 8000, shares: 200, costBasis: 7500, return: 6.7 },
]

// Define types for our data
interface AnnualReturnData {
  year: string
  return: number
  color: string
}

export default function InvestmentsPage() {
  const [investments, setInvestments] = useState(initialInvestments)
  const [newInvestment, setNewInvestment] = useState({ name: "", type: "Stock", value: "", shares: "", costBasis: "" })
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  // Calculate totals
  const totalValue = investments.reduce((sum, inv) => sum + inv.value, 0)
  const totalCostBasis = investments.reduce((sum, inv) => sum + inv.costBasis, 0)
  const totalReturn = totalValue - totalCostBasis
  const totalReturnPercentage = (totalReturn / totalCostBasis) * 100

  // Annual returns data with color property
  const annualReturnsData: AnnualReturnData[] = [
    { year: "2020", return: 12, color: "#4ade80" },
    { year: "2021", return: 18, color: "#4ade80" },
    { year: "2022", return: -8, color: "#ef4444" },
    { year: "2023", return: 15, color: "#4ade80" },
    { year: "2024 YTD", return: 6, color: "#4ade80" },
  ]

  // Add new investment
  const handleAddInvestment = async () => {
    if (newInvestment.name && newInvestment.value && newInvestment.shares && newInvestment.costBasis) {
      const value = Number(newInvestment.value)
      const shares = Number(newInvestment.shares)
      const costBasis = Number(newInvestment.costBasis)
      const returnPercentage = ((value - costBasis) / costBasis) * 100

      // In a real app, you would save this to Supabase
      // For now, we'll just update the local state
      setInvestments([
        ...investments,
        {
          id: investments.length + 1,
          name: newInvestment.name,
          type: newInvestment.type,
          value: value,
          shares: shares,
          costBasis: costBasis,
          return: returnPercentage,
        },
      ])
      setNewInvestment({ name: "", type: "Stock", value: "", shares: "", costBasis: "" })
      toast.success("Investment added successfully!")
    } else {
      toast.error("Please fill in all fields.")
    }
  }

  // Remove investment
  const handleRemoveInvestment = (id: number) => {
    setInvestments(investments.filter((inv) => inv.id !== id))
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Investment Portfolio</h1>
        <p className="text-muted-foreground">Track and manage your investment portfolio</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalValue.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cost Basis</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalCostBasis.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Return</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">${totalReturn.toLocaleString()}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <ArrowUpRight className="mr-1 h-3.5 w-3.5 text-green-500" />
              <span className="text-green-500">{totalReturnPercentage.toFixed(2)}%</span>
              <span className="ml-1">return</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Annual Dividend</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$1,850</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <span>Yield: </span>
              <span className="ml-1 text-green-500">2.1%</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="portfolio" className="space-y-4">
        <TabsList>
          <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="allocation">Allocation</TabsTrigger>
        </TabsList>
        <TabsContent value="portfolio" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Investment Holdings</CardTitle>
              <CardDescription>Add and manage your investment holdings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-12 gap-4">
                  <div className="col-span-3">
                    <Label htmlFor="investment-name">Name/Ticker</Label>
                    <Input
                      id="investment-name"
                      value={newInvestment.name}
                      onChange={(e) => setNewInvestment({ ...newInvestment, name: e.target.value })}
                      placeholder="e.g., VTSAX"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="investment-type">Type</Label>
                    <Select
                      value={newInvestment.type}
                      onValueChange={(value) => setNewInvestment({ ...newInvestment, type: value })}
                    >
                      <SelectTrigger id="investment-type">
                        <SelectValue placeholder="Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Stock">Stock</SelectItem>
                        <SelectItem value="ETF">ETF</SelectItem>
                        <SelectItem value="Index Fund">Index Fund</SelectItem>
                        <SelectItem value="Bond Fund">Bond Fund</SelectItem>
                        <SelectItem value="REIT">REIT</SelectItem>
                        <SelectItem value="Crypto">Crypto</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="investment-value">Current Value ($)</Label>
                    <Input
                      id="investment-value"
                      type="number"
                      value={newInvestment.value}
                      onChange={(e) => setNewInvestment({ ...newInvestment, value: e.target.value })}
                      placeholder="10000"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="investment-shares">Shares/Units</Label>
                    <Input
                      id="investment-shares"
                      type="number"
                      value={newInvestment.shares}
                      onChange={(e) => setNewInvestment({ ...newInvestment, shares: e.target.value })}
                      placeholder="100"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="investment-cost">Cost Basis ($)</Label>
                    <Input
                      id="investment-cost"
                      type="number"
                      value={newInvestment.costBasis}
                      onChange={(e) => setNewInvestment({ ...newInvestment, costBasis: e.target.value })}
                      placeholder="9000"
                    />
                  </div>
                  <div className="col-span-1 flex items-end">
                    <Button onClick={handleAddInvestment} size="icon" className="w-full">
                      <PlusCircle className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="rounded-md border">
                  <div className="grid grid-cols-12 gap-4 p-3 font-medium bg-muted/50">
                    <div className="col-span-3">Name/Ticker</div>
                    <div className="col-span-2">Type</div>
                    <div className="col-span-2">Current Value</div>
                    <div className="col-span-1">Shares</div>
                    <div className="col-span-2">Cost Basis</div>
                    <div className="col-span-1">Return</div>
                    <div className="col-span-1"></div>
                  </div>
                  <div className="divide-y">
                    {investments.map((investment) => (
                      <div key={investment.id} className="grid grid-cols-12 gap-4 p-3 items-center">
                        <div className="col-span-3 font-medium">{investment.name}</div>
                        <div className="col-span-2">{investment.type}</div>
                        <div className="col-span-2">${investment.value.toLocaleString()}</div>
                        <div className="col-span-1">{investment.shares}</div>
                        <div className="col-span-2">${investment.costBasis.toLocaleString()}</div>
                        <div className={`col-span-1 ${investment.return >= 0 ? "text-green-600" : "text-red-500"}`}>
                          {investment.return >= 0 ? "+" : ""}
                          {investment.return.toFixed(1)}%
                        </div>
                        <div className="col-span-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveInvestment(investment.id)}
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Portfolio Performance</CardTitle>
              <CardDescription>Track your investment performance over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={performanceData}
                    margin={{
                      top: 5,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`$${value}`, "Portfolio Value"]} />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="value"
                      name="Portfolio Value (thousands)"
                      stroke="#8884d8"
                      activeDot={{ r: 8 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Annual Returns</CardTitle>
                <CardDescription>Your investment returns by year</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={annualReturnsData}
                      margin={{
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="year" />
                      <YAxis tickFormatter={(value) => `${value}%`} />
                      <Tooltip formatter={(value) => [`${value}%`, "Return"]} />
                      <Bar
                        dataKey="return"
                        name="Annual Return"
                        fill="#8884d8"
                        // Use this approach to set the fill color based on the data
                        fillOpacity={0} // Make the default fill transparent
                        stroke="none"
                      >
                        {annualReturnsData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
                <CardDescription>Key performance indicators for your portfolio</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">1-Year Return</span>
                      <span className="text-sm font-medium text-green-600">+15.2%</span>
                    </div>
                    <div className="h-2 w-full bg-muted rounded-full">
                      <div className="h-2 bg-green-500 rounded-full" style={{ width: "75%" }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">3-Year Return (Annualized)</span>
                      <span className="text-sm font-medium text-green-600">+8.3%</span>
                    </div>
                    <div className="h-2 w-full bg-muted rounded-full">
                      <div className="h-2 bg-green-500 rounded-full" style={{ width: "60%" }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">5-Year Return (Annualized)</span>
                      <span className="text-sm font-medium text-green-600">+10.5%</span>
                    </div>
                    <div className="h-2 w-full bg-muted rounded-full">
                      <div className="h-2 bg-green-500 rounded-full" style={{ width: "70%" }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">Sharpe Ratio</span>
                      <span className="text-sm font-medium">1.2</span>
                    </div>
                    <div className="h-2 w-full bg-muted rounded-full">
                      <div className="h-2 bg-blue-500 rounded-full" style={{ width: "65%" }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">Volatility</span>
                      <span className="text-sm font-medium">12.8%</span>
                    </div>
                    <div className="h-2 w-full bg-muted rounded-full">
                      <div className="h-2 bg-amber-500 rounded-full" style={{ width: "40%" }}></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="allocation" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Asset Allocation</CardTitle>
                <CardDescription>Current distribution of your investments</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={allocationData}
                        cx="50%"
                        cy="50%"
                        labelLine={true}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {allocationData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value}%`, "Allocation"]} />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Target Allocation</CardTitle>
                <CardDescription>Your target investment distribution</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">Stocks</span>
                      <span className="text-sm font-medium">70% (Target: 70%)</span>
                    </div>
                    <div className="h-2 w-full bg-muted rounded-full">
                      <div className="h-2 bg-blue-500 rounded-full" style={{ width: "70%" }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">Bonds</span>
                      <span className="text-sm font-medium">15% (Target: 20%)</span>
                    </div>
                    <div className="h-2 w-full bg-muted rounded-full">
                      <div className="h-2 bg-green-500 rounded-full" style={{ width: "15%" }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">Cash</span>
                      <span className="text-sm font-medium">10% (Target: 5%)</span>
                    </div>
                    <div className="h-2 w-full bg-muted rounded-full">
                      <div className="h-2 bg-yellow-500 rounded-full" style={{ width: "10%" }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">Real Estate</span>
                      <span className="text-sm font-medium">5% (Target: 5%)</span>
                    </div>
                    <div className="h-2 w-full bg-muted rounded-full">
                      <div className="h-2 bg-orange-500 rounded-full" style={{ width: "5%" }}></div>
                    </div>
                  </div>
                </div>
                <div className="mt-6">
                  <h3 className="text-sm font-medium mb-2">Rebalancing Recommendations</h3>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center text-amber-600">
                      <ArrowUpRight className="mr-2 h-4 w-4" />
                      <span>Increase bond allocation by 5%</span>
                    </li>
                    <li className="flex items-center text-amber-600">
                      <ArrowDownRight className="mr-2 h-4 w-4" />
                      <span>Decrease cash allocation by 5%</span>
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}


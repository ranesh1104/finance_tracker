"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PiggyBank, TrendingUp, Calendar, DollarSign } from 'lucide-react'
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { createClient } from "@/utils/supabase/client"

export default function RetirementPage() {
  // Retirement calculator state
  const [currentAge, setCurrentAge] = useState(30)
  const [retirementAge, setRetirementAge] = useState(65)
  const [lifeExpectancy, setLifeExpectancy] = useState(90)
  const [currentSavings, setCurrentSavings] = useState(100000)
  const [annualContribution, setAnnualContribution] = useState(20000)
  const [expectedReturn, setExpectedReturn] = useState(7)
  const [inflationRate, setInflationRate] = useState(2.5)
  const [annualExpenses, setAnnualExpenses] = useState(60000)
  const [socialSecurity, setSocialSecurity] = useState(24000)
  const [otherIncome, setOtherIncome] = useState(0)
  const [withdrawalRate, setWithdrawalRate] = useState(4)

  // Calculate retirement projections
  const calculateRetirementProjections = () => {
    const yearsToRetirement = retirementAge - currentAge
    const yearsInRetirement = lifeExpectancy - retirementAge
    
    // Calculate future value of current savings
    const futureValueCurrentSavings = currentSavings * Math.pow(1 + expectedReturn / 100, yearsToRetirement)
    
    // Calculate future value of annual contributions
    let futureValueContributions = 0
    for (let i = 0; i < yearsToRetirement; i++) {
      futureValueContributions += annualContribution * Math.pow(1 + expectedReturn / 100, i)
    }
    
    // Total retirement savings
    const totalRetirementSavings = futureValueCurrentSavings + futureValueContributions
    
    // Calculate inflation-adjusted annual expenses in retirement
    const inflationAdjustedExpenses = annualExpenses * Math.pow(1 + inflationRate / 100, yearsToRetirement)
    
    // Calculate annual income needed in retirement
    const annualIncomeNeeded = inflationAdjustedExpenses - socialSecurity - otherIncome
    
    // Calculate sustainable withdrawal amount
    const sustainableWithdrawal = totalRetirementSavings * (withdrawalRate / 100)
    
    // Calculate retirement income surplus/deficit
    const retirementIncomeSurplus = sustainableWithdrawal - annualIncomeNeeded
    
    // Calculate retirement readiness percentage
    const retirementReadiness = Math.min(100, Math.max(0, (sustainableWithdrawal / annualIncomeNeeded) * 100))
    
    // Generate projection data for chart
    const projectionData = []
    let currentSavingsValue = currentSavings
    
    // Pre-retirement phase
    for (let i = 0; i <= yearsToRetirement; i++) {
      const age = currentAge + i
      if (i > 0) {
        currentSavingsValue = currentSavingsValue * (1 + expectedReturn / 100) + annualContribution
      }
      projectionData.push({
        age,
        savings: Math.round(currentSavingsValue),
        phase: "Accumulation",
      })
    }
    
    // Retirement phase
    let retirementSavings = currentSavingsValue
    for (let i = 1; i <= yearsInRetirement; i++) {
      const age = retirementAge + i
      const withdrawalAmount = retirementSavings * (withdrawalRate / 100)
      retirementSavings = (retirementSavings - withdrawalAmount) * (1 + expectedReturn / 100)
      projectionData.push({
        age,
        savings: Math.round(retirementSavings),
        phase: "Distribution",
      })
    }
    
    return {
      totalRetirementSavings,
      inflationAdjustedExpenses,
      annualIncomeNeeded,
      sustainableWithdrawal,
      retirementIncomeSurplus,
      retirementReadiness,
      projectionData,
    }
  }

  const {
    totalRetirementSavings,
    inflationAdjustedExpenses,
    annualIncomeNeeded,
    sustainableWithdrawal,
    retirementIncomeSurplus,
    retirementReadiness,
    projectionData,
  } = calculateRetirementProjections()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Retirement Planning</h1>
        <p className="text-muted-foreground">Plan and track your progress toward retirement</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Retirement Savings</CardTitle>
            <PiggyBank className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalRetirementSavings.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
            <p className="text-xs text-muted-foreground">Projected at retirement</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Annual Income Needed</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${annualIncomeNeeded.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
            <p className="text-xs text-muted-foreground">In retirement (today's dollars)</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sustainable Withdrawal</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${sustainableWithdrawal.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
            <p className="text-xs text-muted-foreground">Annual safe withdrawal amount</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Retirement Readiness</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{retirementReadiness.toFixed(0)}%</div>
            <div className="h-2 w-full bg-muted rounded-full mt-2">
              <div
                className={`h-2 rounded-full ${
                  retirementReadiness >= 100 ? "bg-green-500" : retirementReadiness >= 75 ? "bg-yellow-500" : "bg-red-500"
                }`}
                style={{ width: `${Math.min(100, retirementReadiness)}%` }}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Retirement Projection</CardTitle>
            <CardDescription>Projected growth of your retirement savings over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={projectionData}
                  margin={{
                    top: 10,
                    right: 30,
                    left: 0,
                    bottom: 0,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="age" label={{ value: "Age", position: "insideBottomRight", offset: -10 }} />
                  <YAxis tickFormatter={(value) => `$${value / 1000}k`} />
                  <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, "Savings"]} labelFormatter={(value) => `Age: ${value}`} />
                  <Legend />
                  <Area type="monotone" dataKey="savings" name="Retirement Savings" stroke="#8884d8" fill="#8884d8" fillOpacity={0.3} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Retirement Summary</CardTitle>
            <CardDescription>Key metrics for your retirement plan</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm">
                  <span>Years until retirement:</span>
                  <span className="font-medium">{retirementAge - currentAge}</span>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm">
                  <span>Years in retirement:</span>
                  <span className="font-medium">{lifeExpectancy - retirementAge}</span>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm">
                  <span>Monthly income in retirement:</span>
                  <span className="font-medium">${(sustainableWithdrawal / 12).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm">
                  <span>Income surplus/deficit:</span>
                  <span className={`font-medium ${retirementIncomeSurplus >= 0 ? "text-green-600" : "text-red-500"}`}>
                    ${retirementIncomeSurplus.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </span>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm">
                  <span>Social Security estimate:</span>
                  <span className="font-medium">${socialSecurity.toLocaleString()}/year</span>
                </div>
              </div>
              <div className="pt-2">
                <div className="text-sm font-medium mb-2">Retirement Status:</div>
                <div className={`text-sm ${
                  retirementReadiness >= 100 ? "text-green-600" : retirementReadiness >= 75 ? "text-yellow-600" : "text-red-500"
                }`}>
                  {retirementReadiness >= 100
                    ? "On Track: Your retirement plan is fully funded."
                    : retirementReadiness >= 75
                    ? "Almost There: You're close to your retirement goal."
                    : "Needs Attention: Consider increasing savings or adjusting your plan."}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="calculator" className="space-y-4">
        <TabsList>
          <TabsTrigger value="calculator">Calculator</TabsTrigger>
          <TabsTrigger value="assumptions">Assumptions</TabsTrigger>
          <TabsTrigger value="strategies">Strategies</TabsTrigger>
        </TabsList>
        <TabsContent value="calculator" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Retirement Calculator</CardTitle>
              <CardDescription>Adjust your retirement plan parameters</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="current-age">Current Age: {currentAge}</Label>
                  <Slider
                    id="current-age"
                    min={18}
                    max={80}
                    step={1}
                    value={[currentAge]}
                    onValueChange={(value) => setCurrentAge(value[0])}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="retirement-age">Retirement Age: {retirementAge}</Label>
                  <Slider
                    id="retirement-age"
                    min={Math.max(currentAge + 1, 50)}
                    max={80}
                    step={1}
                    value={[retirementAge]}
                    onValueChange={(value) => setRetirementAge(value[0])}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="life-expectancy">Life Expectancy: {lifeExpectancy}</Label>
                  <Slider
                    id="life-expectancy"
                    min={Math.max(retirementAge + 1, 70)}
                    max={110}
                    step={1}
                    value={[lifeExpectancy]}
                    onValueChange={(value) => setLifeExpectancy(value[0])}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="current-savings">Current Retirement Savings ($)</Label>
                  <Input
                    id="current-savings"
                    type="number"
                    value={currentSavings}
                    onChange={(e) => setCurrentSavings(Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="annual-contribution">Annual Contribution ($)</Label>
                  <Input
                    id="annual-contribution"
                    type="number"
                    value={annualContribution}
                    onChange={(e) => setAnnualContribution(Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expected-return">Expected Return (%): {expectedReturn}%</Label>
                  <Slider
                    id="expected-return"
                    min={1}
                    max={12}
                    step={0.1}
                    value={[expectedReturn]}
                    onValueChange={(value) => setExpectedReturn(value[0])}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="inflation-rate">Inflation Rate (%): {inflationRate}%</Label>
                  <Slider
                    id="inflation-rate"
                    min={0}
                    max={8}
                    step={0.1}
                    value={[inflationRate]}
                    onValueChange={(value) => setInflationRate(value[0])}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="annual-expenses">Annual Expenses in Retirement ($)</Label>
                  <Input
                    id="annual-expenses"
                    type="number"
                    value={annualExpenses}
                    onChange={(e) => setAnnualExpenses(Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="social-security">Social Security Income ($)</Label>
                  <Input
                    id="social-security"
                    type="number"
                    value={socialSecurity}
                    onChange={(e) => setSocialSecurity(Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="other-income">Other Retirement Income ($)</Label>
                  <Input
                    id="other-income"
                    type="number"
                    value={otherIncome}
                    onChange={(e) => setOtherIncome(Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="withdrawal-rate">Withdrawal Rate (%): {withdrawalRate}%</Label>
                  <Slider
                    id="withdrawal-rate"
                    min={2}
                    max={8}
                    step={0.1}
                    value={[withdrawalRate]}
                    onValueChange={(value) => setWithdrawalRate(value[0])}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="assumptions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Retirement Assumptions</CardTitle>
              <CardDescription>Understanding the assumptions behind your retirement calculations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium mb-2">Investment Return</h3>
                  <p className="text-sm text-muted-foreground">
                    The calculator assumes a constant annual return of {expectedReturn}% on your investments. In reality, investment returns fluctuate year to year. Consider this a long-term average return.
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium mb-2">Inflation</h3>
                  <p className="text-sm text-muted-foreground">
                    An inflation rate of {inflationRate}% is used to calculate the future purchasing power of your money. This affects how much income you'll need in retirement.
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium mb-2">Withdrawal Rate</h3>
                  <p className="text-sm text-muted-foreground">
                    The {withdrawalRate}% withdrawal rate is based on historical studies suggesting that withdrawing this percentage of your portfolio annually provides a high probability of not running out of money during retirement.
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium mb-2">Social Security</h3>
                  <p className="text-sm text-muted-foreground">
                    The calculator uses your provided estimate of ${socialSecurity.toLocaleString()} per year in Social Security benefits. For a more accurate estimate, visit the Social Security Administration website.
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium mb-2">Life Expectancy</h3>
                  <p className="text-sm text-muted-foreground">
                    The calculator plans for you to live until age {lifeExpectancy}. It's generally recommended to plan for a longer life expectancy to avoid outliving your savings.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="strategies" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Retirement Strategies</CardTitle>
              <CardDescription>Ways to improve your retirement outlook</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium mb-2">Increase Savings Rate</h3>
                  <p className="text-sm text-muted-foreground">
                    Increasing your annual contribution by just $2,000 per year could add approximately ${(2000 * (retirementAge - currentAge) * (1 + expectedReturn / 200)).toLocaleString(undefined, { maximumFractionDigits: 0 })} to your retirement savings.
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium mb-2">Delay Retirement</h3>
                  <p className="text-sm text-muted-foreground">
                    Delaying retirement by 3 years would increase your savings by approximately ${(totalRetirementSavings * 0.2).toLocaleString(undefined, { maximumFractionDigits: 0 })} and reduce the number of years you need to fund in retirement.
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium mb-2">Optimize Investment Strategy</h3>
                  <p className="text-sm text-muted-foreground">
                    Increasing your investment return by 1% could add approximately ${(totalRetirementSavings * 0.3).toLocaleString(undefined, { maximumFractionDigits: 0 })} to your retirement savings. Consider reviewing your asset allocation.
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium mb-2">Reduce Retirement Expenses</h3>
                  <p className="text-sm text-muted-foreground">
                    Reducing your planned retirement expenses by 10% would improve your retirement readiness by approximately {Math.min(100, retirementReadiness * 1.1 - retirementReadiness).toFixed(0)}%.
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium mb-2">Maximize Tax-Advantaged Accounts</h3>
                  <p className="text-sm text-muted-foreground">
                    Ensure you're maximizing contributions to tax-advantaged accounts like 401(k)s, IRAs, and HSAs to reduce taxes and boost savings.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

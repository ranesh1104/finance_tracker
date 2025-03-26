'use client'

import type React from 'react'
import { useState, useMemo } from 'react'
import Papa from 'papaparse'
import { Sankey, Tooltip } from 'recharts'

type IncomeEntry = {
  type: string
  amount: string
}

type ExpenseRow = {
  [key: string]: string
}

const classifyNeedWant = (category: string): 'Need' | 'Want' | 'Unknown' => {
  const lower = category.toLowerCase()
  if (
    ['rent', 'grocer', 'gas', 'electric', 'wifi', 'insurance', 'student', 'phone', 'car'].some((k) =>
      lower.includes(k)
    )
  )
    return 'Need'
  if (
    ['netflix', 'spotify', 'entertain', 'amazon', 'dine', 'misc', 'hotpot', 'gift', 'cat', 'church', 'date'].some((k) =>
      lower.includes(k)
    )
  )
    return 'Want'
  return 'Unknown'
}

const getNodeColor = (name: string): string => {
  if (name === 'Income') return '#3b82f6'
  if (name === 'Saved') return '#22c55e'
  if (name === 'Need') return '#14b8a6'
  if (name === 'Want') return '#f97316'

  const pastelColors = ['#facc15', '#c084fc', '#60a5fa', '#f472b6', '#fcd34d']
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  const index = Math.abs(hash) % pastelColors.length
  return pastelColors[index]
}

const CustomNode = ({ x, y, width, height, payload }: {
  x: number
  y: number
  width: number
  height: number
  payload: { name: string }
}) => {
  const color = getNodeColor(payload.name)
  return (
    <g>
      <rect x={x} y={y} width={width} height={height} fill={color} stroke="#1e293b" strokeWidth={0.5} rx={3} />
      <text x={x + width + 6} y={y + height / 2} dy="0.35em" fill="#1f2937" fontSize={12}>{payload.name}</text>
    </g>
  )
}

export default function Home() {

  const [predictionResult, setPredictionResult] = useState<null | {
    predicted_investment: number
    savings: number
    investment_ratio: number
    total_expenses: number
  }>(null)
  
  const [loadingPrediction, setLoadingPrediction] = useState(false)

  const handlePredict = async () => {
    if (!csvFile || totalIncome === 0) return alert("Please upload a CSV and enter income.")
  
    const formData = new FormData()
    formData.append("total_income", totalIncome.toString())
    formData.append("file", csvFile)
  
    setLoadingPrediction(true)
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_FASTAPI_URL}/predict`, {
        method: "POST",
        body: formData,
      })
  
      const result = await response.json()
      setPredictionResult(result)
    } catch (err) {
      console.error("Prediction error:", err)
      alert("Something went wrong during prediction.")
    } finally {
      setLoadingPrediction(false)
    }
  }
  
  
  const [incomeList, setIncomeList] = useState<IncomeEntry[]>([{ type: '', amount: '' }])
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [parsedData, setParsedData] = useState<ExpenseRow[]>([])

  const handleIncomeChange = (index: number, field: keyof IncomeEntry, value: string) => {
    const updated = [...incomeList]
    updated[index][field] = value
    setIncomeList(updated)
  }

  const handleAddIncome = () => {
    setIncomeList([...incomeList, { type: '', amount: '' }])
  }

  const handleRemoveIncome = (index: number) => {
    setIncomeList(incomeList.filter((_, i) => i !== index))
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setCsvFile(file)
      Papa.parse<ExpenseRow>(file, {
        header: true,
        skipEmptyLines: true,
        complete: (result) => setParsedData(result.data),
      })
    }
  }

  const totalIncome = incomeList.reduce((sum, entry) => sum + (Number.parseFloat(entry.amount) || 0), 0)
  const totalExpenses = parsedData.reduce((sum, row) => sum + Number.parseFloat(row['Amount Paid']?.replace(/[$,]/g, '') || '0'), 0)
  const percentSaved = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{
    payload: {
      sourceName: string
      targetName: string
      value: number
    }
  }> }) => {
    if (active && payload?.length && payload[0].payload) {
      const { sourceName, targetName, value } = payload[0].payload
      const percent = totalIncome > 0 ? (value / totalIncome) * 100 : 0
      return (
        <div className="bg-white border border-gray-200 rounded p-2 shadow text-sm text-gray-800">
          <div><strong>{sourceName} → {targetName}</strong></div>
          <div>💵 ${value.toFixed(2)}</div>
          <div>📊 {percent.toFixed(1)}%</div>
        </div>
      )
    }
    return null
  }

  const sankeyData = useMemo(() => {
    const nodes: { name: string }[] = []
    const nodeMap = new Map<string, number>()
    let nodeId = 0

    const addNode = (name: string) => {
      if (!nodeMap.has(name)) {
        nodeMap.set(name, nodeId++)
        nodes.push({ name })
      }
    }

    incomeList.forEach((income) => {
      if (income.type && parseFloat(income.amount) > 0) {
        addNode(income.type)
      }
    })

    addNode('Income')
    addNode('Need')
    addNode('Want')
    addNode('Saved')

    const categoryTotals: Record<string, { amount: number; group: 'Need' | 'Want' | 'Unknown' }> = {}
    parsedData.forEach((row) => {
      const rawCategory = row['Category']?.trim() || 'Unknown'
      const amount = Number.parseFloat(row['Amount Paid']?.replace(/[$,]/g, '') || '0')
      const group = classifyNeedWant(rawCategory)
      if (!categoryTotals[rawCategory]) {
        categoryTotals[rawCategory] = { amount: 0, group }
      }
      categoryTotals[rawCategory].amount += amount
    })

    Object.keys(categoryTotals).forEach((cat) => addNode(cat))

    // const reverseNodeMap = Object.fromEntries(Array.from(nodeMap.entries()).map(([k, v]) => [v, k]))

    const links: {
      source: number
      target: number
      value: number
      sourceName: string
      targetName: string
    }[] = []

    incomeList.forEach((income) => {
      if (income.type && parseFloat(income.amount) > 0) {
        links.push({
          source: nodeMap.get(income.type)!,
          target: nodeMap.get('Income')!,
          value: parseFloat(income.amount),
          sourceName: income.type,
          targetName: 'Income',
        })
      }
    })

    const grouped = { Need: 0, Want: 0 }
    Object.values(categoryTotals).forEach((c) => {
      if (c.group === 'Need' || c.group === 'Want') grouped[c.group] += c.amount
    })
    Object.entries(grouped).forEach(([group, value]) => {
      if (value > 0) {
        links.push({
          source: nodeMap.get('Income')!,
          target: nodeMap.get(group)!,
          value,
          sourceName: 'Income',
          targetName: group,
        })
      }
    })

    const saved = totalIncome - totalExpenses
    if (saved > 0) {
      links.push({
        source: nodeMap.get('Income')!,
        target: nodeMap.get('Saved')!,
        value: saved,
        sourceName: 'Income',
        targetName: 'Saved',
      })
    }

    Object.entries(categoryTotals).forEach(([category, data]) => {
      if (data.group !== 'Unknown') {
        links.push({
          source: nodeMap.get(data.group)!,
          target: nodeMap.get(category)!,
          value: data.amount,
          sourceName: data.group,
          targetName: category,
        })
      }
    })

    return { nodes, links }
  }, [incomeList, parsedData, totalIncome, totalExpenses])

  return (
    <main className="min-h-screen p-8 bg-gray-50 text-gray-800">
      <div className="max-w-5xl mx-auto space-y-8">
        <h1 className="text-2xl font-bold">📊 Personal Finance Tracker</h1>

        <div>
          <h2 className="text-xl font-semibold mb-2">Income Sources</h2>
          {incomeList.map((entry, index) => (
            <div key={index} className="flex gap-4 mb-2 items-center">
              <input
                type="text"
                placeholder="Income Type (e.g. Salary)"
                value={entry.type}
                onChange={(e) => handleIncomeChange(index, 'type', e.target.value)}
                className="flex-1 p-2 border rounded"
              />
              <input
                type="number"
                placeholder="Amount"
                value={entry.amount}
                onChange={(e) => handleIncomeChange(index, 'amount', e.target.value)}
                className="w-40 p-2 border rounded"
              />
              {incomeList.length > 1 && (
                <button
                  onClick={() => handleRemoveIncome(index)}
                  className="text-red-600 hover:text-red-800 text-lg"
                  title="Remove"
                >
                  ❌
                </button>
              )}
            </div>
          ))}
          <button onClick={handleAddIncome} className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
            ➕ Add Income
          </button>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">Upload Expenses CSV</h2>
          <input type="file" accept=".csv" onChange={handleFileUpload} className="border p-2 rounded w-full" />
          {csvFile && <p className="mt-2 text-sm text-green-600">✅ Uploaded: {csvFile.name}</p>}
        </div>

        {parsedData.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
            <div className="p-4 bg-white shadow rounded">
              <h3 className="text-sm text-gray-500">Total Income</h3>
              <p className="text-xl font-bold">${totalIncome.toFixed(2)}</p>
            </div>
            <div className="p-4 bg-white shadow rounded">
              <h3 className="text-sm text-gray-500">Total Expenses</h3>
              <p className="text-xl font-bold">${totalExpenses.toFixed(2)}</p>
            </div>
            <div className="p-4 bg-white shadow rounded">
              <h3 className="text-sm text-gray-500">% Saved</h3>
              <p className="text-xl font-bold">{percentSaved.toFixed(1)}%</p>
            </div>
          </div>
        )}

        {parsedData.length > 0 && (
          <div className="mt-8">
            <h2 className="text-xl font-semibold mb-2">Income → Group → Category Flow</h2>
            <div className="w-full h-[600px] overflow-y-auto overflow-x-auto bg-white shadow rounded p-4">
              <Sankey
                width={1000}
                height={500}
                data={sankeyData}
                nameKey="name"
                node={(nodeProps) => <CustomNode {...nodeProps} />}
                link={{ stroke: '#cbd5e1', strokeOpacity: 0.4 }}
                margin={{ top: 20, right: 120, bottom: 20, left: 20 }}
              >
                <Tooltip content={<CustomTooltip />} />
              </Sankey>
            </div>
          </div>
        )}

        {parsedData.length > 0 && (
          <div className="mt-8">
            <button
              onClick={handlePredict}
              disabled={loadingPrediction}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              {loadingPrediction ? "Predicting..." : "📈 Predict Investment"}
            </button>

            {predictionResult && (
              <div className="mt-4 p-4 bg-white rounded shadow text-gray-800">
                <h3 className="text-lg font-semibold mb-2">📊 Prediction Results</h3>
                <p>📥 Savings: ${predictionResult.savings.toFixed(2)}</p>
                <p>📈 Predicted Investment: ${predictionResult.predicted_investment.toFixed(2)}</p>
                <p>💼 Investment Ratio: {predictionResult.investment_ratio * 100}%</p>
              </div>
            )}
          </div>
        )}

      </div>
    </main>
  )
}
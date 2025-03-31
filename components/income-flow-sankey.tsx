"use client"

import { useMemo } from "react"
import { ResponsiveContainer, Sankey, Tooltip, Rectangle, Layer } from "recharts"

interface IncomeFlowSankeyProps {
  income: Array<{
    source: string
    amount: number
  }>
  expenses: Array<{
    category: string
    total: number
    type?: "need" | "want"
  }>
  savings: number
}

// Helper function to classify expenses as needs or wants
const classifyNeedWant = (category: string): "need" | "want" => {
  const lower = category.toLowerCase()
  if (
    [
      "rent",
      "mortgage",
      "grocer",
      "gas",
      "electric",
      "wifi",
      "insurance",
      "student",
      "phone",
      "car",
      "utilities",
      "healthcare",
      "water",
    ].some((k) => lower.includes(k))
  )
    return "need"
  return "want"
}

// Custom node component
const CustomNode = (props: any) => {
  const { x, y, width, height, index, payload } = props
  const isMainNode = ["income", "need", "want", "saved"].includes(payload.name.toLowerCase())

  // Colors for different node types
  const getNodeColor = (name: string) => {
    const lowerName = name.toLowerCase()
    if (lowerName === "income") return "#dbeafe" // blue-100
    if (lowerName === "saved") return "#dcfce7" // green-100
    if (lowerName === "need") return "#ffedd5" // orange-100
    if (lowerName === "want") return "#f3e8ff" // purple-100

    // For expense categories
    if (classifyNeedWant(name) === "need") {
      return "#fff7ed" // orange-50
    } else {
      return "#faf5ff" // purple-50
    }
  }

  return (
    <Layer key={`CustomNode${index}`}>
      <Rectangle
        x={x}
        y={y}
        width={width}
        height={height}
        fill={getNodeColor(payload.name)}
        fillOpacity={0.9}
        stroke="#e2e8f0"
        strokeWidth={1}
        radius={2}
      />
      <text
        textAnchor="middle"
        x={x + width / 2}
        y={y + height / 2}
        fontSize={12}
        fontWeight={isMainNode ? "bold" : "normal"}
        fill="#334155"
      >
        {payload.name}
      </text>
    </Layer>
  )
}

// Custom link component
const CustomLink = (props: any) => {
  const { sourceX, targetX, sourceY, targetY, sourceControlX, targetControlX, linkWidth, index, payload } = props

  // Get link color based on source
  const getLinkColor = (sourceName: string) => {
    const lowerName = sourceName.toLowerCase()
    if (lowerName === "income") return "rgba(147, 197, 253, 0.6)" // blue-300
    if (lowerName === "saved") return "rgba(134, 239, 172, 0.6)" // green-300
    if (lowerName === "need") return "rgba(253, 186, 116, 0.6)" // orange-300
    if (lowerName === "want") return "rgba(216, 180, 254, 0.6)" // purple-300
    return "rgba(191, 219, 254, 0.6)" // default blue-200
  }

  const path = `
    M${sourceX},${sourceY}
    C${sourceControlX},${sourceY} ${targetControlX},${targetY} ${targetX},${targetY}
  `

  return (
    <path
      d={path}
      fill="none"
      stroke={getLinkColor(payload.source.name)}
      strokeWidth={Math.max(1, linkWidth)}
      strokeOpacity={0.8}
    />
  )
}

// Custom tooltip
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const { source, target, value } = payload[0]
    return (
      <div className="bg-white p-2 border border-gray-200 rounded shadow-sm text-sm">
        <p className="font-medium">{`${source.name} → ${target.name}`}</p>
        <p>${value.toLocaleString()}</p>
      </div>
    )
  }
  return null
}

export function IncomeFlowSankey({ income, expenses, savings }: IncomeFlowSankeyProps) {
  // Process data for Sankey diagram
  const sankeyData = useMemo(() => {
    // Create nodes
    const nodes = [{ name: "Income" }]

    // Add income sources as nodes
    income.forEach((source) => {
      if (source.amount > 0) {
        nodes.push({ name: source.source })
      }
    })

    // Add main category nodes
    nodes.push({ name: "Need" })
    nodes.push({ name: "Want" })
    nodes.push({ name: "Saved" })

    // Add expense categories as nodes (top expenses only)
    const topExpenses = [...expenses].sort((a, b) => b.total - a.total).slice(0, 10)

    topExpenses.forEach((expense) => {
      nodes.push({ name: expense.category })
    })

    // Create links
    const links = []

    // Links from income sources to Income node
    income.forEach((source) => {
      if (source.amount > 0) {
        links.push({
          source: nodes.findIndex((n) => n.name === source.source),
          target: 0, // Income node
          value: source.amount,
        })
      }
    })

    // Calculate totals for needs and wants
    const needsExpenses = expenses.filter((e) => e.type === "need" || classifyNeedWant(e.category) === "need")
    const wantsExpenses = expenses.filter((e) => e.type === "want" || classifyNeedWant(e.category) === "want")

    const needsTotal = needsExpenses.reduce((sum, e) => sum + e.total, 0)
    const wantsTotal = wantsExpenses.reduce((sum, e) => sum + e.total, 0)

    // Links from Income to need/want/saved
    if (needsTotal > 0) {
      links.push({
        source: 0, // Income node
        target: nodes.findIndex((n) => n.name === "Need"),
        value: needsTotal,
      })
    }

    if (wantsTotal > 0) {
      links.push({
        source: 0, // Income node
        target: nodes.findIndex((n) => n.name === "Want"),
        value: wantsTotal,
      })
    }

    if (savings > 0) {
      links.push({
        source: 0, // Income node
        target: nodes.findIndex((n) => n.name === "Saved"),
        value: savings,
      })
    }

    // Links from need/want to specific categories
    const needIndex = nodes.findIndex((n) => n.name === "Need")
    const wantIndex = nodes.findIndex((n) => n.name === "Want")

    topExpenses.forEach((expense) => {
      const categoryIndex = nodes.findIndex((n) => n.name === expense.category)
      const isNeed = expense.type === "need" || classifyNeedWant(expense.category) === "need"

      links.push({
        source: isNeed ? needIndex : wantIndex,
        target: categoryIndex,
        value: expense.total,
      })
    })

    return { nodes, links }
  }, [income, expenses, savings])

  // If no data, show a message
  const totalIncome = income.reduce((sum, item) => sum + item.amount, 0)
  if (totalIncome === 0) {
    return (
      <div className="flex items-center justify-center h-[400px] text-muted-foreground">
        <p>Add income and expenses to see your money flow visualization</p>
      </div>
    )
  }

  return (
    <div className="w-full h-[400px]">
      <ResponsiveContainer width="100%" height="100%">
        <Sankey
          data={sankeyData}
          node={<CustomNode />}
          link={<CustomLink />}
          margin={{ top: 20, right: 50, bottom: 20, left: 50 }}
          nodePadding={20}
          nodeWidth={10}
          iterations={64}
        >
          <Tooltip content={<CustomTooltip />} />
        </Sankey>
      </ResponsiveContainer>
    </div>
  )
}


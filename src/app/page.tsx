import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChevronRight, BarChart3, PiggyBank, TrendingUp, Shield } from "lucide-react"

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="border-b">
        <div className="container flex h-16 items-center justify-between py-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">FinanceTrack</span>
          </div>
          <nav className="hidden md:flex gap-6">
            <Link href="#features" className="text-sm font-medium hover:underline underline-offset-4">
              Features
            </Link>
            <Link href="#pricing" className="text-sm font-medium hover:underline underline-offset-4">
              Pricing
            </Link>
            <Link href="#faq" className="text-sm font-medium hover:underline underline-offset-4">
              FAQ
            </Link>
          </nav>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="outline">Log in</Button>
            </Link>
            <Link href="/signup">
              <Button>Sign up</Button>
            </Link>
          </div>
        </div>
      </header>
      <main className="flex-1">
        <section className="py-12 md:py-24 lg:py-32 bg-muted/50">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 items-center">
              <div className="space-y-4">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                  Take control of your financial future
                </h1>
                <p className="text-muted-foreground md:text-xl">
                  Track your net worth, monitor monthly spending, and plan for retirement with our all-in-one financial
                  dashboard powered by machine learning.
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Link href="/signup">
                    <Button size="lg" className="w-full sm:w-auto">
                      Get Started
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href="#demo">
                    <Button size="lg" variant="outline" className="w-full sm:w-auto">
                      View Demo
                    </Button>
                  </Link>
                </div>
              </div>
              <div className="relative lg:pl-6">
                <div className="relative overflow-hidden rounded-xl border bg-background p-2 shadow-lg">
                  <div className="rounded-md bg-muted p-4 h-[400px] flex items-center justify-center">
                    <div className="grid grid-cols-2 gap-4 w-full max-w-md">
                      <div className="col-span-2">
                        <div className="h-40 rounded-lg bg-primary/10 flex items-center justify-center">
                          <BarChart3 className="h-16 w-16 text-primary/60" />
                        </div>
                      </div>
                      <div className="h-32 rounded-lg bg-primary/10 flex items-center justify-center">
                        <PiggyBank className="h-12 w-12 text-primary/60" />
                      </div>
                      <div className="h-32 rounded-lg bg-primary/10 flex items-center justify-center">
                        <TrendingUp className="h-12 w-12 text-primary/60" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <div className="inline-block rounded-lg bg-muted px-3 py-1 text-sm">Features</div>
                <h2 className="text-3xl font-bold tracking-tighter md:text-4xl/tight">
                  Everything you need to manage your finances
                </h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Our comprehensive suite of tools helps you track, analyze, and optimize your financial life.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-3 lg:gap-12 mt-12">
              {features.map((feature, index) => (
                <Card key={index} className="border-none shadow-md">
                  <CardHeader>
                    <div className="p-2 w-12 h-12 rounded-lg bg-primary/10 mb-2 flex items-center justify-center">
                      {feature.icon}
                    </div>
                    <CardTitle>{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>{feature.description}</CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      </main>
      <footer className="border-t py-6 md:py-0">
        <div className="container flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            <p className="text-sm text-muted-foreground">© 2025 FinanceTrack. All rights reserved.</p>
          </div>
          <div className="flex gap-4">
            <Link href="/privacy" className="text-sm text-muted-foreground hover:underline underline-offset-4">
              Privacy
            </Link>
            <Link href="/terms" className="text-sm text-muted-foreground hover:underline underline-offset-4">
              Terms
            </Link>
            <Link href="/contact" className="text-sm text-muted-foreground hover:underline underline-offset-4">
              Contact
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}

const features = [
  {
    icon: <BarChart3 className="h-6 w-6 text-primary" />,
    title: "Net Worth Tracking",
    description: "Monitor all your assets, liabilities, and investments in one place with real-time updates.",
  },
  {
    icon: <PiggyBank className="h-6 w-6 text-primary" />,
    title: "Monthly Budgeting",
    description: "Compare your actual spending to your budget templates and identify areas for improvement.",
  },
  {
    icon: <TrendingUp className="h-6 w-6 text-primary" />,
    title: "Retirement Planning",
    description: "Use our dynamic calculator to project your retirement readiness based on current investments.",
  },
  {
    icon: <Shield className="h-6 w-6 text-primary" />,
    title: "Secure Authentication",
    description: "Your financial data is protected with industry-standard security and Google authentication.",
  },
  {
    icon: <BarChart3 className="h-6 w-6 text-primary" />,
    title: "Historical Analysis",
    description: "View your financial progress over time with detailed historical spending and investing data.",
  },
  {
    icon: <TrendingUp className="h-6 w-6 text-primary" />,
    title: "AI-Powered Insights",
    description: "Get personalized recommendations and predictions powered by machine learning algorithms.",
  },
]


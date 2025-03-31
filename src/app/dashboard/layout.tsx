import type { ReactNode } from "react"
import { redirect } from "next/navigation"
import Sidebar from "@/components/sidebar"
import { createClient } from "@/utils/supabase/server"
import { Toaster } from "sonner"
import { TabRefreshPrevention } from "@/components/tab-refresh-prevention"

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/login")
  }

  return (
    <div className="flex h-screen bg-muted/50">
      <Sidebar />
      <main className="flex-1 overflow-auto p-6">{children}</main>
      <Toaster />
      <TabRefreshPrevention />
    </div>
  )
}


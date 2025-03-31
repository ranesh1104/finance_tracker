"use client"

import { useEffect } from "react"

export function TabRefreshPrevention() {
  useEffect(() => {
    // Create a unique key for this page load
    const pageLoadKey = `page_load_${Date.now()}`

    // Store it in sessionStorage
    sessionStorage.setItem("current_page_load", pageLoadKey)

    // Function to handle beforeunload events
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // Only prevent unload if it's due to tab switching (visibilityState is hidden)
      if (document.visibilityState === "hidden") {
        // Store that we're just hiding, not navigating away
        sessionStorage.setItem("tab_hidden", "true")

        // In some browsers, we need to set returnValue to prevent unload
        e.preventDefault()
        e.returnValue = ""
      }
    }

    // Function to handle visibility change
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        // Check if this is the same page load
        const storedKey = sessionStorage.getItem("current_page_load")
        const wasHidden = sessionStorage.getItem("tab_hidden") === "true"

        if (storedKey === pageLoadKey && wasHidden) {
          console.log("Tab focus regained, preventing refresh")

          // Clear the hidden flag
          sessionStorage.removeItem("tab_hidden")

          // Cancel any pending refreshes
          window.stop()

          // Prevent any form submissions or other actions that might trigger a refresh
          const preventAction = (e: Event) => {
            e.preventDefault()
            e.stopPropagation()
          }

          // Add event listeners to prevent common refresh triggers
          document.addEventListener("submit", preventAction, { capture: true, once: true })
          document.addEventListener("beforeunload", preventAction, { capture: true, once: true })
        }
      }
    }

    // Add event listeners
    window.addEventListener("beforeunload", handleBeforeUnload)
    document.addEventListener("visibilitychange", handleVisibilityChange)

    // Handle page show events (back/forward cache)
    window.addEventListener("pageshow", (e) => {
      if (e.persisted) {
        // This is a back/forward navigation from cache
        console.log("Page restored from back/forward cache")
        sessionStorage.setItem("current_page_load", pageLoadKey)
      }
    })

    // Clean up
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload)
      document.removeEventListener("visibilitychange", handleVisibilityChange)
    }
  }, [])

  return null
}


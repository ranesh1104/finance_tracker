"use client"

import { useState, useEffect } from "react"

export function usePersistentState<T>(key: string, initialValue: T): [T, (value: T) => void] {
  // Create a unique key for this browser tab
  const getTabKey = () => {
    if (typeof window === "undefined") return key

    let tabId = sessionStorage.getItem("tab_id")
    if (!tabId) {
      tabId = `tab_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
      sessionStorage.setItem("tab_id", tabId)
    }

    return `${key}_${tabId}`
  }

  const tabKey = getTabKey()

  // Initialize state
  const [state, setState] = useState<T>(() => {
    try {
      // Get from local storage by key
      if (typeof window !== "undefined") {
        const item = localStorage.getItem(tabKey)
        // Parse stored json or if none return initialValue
        return item ? JSON.parse(item) : initialValue
      }
      return initialValue
    } catch (error) {
      // If error also return initialValue
      console.error("Error reading from localStorage:", error)
      return initialValue
    }
  })

  // Return a wrapped version of useState's setter function that persists the new value to localStorage
  const setValue = (value: T) => {
    try {
      // Allow value to be a function so we have same API as useState
      const valueToStore = value instanceof Function ? value(state) : value
      // Save state
      setState(valueToStore)
      // Save to local storage
      if (typeof window !== "undefined") {
        localStorage.setItem(tabKey, JSON.stringify(valueToStore))
      }
    } catch (error) {
      // A more advanced implementation would handle the error case
      console.error("Error writing to localStorage:", error)
    }
  }

  // Listen for storage events to sync state across tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === tabKey && e.newValue) {
        try {
          setState(JSON.parse(e.newValue))
        } catch (error) {
          console.error("Error parsing localStorage value:", error)
        }
      }
    }

    window.addEventListener("storage", handleStorageChange)
    return () => window.removeEventListener("storage", handleStorageChange)
  }, [tabKey])

  return [state, setValue]
}


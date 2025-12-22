"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"

interface ServerControlsProps {
  isServerOffline: boolean
}

export default function ServerControls({ isServerOffline }: ServerControlsProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleServerAction = async (action: "start") => {
    if (!isServerOffline) {
      toast("server already running", {
        description: "no action was sent",
      })
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch("/api/server-control", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      })

      if (!response.ok) {
        throw new Error()
      }

      toast.success(`server ${action} request sent`, {
        description: `the server will ${action} shortly`,
      })
    } catch {
      toast.error(`failed to ${action} server`, {
        description: "please try again later",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      onClick={() => handleServerAction("start")}
      disabled={isLoading || !isServerOffline}
      className="lowercase bg-green-600 hover:bg-green-700 w-full"
    >
      start server
    </Button>
  )
}

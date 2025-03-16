"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Credenza,
  CredenzaBody,
  CredenzaClose,
  CredenzaContent,
  CredenzaDescription,
  CredenzaFooter,
  CredenzaHeader,
  CredenzaTitle,
  CredenzaTrigger,
} from "@/components/ui/credenza"

interface ServerControlsProps {
  isAuthenticated: boolean
  onAuthenticate: () => void
}

const encryptPassword = (password: string): string => {
  try {
    const key = process.env.NEXT_PUBLIC_ENCRYPTION_KEY || "goofy_key_123456789"
    
    // XOR encryption
    let result = ""
    for (let i = 0; i < password.length; i++) {
      const charCode = password.charCodeAt(i) ^ key.charCodeAt(i % key.length)
      result += String.fromCharCode(charCode)
    }
    
    // base64 is a trap mwahahaha
    return btoa(result)
  } catch (e) {
    console.error("Encryption error:", e)
    return ""
  }
}

const decryptPassword = (encrypted: string): string => {
  try {
    const key = process.env.NEXT_PUBLIC_ENCRYPTION_KEY || "goofy_key_123456789"
    
    const decoded = atob(encrypted)
    
    // XOR decryption
    let result = ""
    for (let i = 0; i < decoded.length; i++) {
      const charCode = decoded.charCodeAt(i) ^ key.charCodeAt(i % key.length)
      result += String.fromCharCode(charCode)
    }
    
    return result
  } catch (e) {
    console.error("Decryption error:", e)
    return ""
  }
}

export default function ServerControls({ isAuthenticated, onAuthenticate }: ServerControlsProps) {
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const getStoredPassword = (): string => {
    if (typeof window === "undefined") return ""
    const encrypted = localStorage.getItem("mc_server_auth")
    return encrypted ? decryptPassword(encrypted) : ""
  }

  const storePassword = (pwd: string) => {
    if (typeof window === "undefined") return
    localStorage.setItem("mc_server_auth", encryptPassword(pwd))
  }

  const handleAuthentication = async () => {
    if (!password.trim()) return
    
    setIsLoading(true)
    setError("")

    try {
      const response = await fetch("/api/server-control", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "verify", password }),
      })

      if (response.ok) {
        storePassword(password)
        setPassword("")
        setIsModalOpen(false)
        onAuthenticate()
        toast("authenticated successfully", {
          description: "you now have access to server controls",
        })
      } else {
        setError("incorrect password")
      }
    } catch {
      setError("something went wrong")
    } finally {
      setIsLoading(false)
    }
  }

  const handleServerAction = async (action: "start" | "stop") => {
    setIsLoading(true)
    setError("")
    const storedPassword = getStoredPassword()

    try {
      const response = await fetch("/api/server-control", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, password: storedPassword }),
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    handleAuthentication()
  }

  if (isAuthenticated) {
    return (
      <div className="flex gap-2">
        <Button
          onClick={() => handleServerAction("start")}
          disabled={isLoading}
          className="lowercase bg-green-600 hover:bg-green-700 flex-1"
        >
          start server
        </Button>
        <Button
          onClick={() => handleServerAction("stop")}
          disabled={isLoading}
          className="lowercase bg-red-600 hover:bg-red-700 flex-1"
        >
          stop server
        </Button>
      </div>
    )
  }

  return (
    <Credenza open={isModalOpen} onOpenChange={setIsModalOpen}>
      <CredenzaTrigger asChild>
        <button className="text-xs text-gray-500 hover:text-gray-300 transition-colors lowercase">
          server controls
        </button>
      </CredenzaTrigger>
      <CredenzaContent>
        <form onSubmit={handleSubmit}>
          <CredenzaHeader>
            <CredenzaTitle className="lowercase">server controls</CredenzaTitle>
            <CredenzaDescription className="lowercase">
              enter password to access server controls
            </CredenzaDescription>
          </CredenzaHeader>
          <CredenzaBody className="space-y-4 py-4">
            <Input
              type="password"
              placeholder="password"
              value={password}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
              className="lowercase"
              disabled={isLoading}
            />
            {error && <p className="text-red-500 text-sm lowercase">{error}</p>}
          </CredenzaBody>
          <CredenzaFooter className="flex gap-2">
            <CredenzaClose asChild>
              <Button variant="outline" className="lowercase flex-1">
                close
              </Button>
            </CredenzaClose>
            <Button 
              type="submit" 
              className="lowercase bg-emerald-600 hover:bg-emerald-700 flex-1"
              disabled={isLoading}
            >
              {isLoading ? "verifying..." : "submit"}
            </Button>
          </CredenzaFooter>
        </form>
      </CredenzaContent>
    </Credenza>
  )
} 
"use client"

import { useState, useEffect } from "react";
import { RefreshCw, Users, Server, MessageSquare, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import FluidBackground from "@/components/fluid-background";
import { FaGithub } from "react-icons/fa";
import { copyTextToClipboard } from "@/lib/clipboard";
import ServerControls from "@/components/server-controls";
import { toast } from "sonner";

interface ServerResponse {
  online: boolean
  host: string
  version: {
    name_raw: string
    name_clean: string
    name_html: string
    protocol: number
  }
  players: {
    online: number
    max: number
    list: string[]
  }
  motd: {
    raw: string
    clean: string
    html: string
  }
  icon: string
  mods: string[]
  plugins: string[]
}

export default function Home() {
  const [serverData, setServerData] = useState<ServerResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [copied, setCopied] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [useExternalAdmin, setUseExternalAdmin] = useState(true)
  const serverIP = "mc.veygax.dev"

  useEffect(() => {
    // Check if user has stored credentials
    const hasStoredAuth = localStorage.getItem("mc_server_auth") !== null
    if (hasStoredAuth) {
      setIsAuthenticated(true)
    }
  }, [])

  const fetchServerStatus = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`https://api.mcstatus.io/v2/status/java/${serverIP}`)

      if (!response.ok) {
        throw new Error("failed to fetch server status")
      }

      const data = await response.json()

      if (data.version?.name_raw === "§c● Offline" || data.version?.name_clean === "● Offline") {
        data.online = false
      }

      setServerData(data)
      setLastUpdated(new Date())
    } catch (err) {
      setError("could not connect to server")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchServerStatus()

    const interval = setInterval(() => {
      fetchServerStatus()
    }, 60000)

    return () => clearInterval(interval)
  }, [])

  const isServerOffline =
    !serverData?.online ||
    serverData?.version?.name_raw === "§c● Offline" ||
    serverData?.version?.name_clean === "● Offline"

  const copyToClipboard = () => {
    copyTextToClipboard(serverIP);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const handleAuthenticate = () => {
    setIsAuthenticated(true)
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
    localStorage.removeItem("mc_server_auth")
    toast("logged out successfully")
  }

  return (
    <main className="h-screen w-full flex items-center justify-center p-4 overflow-hidden">
      <FluidBackground />
      <div className="absolute inset-0 bg-[url('/placeholder.svg?height=100&width=100')] opacity-5 bg-repeat z-0 pointer-events-none"></div>

      <div className="max-w-md w-full z-10 pointer-events-auto">
        <Card className="border-2 border-emerald-600/50 bg-black/80 backdrop-blur-sm shadow-xl">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-2xl font-minecraft text-white lowercase">
                  veyga&apos;s private mc server
                </CardTitle>
                <CardDescription className="text-gray-400 lowercase">
                  {!isServerOffline ? (
                    <span className="flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full bg-green-500 inline-block"></span> online
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full bg-red-500 inline-block"></span> offline
                    </span>
                  )}
                </CardDescription>
                <p className="mt-1 mb-2 text-sm text-gray-300 lowercase">my mc server. if you want to join, dm me on discord.</p>
              </div>

              {serverData?.icon && (
                <div className="w-14 h-14 aspect-square rounded overflow-hidden z-50 relative flex-shrink-0">
                  <img
                    src={serverData.icon || "/placeholder.svg"}
                    alt="Server Icon"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {error ? (
              <div className="p-4 text-center text-red-400 lowercase">{error}</div>
            ) : loading && !serverData ? (
              <div className="p-4 text-center text-gray-400 lowercase animate-pulse">loading server status...</div>
            ) : (
              <>
                <div className="bg-gray-900/60 p-3 rounded-md border border-gray-800">
                  <h3 className="text-gray-400 text-sm mb-1 lowercase flex items-center gap-1">
                    <MessageSquare size={14} /> message of the day
                  </h3>
                  <p className="text-white lowercase">{serverData?.motd?.clean || "no motd available"}</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-900/60 p-3 rounded-md border border-gray-800">
                    <h3 className="text-gray-400 text-sm mb-1 lowercase flex items-center gap-1">
                      <Users size={14} /> players
                    </h3>
                    <p className="text-white text-xl font-bold">
                      {isServerOffline ? "0/0" : `${serverData?.players?.online || 0}/${serverData?.players?.max || 0}`}
                    </p>
                  </div>

                  <div className="bg-gray-900/60 p-3 rounded-md border border-gray-800">
                    <h3 className="text-gray-400 text-sm mb-1 lowercase flex items-center gap-1">
                      <Server size={14} /> version
                    </h3>
                    <p className="text-white lowercase text-sm">
                      {isServerOffline ? "n/a" : serverData?.version?.name_clean || "unknown"}
                    </p>
                  </div>
                </div>

                {!isServerOffline && (serverData?.mods?.length || serverData?.plugins?.length) ? (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex flex-wrap gap-1 mt-2 cursor-pointer">
                          {serverData?.mods?.length > 0 && (
                            <Badge variant="outline" className="lowercase text-emerald-400 border-emerald-800">
                              {serverData.mods.length} mods
                            </Badge>
                          )}
                          {serverData?.plugins?.length > 0 && (
                            <Badge variant="outline" className="lowercase text-blue-400 border-blue-800">
                              {serverData.plugins.length} plugins
                            </Badge>
                          )}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <div className="space-y-2 p-1">
                          {serverData?.mods?.length > 0 && (
                            <div>
                              <h4 className="font-bold text-xs lowercase">mods:</h4>
                              <div className="text-xs lowercase">{serverData.mods.join(", ")}</div>
                            </div>
                          )}
                          {serverData?.plugins?.length > 0 && (
                            <div>
                              <h4 className="font-bold text-xs lowercase">plugins:</h4>
                              <div className="text-xs lowercase">{serverData.plugins.join(", ")}</div>
                            </div>
                          )}
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ) : null}
              </>
            )}
          </CardContent>

          <CardFooter className="flex flex-col gap-3">
            {isAuthenticated ? (
              <ServerControls isAuthenticated={isAuthenticated} onAuthenticate={handleAuthenticate} />
            ) : (
              <Button
                variant="default"
                className="w-full bg-emerald-600 hover:bg-emerald-700 lowercase"
                onClick={() => window.open("https://discord.com/users/1119938236245094521", "_blank")}
              >
                dm veygax on discord
              </Button>
            )}

            <Button
              variant="outline"
              className="w-full bg-gray-900/60 border border-gray-800 hover:bg-gray-800/80 lowercase cursor-pointer flex items-center justify-center gap-2 text-white"
              onClick={copyToClipboard}
            >
              {copied ? (
                <>
                  <Check size={16} className="text-green-500" /> copied server ip
                </>
              ) : (
                <>
                  <Copy size={16} /> copy server ip: {serverIP}
                </>
              )}
            </Button>

            <div className="flex justify-between items-center w-full text-xs text-gray-500 lowercase">
              <button
                onClick={fetchServerStatus}
                className="flex items-center gap-1 hover:text-gray-300 transition-colors cursor-pointer"
                disabled={loading}
              >
                <RefreshCw size={12} className={loading ? "animate-spin" : ""} /> refresh
              </button>

              <div className="flex items-center gap-2">
                {lastUpdated && <span>updated: {lastUpdated.toLocaleTimeString()}</span>}

                {isAuthenticated ? (
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault()
                      handleLogout()
                    }}
                    className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
                    title="looks like you dm'ed veygax :O"
                  >
                    logout
                  </a>
                ) : useExternalAdmin ? (
                  <a
                    href="https://mc-admin.veygax.dev"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
                  >
                    server controls
                  </a>
                ) : (
                  <ServerControls isAuthenticated={isAuthenticated} onAuthenticate={handleAuthenticate} />
                )}
              </div>
            </div>
            
            <div className="w-full text-xs text-gray-500 lowercase text-center pt-2 border-t border-gray-800 mt-2">
              <p>
                made with ❤️ by{" "}
                <a 
                  href="https://veygax.dev" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-emerald-500 hover:text-emerald-400 transition-colors"
                >
                  veygax
                </a>
                {" | "}
                {process.env.NEXT_PUBLIC_COMMIT_HASH ? (
                  <a
                    href={`https://github.com/veygax/mc-server-website/commit/${process.env.NEXT_PUBLIC_COMMIT_HASH}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-emerald-500 hover:text-emerald-400 transition-colors"
                  >
                    <FaGithub size={12} /> {process.env.NEXT_PUBLIC_COMMIT_HASH.substring(0, 7) /* extra check for less than 7 digits cos i dont want git to mess up the entire site. */}
                  </a>
                ) : (
                  <a
                    href="https://github.com/veygax/mc-server-website"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-emerald-500 hover:text-emerald-400 transition-colors"
                  >
                    <FaGithub size={12} /> contributing? 🤨
                  </a>
                )}
              </p>
            </div>
          </CardFooter>
        </Card>
      </div>
    </main>
  )
}


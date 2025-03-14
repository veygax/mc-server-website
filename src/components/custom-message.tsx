"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Edit2, Check, X } from "lucide-react"

export default function CustomMessage() {
  const [message, setMessage] = useState("")
  const [isEditing, setIsEditing] = useState(false)
  const [tempMessage, setTempMessage] = useState("")

  // Load message from localStorage on component mount
  useEffect(() => {
    const savedMessage = localStorage.getItem("serverCustomMessage")
    if (savedMessage) {
      setMessage(savedMessage)
    }
  }, [])

  const handleEdit = () => {
    setTempMessage(message)
    setIsEditing(true)
  }

  const handleSave = () => {
    setMessage(tempMessage)
    localStorage.setItem("serverCustomMessage", tempMessage)
    setIsEditing(false)
  }

  const handleCancel = () => {
    setIsEditing(false)
  }

  return (
    <div className="mt-1 mb-2">
      {isEditing ? (
        <div className="space-y-2">
          <Textarea
            value={tempMessage}
            onChange={(e) => setTempMessage(e.target.value)}
            placeholder="add a custom message..."
            className="resize-none h-16 text-sm bg-gray-900/60 border-gray-800 focus-visible:ring-emerald-500 lowercase"
            maxLength={100}
          />
          <div className="flex gap-2 justify-end">
            <Button variant="outline" size="sm" onClick={handleCancel} className="h-7 px-2 text-xs">
              <X size={14} className="mr-1" /> cancel
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={handleSave}
              className="h-7 px-2 text-xs bg-emerald-600 hover:bg-emerald-700"
            >
              <Check size={14} className="mr-1" /> save
            </Button>
          </div>
        </div>
      ) : (
        <div className="min-h-[24px] text-gray-300 text-sm lowercase flex justify-between items-center">
          {message ? (
            <p className="break-words">{message}</p>
          ) : (
            <p className="text-gray-500 italic">no custom message</p>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleEdit}
            className="h-6 w-6 p-0 ml-2 text-gray-500 hover:text-white hover:bg-gray-800"
          >
            <Edit2 size={14} />
            <span className="sr-only">edit message</span>
          </Button>
        </div>
      )}
    </div>
  )
}


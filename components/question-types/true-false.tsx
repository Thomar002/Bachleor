"use client"

import { useState } from "react"
import { Check, Menu, Bot } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { EditorToolbar } from "../editor-toolbar"
import { QuestionTypeDialog } from "../question-type-dialog"

export function TrueFalse() {
  const [displayName, setDisplayName] = useState("")
  const [correctAnswer, setCorrectAnswer] = useState<"true" | "false" | null>(null)
  const [isTypeDialogOpen, setIsTypeDialogOpen] = useState(false)
  const [type, setType] = useState<string[]>([])

  const handleTypeChange = (newTypes: string[]) => {
    setType(newTypes)
    setIsTypeDialogOpen(false)
  }

  return (
    <div className="bg-gray-50">
      <div className="border-b bg-white">
        <div className="flex items-center gap-4 p-4">
          <div className="mb-8 flex gap-4">
            <Button
              onClick={() => setIsTypeDialogOpen(true)}
              className="flex items-center gap-2"
            >
              <Menu className="h-5 w-5" />
              Question Type
            </Button>
            <Button className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              AI creator
            </Button>
          </div>
        </div>
        <div className="p-4 border-t">
          <h1 className="text-xl font-semibold">True/False Question</h1>
        </div>
        <div className="px-4 pb-4">
          <Input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Enter display name..."
            className="max-w-md mx-auto"
          />
        </div>
        <EditorToolbar />
      </div>

      <div className="container mx-auto p-6 max-w-3xl">
        <Input className="text-lg mb-8" placeholder="Enter your question description here..." />

        <div className="space-y-4">
          {["true", "false"].map((option) => (
            <div key={option} className="flex items-center gap-4">
              <div
                className={`h-6 w-6 rounded-full border-2 flex items-center justify-center cursor-pointer ${correctAnswer === option ? "border-green-500 bg-green-500" : "border-gray-300"
                  }`}
                onClick={() => setCorrectAnswer(option as "true" | "false")}
              >
                {correctAnswer === option && <Check className="h-4 w-4 text-white" />}
              </div>
              <span className="capitalize">{option}</span>
            </div>
          ))}
        </div>
      </div>
      <QuestionTypeDialog
        open={isTypeDialogOpen}
        onOpenChange={setIsTypeDialogOpen}
        onTypeSelect={handleTypeChange}
        currentTypes={type}
      />
    </div>
  )
}


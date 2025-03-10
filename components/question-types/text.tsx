"use client"

import { useState } from "react"
import { Menu, Bot } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { EditorToolbar } from "../editor-toolbar"
import { QuestionTypeDialog } from "../question-type-dialog"

export function Text() {
  const [displayName, setDisplayName] = useState("")
  const [answer, setAnswer] = useState("")
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
          <h1 className="text-xl font-semibold">Text Question</h1>
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
        <Textarea
          className="text-lg mb-8"
          placeholder="Enter your question description here..."
        />
        <div className="space-y-4">
          <h2 className="font-medium">Correct Answer</h2>
          <Textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            className="min-h-[200px]"
            placeholder="Enter the correct answer here..."
          />
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

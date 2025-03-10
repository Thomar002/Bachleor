"use client"

import { useState } from "react"
import { Check, Trash2, Menu, Bot } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { EditorToolbar } from "../editor-toolbar"
import { QuestionTypeDialog } from "../question-type-dialog"

interface Option {
  id: string
  text: string
  isCorrect: boolean
}

export function MultipleChoiceSingle() {
  const [displayName, setDisplayName] = useState("")
  const [options, setOptions] = useState<Option[]>([
    { id: "1", text: "Option 1", isCorrect: false },
    { id: "2", text: "Option 2", isCorrect: false },
    { id: "3", text: "Option 3", isCorrect: false },
  ])
  const [isTypeDialogOpen, setIsTypeDialogOpen] = useState(false)
  const [type, setType] = useState<string[]>([])

  const handleTypeChange = (newTypes: string[]) => {
    setType(newTypes)
    setIsTypeDialogOpen(false)
  }

  const handleOptionChange = (id: string, text: string) => {
    setOptions(options.map((opt) => (opt.id === id ? { ...opt, text } : opt)))
  }

  const handleCorrectChange = (id: string) => {
    setOptions(
      options.map((opt) => ({
        ...opt,
        isCorrect: opt.id === id,
      })),
    )
  }

  const handleDeleteOption = (id: string) => {
    setOptions(options.filter((opt) => opt.id !== id))
  }

  const addOption = () => {
    const newId = (Math.max(...options.map((opt) => Number.parseInt(opt.id))) + 1).toString()
    setOptions([...options, { id: newId, text: `Option ${newId}`, isCorrect: false }])
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
          <h1 className="text-xl font-semibold">Multiple Choice (Single Answer)</h1>
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
          {options.map((option) => (
            <div key={option.id} className="flex items-center gap-4">
              <div className="flex-1 flex items-center gap-4">
                <div
                  className={`h-6 w-6 rounded-full border-2 flex items-center justify-center cursor-pointer ${option.isCorrect ? "border-green-500 bg-green-500" : "border-gray-300"
                    }`}
                  onClick={() => handleCorrectChange(option.id)}
                >
                  {option.isCorrect && <Check className="h-4 w-4 text-white" />}
                </div>
                <Input
                  value={option.text}
                  onChange={(e) => handleOptionChange(option.id, e.target.value)}
                  className="flex-1"
                />
              </div>
              <Button variant="ghost" size="icon" onClick={() => handleDeleteOption(option.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>

        <Button variant="outline" onClick={addOption} className="mt-4">
          Add option
        </Button>
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


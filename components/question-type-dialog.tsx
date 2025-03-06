"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { CheckCircle, Circle, ThumbsUp, ThumbsDown } from "lucide-react"

interface QuestionTypeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onTypeSelect: (types: string[]) => void
  currentTypes: string[]
}

export function QuestionTypeDialog({ open, onOpenChange, onTypeSelect, currentTypes }: QuestionTypeDialogProps) {
  const questionTypes = [
    {
      id: "multiple-choice-single",
      name: "Multiple choice (single answer)",
      icon: <CheckCircle className="w-8 h-8" />,
    },
    {
      id: "multiple-choice-multiple",
      name: "Multiple choice (multiple answers)",
      icon: <Circle className="w-8 h-8" />,
    },
    {
      id: "true-false",
      name: "True or false",
      icons: (
        <div className="flex gap-4">
          <ThumbsUp className="w-8 h-8" />
          <ThumbsDown className="w-8 h-8" />
        </div>
      ),
    },
  ]

  const toggleType = (typeId: string) => {
    const newTypes = currentTypes.includes(typeId)
      ? currentTypes.filter((t) => t !== typeId)
      : [...currentTypes, typeId]
    onTypeSelect(newTypes)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="text-2xl mb-4">Question types</DialogTitle>
          <p className="text-lg text-gray-600">Choose question type(s)</p>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4 mt-4">
          {questionTypes.map((type) => (
            <Button
              key={type.id}
              variant="outline"
              className={`h-auto p-6 flex flex-col items-center gap-4 ${
                currentTypes.includes(type.id) ? "border-blue-500 border-2" : ""
              }`}
              onClick={() => toggleType(type.id)}
            >
              {type.icon || type.icons}
              <span className="text-lg font-medium">{type.name}</span>
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}


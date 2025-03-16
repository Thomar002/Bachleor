"use client"

import { Button } from "@/components/ui/button"
import { Save } from "lucide-react"
import { QuestionType } from "@/types"

interface SaveQuestionButtonProps {
  displayName: string
  question: string
  type: QuestionType
  onSave: () => Promise<void>
}

export function SaveQuestionButton({ displayName, question, type, onSave }: SaveQuestionButtonProps) {
  return (
    <Button
      onClick={onSave}
      className="flex items-center gap-2 mt-8"
    >
      <Save className="h-4 w-4" />
      Save
    </Button>
  )
}
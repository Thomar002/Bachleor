"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { CheckCircle, Circle, ThumbsUp, ThumbsDown, Type, FunctionSquare } from "lucide-react"
import { useRouter } from "next/navigation"
import { useParams } from "next/navigation"

interface QuestionTypeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onTypeSelect: (types: string[]) => void
  currentTypes: string[]
}

export function QuestionTypeDialog({ open, onOpenChange, onTypeSelect, currentTypes }: QuestionTypeDialogProps) {
  const router = useRouter()
  const params = useParams()

  const questionTypes = [
    {
      id: "text",
      name: "Text answer",
      icon: <Type className="w-8 h-8" />,
      path: "text"
    },
    {
      id: "True/False",
      name: "True or false",
      icons: (
        <div className="flex gap-4">
          <ThumbsUp className="w-8 h-8" />
          <ThumbsDown className="w-8 h-8" />
        </div>
      ),
      path: "true-false"
    },
    {
      id: "Multiple Choice-single",
      name: "Multiple choice (single answer)",
      icon: <CheckCircle className="w-8 h-8" />,
      path: "multiple-choice-single"
    },
    {
      id: "Multiple Choice-multi",
      name: "Multiple choice (multiple answers)",
      icon: <Circle className="w-8 h-8" />,
      path: "multiple-choice-multiple"
    },
    {
      id: "Equation",
      name: "Equation",
      icon: <FunctionSquare className="w-8 h-8" />,
      path: "equation"
    }
  ]

  const handleTypeClick = (typeId: string, path: string) => {
    // Construct the URL based on the current route
    const baseUrl = params.subjectId
      ? `/subjects/${params.subjectId}/exams/${params.examId}/questions/${params.questionId}`
      : `/my-exams/${params.examId}/questions/${params.questionId}`

    router.push(`${baseUrl}/${path}`)
    onTypeSelect([typeId])
    onOpenChange(false)
  }

  // Get the current path from params
  const currentPath = params.type as string

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="text-2xl mb-4">Question types</DialogTitle>
          <DialogDescription>
            Select the type of question you want to create
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4 mt-4">
          {questionTypes.map((type) => (
            <Button
              key={type.id}
              variant="outline"
              className={`h-auto p-6 flex flex-col items-center gap-4 
                ${currentTypes.includes(type.id) ? "border-blue-500 border-2" : ""}
                ${type.path === currentPath ? "border-blue-500 border-2 bg-blue-50" : ""}`}
              onClick={() => handleTypeClick(type.id, type.path)}
            >
              {type.icon || type.icons}
              <span className="text-center">{type.name}</span>
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}


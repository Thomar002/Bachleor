"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Menu, Bot } from "lucide-react"
import { supabase } from "@/lib/supabaseClient"
import { QuestionTypeDialog } from "./question-type-dialog"

interface Question {
  id: number
  name: string
  description: string
  type: string[]
}

interface QuestionEditorProps {
  questionId: number
  examId: number
  initialName: string
  initialDescription?: string
  initialType?: string[]
}

export default function QuestionEditor({ questionId, examId, initialName, initialDescription = "", initialType = [] }: QuestionEditorProps) {
  const router = useRouter()
  const params = useParams()
  const [name, setName] = useState(initialName)
  const [description, setDescription] = useState(initialDescription)
  const [type, setType] = useState(initialType)
  const [isTypeDialogOpen, setIsTypeDialogOpen] = useState(false)

  useEffect(() => {
    // If no type is set, navigate to text type
    if (!initialType || initialType.length === 0) {
      const baseUrl = params.subjectId
        ? `/subjects/${params.subjectId}/exams/${examId}/questions/${questionId}`
        : `/my-exams/${examId}/questions/${questionId}`
      router.push(`${baseUrl}/text`)
    }
  }, [])

  const handleSave = async () => {
    await updateQuestion({
      name,
      description,
      type,
    })
    router.push(`/subjects/${params.subjectCode}/exams/${examId}`)
  }

  const updateQuestion = async (updates: Partial<Question>) => {
    const { error } = await supabase.from("Questions").update(updates).eq("id", questionId)

    if (error) {
      console.error("Error updating question:", error)
    }
  }

  const handleTypeChange = (newTypes: string[]) => {
    setType(newTypes)
    setIsTypeDialogOpen(false)
  }

  return (
    <div className="flex-1 flex flex-col">
      <main className="flex-1 p-8">
        <div className="max-w-4xl mx-auto">
          {/* Question Tools */}
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

          {/* Question Content */}
          <div className="space-y-6">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Question name"
              className="text-xl font-semibold"
            />
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Question description"
              className="min-h-[200px]"
            />
          </div>
        </div>
      </main>

      <QuestionTypeDialog
        open={isTypeDialogOpen}
        onOpenChange={setIsTypeDialogOpen}
        onTypeSelect={handleTypeChange}
        currentTypes={type}
      />
    </div>
  )
}


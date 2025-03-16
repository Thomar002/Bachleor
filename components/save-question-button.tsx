"use client"

import { Button } from "@/components/ui/button"
import { Save } from "lucide-react"
import { useParams, useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"
import { QuestionType } from "@/types"

interface SaveQuestionButtonProps {
  displayName: string
  question: string
  type: QuestionType
}

export function SaveQuestionButton({ displayName, question, type }: SaveQuestionButtonProps) {
  const params = useParams()
  const router = useRouter()
  const questionId = params.questionId as string
  const examId = params.examId as string
  const subjectId = params.subjectId as string

  const handleSave = async () => {
    if (!questionId) return

    try {
      const { error } = await supabase
        .from("Questions")
        .update({
          display_name: displayName,
          question: question,
          type: type
        })
        .eq("id", questionId)

      if (error) throw error

      const redirectPath = subjectId
        ? `/subjects/${subjectId}/exams/${examId}`
        : `/my-exams/${examId}`

      router.push(redirectPath)
    } catch (error) {
      console.error("Error saving question:", error)
    }
  }

  return (
    <div className="flex justify-end mt-8">
      <Button onClick={handleSave} className="flex items-center gap-2">
        <Save className="h-4 w-4" />
        Save
      </Button>
    </div>
  )
}
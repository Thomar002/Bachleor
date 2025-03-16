"use client"

import { useState, useRef, useEffect } from "react"
import { useParams } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"
import { SaveQuestionButton } from "./save-question-button"
import { toast } from "sonner"

interface Props {
  questionName: string
  initialTags?: string[]
  onTagsChange?: (tags: string[]) => void
}

export function Text({ questionName, initialTags = [], onTagsChange }: Props) {
  const params = useParams()
  const questionId = params.questionId as string
  const [displayName, setDisplayName] = useState<string>("")
  const [questionContent, setQuestionContent] = useState<string>("")
  const answerEditorRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fetchQuestionData = async () => {
      if (!questionId) return

      const { data, error } = await supabase
        .from("Questions")
        .select("*")
        .eq("id", questionId)
        .single()

      if (error) {
        console.error("Error fetching question data:", error)
        return
      }

      if (data) {
        setDisplayName(data.display_name || "")
        const questionText = data.question || ""
        setQuestionContent(questionText)
        if (answerEditorRef.current) {
          answerEditorRef.current.innerHTML = questionText
        }
      }
    }

    fetchQuestionData()
  }, [questionId])

  const handleEditorChange = () => {
    const content = answerEditorRef.current?.innerHTML || ""
    setQuestionContent(content)
  }

  const handleSave = async () => {
    if (!questionId) return

    try {
      const { error } = await supabase
        .from("Questions")
        .update({
          display_name: displayName,
          question: questionContent,
          type: "text"
        })
        .eq("id", questionId)

      if (error) throw error

      toast.success("Question saved successfully")
    } catch (error) {
      console.error("Error saving question:", error)
      toast.error("Failed to save question")
    }
  }

  return (
    <div className="bg-gray-50">
      <div className="container mx-auto p-6 max-w-3xl">
        <div className="flex gap-6">
          <div className="flex-1">
            <h2 className="text-sm font-medium text-gray-700 mb-2">Question</h2>
            <div
              ref={answerEditorRef}
              contentEditable
              data-placeholder="Enter your question here..."
              className="min-h-[200px] p-4 border rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 empty:before:content-[attr(data-placeholder)] empty:before:text-gray-400"
              style={{ lineHeight: '1.5' }}
              onInput={handleEditorChange}
            />
          </div>
        </div>

        <SaveQuestionButton
          displayName={displayName}
          question={questionContent}
          type="text"
          onSave={handleSave}
        />
      </div>
    </div>
  )
}
"use client"

import { MultipleChoiceSingle } from "@/components/question-types/multiple-choice-single"
import { MultipleChoiceMultiple } from "@/components/question-types/multiple-choice-multiple"
import { TrueFalse } from "@/components/question-types/true-false"
import { Text } from "@/components/question-types/text"
import { Equation } from "@/components/question-types/equation"
import { supabase } from "@/lib/supabaseClient"
import { useEffect, useState } from "react"

export default function QuestionTypePage({ params }: { params: { type: string, questionId: string } }) {
  const [question, setQuestion] = useState<any>(null)

  useEffect(() => {
    const fetchQuestion = async () => {
      const { data } = await supabase
        .from("Questions")
        .select("*")
        .eq("id", params.questionId)
        .single()

      setQuestion(data)
    }

    fetchQuestion()
  }, [params.questionId])

  const components = {
    "multiple-choice-single": MultipleChoiceSingle,
    "multiple-choice-multiple": MultipleChoiceMultiple,
    "true-false": TrueFalse,
    "text": Text,
    "equation": Equation,
  }

  const Component = components[params.type as keyof typeof components]

  if (!Component) {
    return <div>Question type not found</div>
  }

  if (!question) {
    return <div>Loading...</div>
  }

  // Parse tags if they're stored as a string
  const parsedTags = question.tags
    ? (Array.isArray(question.tags)
      ? question.tags
      : typeof question.tags === 'string'
        ? JSON.parse(question.tags)
        : [])
    : []

  return <Component
    questionName={question.name}
    initialTags={parsedTags}
    onTagsChange={async (newTags) => {
      await supabase
        .from("Questions")
        .update({ tags: newTags })
        .eq("id", params.questionId)
    }}
  />
}


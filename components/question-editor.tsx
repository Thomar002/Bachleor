"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Menu, Bot, Tag } from "lucide-react"
import { supabase } from "@/lib/supabaseClient"
import { QuestionTypeDialog } from "./question-type-dialog"
import { TagDialog } from "./tag-dialog"

interface Question {
  id: number
  name: string
  description: string
  type: string[]
  tags: string[]
}

interface QuestionEditorProps {
  questionId: number
  examId: number
  initialName: string
  initialDescription?: string
  initialType?: string[]
  initialTags?: string[]
}

export default function QuestionEditor({
  questionId,
  examId,
  initialName,
  initialDescription = "",
  initialType = [],
  initialTags = [],
}: QuestionEditorProps) {
  const router = useRouter()
  const params = useParams()
  const [name, setName] = useState(initialName)
  const [description, setDescription] = useState(initialDescription)
  const [type, setType] = useState(initialType)
  const [tags, setTags] = useState(initialTags)
  const [availableTags, setAvailableTags] = useState<string[]>([])
  const [isTypeDialogOpen, setIsTypeDialogOpen] = useState(false)
  const [isTagDialogOpen, setIsTagDialogOpen] = useState(false)

  useEffect(() => {
    fetchAvailableTags()
  }, [])

  const fetchAvailableTags = async () => {
    const { data, error } = await supabase
      .from("Questions")
      .select("tags")

    if (error) {
      console.error("Error fetching tags:", error)
      return
    }

    const allTags = data
      .flatMap(q => Array.isArray(q.tags) ? q.tags :
        typeof q.tags === 'string' ? JSON.parse(q.tags) : [])
      .filter((tag): tag is string => typeof tag === 'string')

    setAvailableTags([...new Set(allTags)])
  }

  const handleSave = async () => {
    await updateQuestion({
      name,
      description,
      type,
      tags,
    })
    router.push(`/subjects/${params.subjectCode}/exams/${examId}`)
  }

  const updateQuestion = async (updates: Partial<Question>) => {
    const { error } = await supabase
      .from("Questions")
      .update(updates)
      .eq("id", questionId)

    if (error) {
      console.error("Error updating question:", error)
    }
  }

  const handleTypeChange = (newTypes: string[]) => {
    setType(newTypes)
    setIsTypeDialogOpen(false)
  }

  const handleTagsChange = (newTags: string[]) => {
    setTags(newTags)
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
            <Button
              onClick={() => setIsTagDialogOpen(true)}
              className="flex items-center gap-2"
            >
              <Tag className="h-5 w-5" />
              Tags ({tags.length})
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

      <TagDialog
        open={isTagDialogOpen}
        onOpenChange={setIsTagDialogOpen}
        currentTags={tags}
        availableTags={availableTags}
        onTagsChange={handleTagsChange}
      />
    </div>
  )
}


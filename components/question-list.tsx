"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Plus, MoreVertical } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { supabase } from "@/lib/supabaseClient"
import { useRouter } from "next/navigation"
import { CreateQuestionOverlay } from "./create-question-overlay"

interface Question {
  id: number
  name: string
  type: string[]
  exam_id: number
  exam_name: string
  created_at: string
  tags: string[]
}

export default function QuestionList() {
  const [searchQuery, setSearchQuery] = useState("")
  const [questions, setQuestions] = useState<Question[]>([])
  const [isCreateOverlayOpen, setIsCreateOverlayOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    fetchQuestions()
  }, [])

  async function fetchQuestions() {
    const { data: questionsData, error: questionsError } = await supabase
      .from("Questions")
      .select(`
        *,
        Exams (
          name
        )
      `)
      .order("created_at", { ascending: false })

    if (questionsError) {
      console.error("Error fetching questions:", questionsError)
    } else {
      const formattedQuestions = questionsData.map(question => ({
        ...question,
        exam_name: question.Exams.name
      }))
      setQuestions(formattedQuestions || [])
    }
  }

  const filteredQuestions = questions.filter(
    (question) =>
      question.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      question.exam_name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  async function handleDelete(questionId: number) {
    const { error } = await supabase.from("Questions").delete().eq("id", questionId)

    if (error) {
      console.error("Error deleting question:", error)
    } else {
      fetchQuestions()
    }
  }

  async function handleCopy(question: Question) {
    const newQuestion = {
      name: `${question.name} (Copy)`,
      type: question.type,
      exam_id: question.exam_id
    }

    const { error } = await supabase.from("Questions").insert([newQuestion])

    if (error) {
      console.error("Error copying question:", error)
    } else {
      fetchQuestions()
    }
  }

  async function handleCreateQuestion(name: string, type: string[]) {
    const newQuestion = {
      name,
      type,
      exam_id: null // Since this is a standalone question
    }

    const { error } = await supabase.from("Questions").insert([newQuestion])

    if (error) {
      console.error("Error creating question:", error)
    } else {
      fetchQuestions()
      setIsCreateOverlayOpen(false)
    }
  }

  function handleQuestionClick(question: Question) {
    router.push(`/my-questions/${question.id}`)
  }

  return (
    <main className="flex-1 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">My Questions</h1>
          <Button
            className="bg-[#2B2B2B] hover:bg-[#3B3B3B]"
            onClick={() => setIsCreateOverlayOpen(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Create question
          </Button>
        </div>

        {/* Search Bar */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4" />
          <Input
            type="text"
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 w-64"
          />
        </div>

        {/* Question Table */}
        <div className="bg-[#B8C2D1] rounded-lg overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-[1fr_200px_200px_200px_200px_48px] bg-[#9BA5B7] p-4 font-medium">
            <div>Name</div>
            <div>Tags</div>
            <div>Type</div>
            <div>Exam</div>
            <div>Date Changed</div>
            <div></div>
          </div>

          {/* Table Body */}
          <div className="divide-y divide-gray-200">
            {filteredQuestions.length === 0 ? (
              <div className="p-8 text-center text-gray-500">No questions yet. Click "Create question" to add one.</div>
            ) : (
              filteredQuestions.map((question) => (
                <div
                  key={question.id}
                  className="grid grid-cols-[1fr_200px_200px_200px_200px_48px] p-4 bg-[#8791A7] hover:bg-[#7A84999] items-center"
                >
                  <button onClick={() => handleQuestionClick(question)} className="text-left hover:underline">
                    {question.name}
                  </button>
                  <div>{question.tags?.join(", ") || "No tags"}</div>
                  <div>{question.type.join(", ")}</div>
                  <div>{question.exam_name || "No exam"}</div>
                  <div>{new Date(question.created_at).toLocaleDateString("no-NO")}</div>
                  <div className="flex justify-end">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleCopy(question)}>
                          Copy
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDelete(question.id)}>
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Create Question Overlay */}
        <CreateQuestionOverlay
          isOpen={isCreateOverlayOpen}
          onClose={() => setIsCreateOverlayOpen(false)}
          onCreateQuestion={handleCreateQuestion}
        />
      </div>
    </main>
  )
}

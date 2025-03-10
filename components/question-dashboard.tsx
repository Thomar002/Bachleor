"use client"

import { useState, useEffect } from "react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Plus, MoreVertical, User, Home, Layout } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { supabase } from "@/lib/supabaseClient"
import Link from "next/link"
import { CreateQuestionOverlay } from "./create-question-overlay"
import { useParams } from "next/navigation"

type SortField = 'created_at'
type SortOrder = 'asc' | 'desc'

interface Question {
  id: number
  name: string
  tags: string[]
  created_at: string
  exam_id: number
}

export default function QuestionDashboard({ examId, examName }: { examId: number; examName: string }) {
  const params = useParams()
  const [searchQuery, setSearchQuery] = useState("")
  const [questions, setQuestions] = useState<Question[]>([])
  const [isCreateOverlayOpen, setIsCreateOverlayOpen] = useState(false)
  const [selectedTag, setSelectedTag] = useState<string | null>(null)
  const [availableTags, setAvailableTags] = useState<string[]>([])
  const [sortField, setSortField] = useState<SortField>('created_at')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')

  // Legg til en funksjon for å bygge riktig URL
  const getQuestionUrl = (questionId: number) => {
    // Hvis vi er i subjects-ruten
    if (params.subjectId) {
      return `/subjects/${params.subjectId}/exams/${examId}/questions/${questionId}`
    }
    // Hvis vi er i my-exams-ruten
    return `/my-exams/${examId}/questions/${questionId}`
  }

  // 3. Only fetch questions if examId is valid
  useEffect(() => {
    if (examId) {
      fetchQuestions()
    } else {
      console.error("No examId provided to QuestionDashboard")
    }
  }, [examId]) // Make sure examId is in dependency array

  useEffect(() => {
    // Extract unique tags from all questions
    const tags = questions.reduce((acc, question) => {
      question.tags.forEach((tag) => {
        if (!acc.includes(tag)) {
          acc.push(tag)
        }
      })
      return acc
    }, [] as string[])
    setAvailableTags(tags)
  }, [questions])

  async function fetchQuestions() {
    const { data, error } = await supabase
      .from("Questions")
      .select("*")
      .eq("exam_id", examId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching questions:", error)
    } else {
      // Process the data to ensure tags is always an array
      const processedData = (data || []).map((question) => ({
        ...question,
        // Convert tags to array if it's not already
        tags: Array.isArray(question.tags)
          ? question.tags
          : typeof question.tags === "string"
            ? question.tags
              ? JSON.parse(question.tags)
              : []
            : [],
      }))
      setQuestions(processedData)
    }
  }

  const filteredQuestions = questions.filter(
    (question) =>
      question.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      (!selectedTag || question.tags.includes(selectedTag))
  )

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('asc')
    }
  }

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return '↕'
    return sortOrder === 'asc' ? '↑' : '↓'
  }

  const sortedQuestions = [...filteredQuestions].sort((a, b) => {
    const dateA = new Date(a.created_at).getTime()
    const dateB = new Date(b.created_at).getTime()
    return sortOrder === 'asc' ? dateA - dateB : dateB - dateA
  })

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
      tags: question.tags,
      exam_id: examId,
    }

    const { error } = await supabase.from("Questions").insert([newQuestion])

    if (error) {
      console.error("Error copying question:", error)
    } else {
      fetchQuestions()
    }
  }

  async function handleCreateQuestion(name: string, tags: string[]) {
    const newQuestion = {
      name,
      tags,
      exam_id: examId,
    }

    const { error } = await supabase.from("Questions").insert([newQuestion])

    if (error) {
      console.error("Error creating question:", error)
    } else {
      fetchQuestions()
    }
  }

  return (
    <>
      <main className="flex-1 p-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">{examName}</h1>
          </div>

          {/* Search and Filter Bar */}
          <div className="flex gap-4 mb-6">
            <Select value={selectedTag || "all"} onValueChange={(value) => setSelectedTag(value === "all" ? null : value)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by tag" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">No Tags</SelectItem>
                {availableTags.map((tag) => (
                  <SelectItem key={tag} value={tag}>
                    {tag}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4" />
              <Input
                type="text"
                placeholder="Search questions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-full"
              />
            </div>
            <Button className="bg-[#2B2B2B] hover:bg-[#3B3B3B]" onClick={() => setIsCreateOverlayOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Question
            </Button>
          </div>

          {/* Questions Table */}
          <div className="bg-[#B8C2D1] rounded-lg overflow-hidden">
            {/* Table Header */}
            <div className="grid grid-cols-[1fr_1fr_200px_48px] bg-[#9BA5B7] p-4 font-medium">
              <div>Name</div>
              <div>Tags</div>
              <div className="flex items-center gap-2 cursor-pointer" onClick={() => handleSort('created_at')}>
                Date changed {getSortIcon('created_at')}
              </div>
              <div></div>
            </div>

            {/* Table Body */}
            <div className="divide-y divide-gray-200">
              {sortedQuestions.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  No questions yet. Click "Add Question" to create one.
                </div>
              ) : (
                sortedQuestions.map((question) => (
                  <div
                    key={question.id}
                    className="grid grid-cols-[1fr_1fr_200px_48px] p-4 bg-[#8791A7] hover:bg-[#7A84999] items-center"
                  >
                    <Link
                      href={getQuestionUrl(question.id)}
                      className="hover:underline"
                    >
                      {question.name}
                    </Link>
                    <div>{question.tags.join(", ")}</div>
                    <div>{new Date(question.created_at).toLocaleDateString("no-NO")}</div>
                    <div className="flex justify-end">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleCopy(question)}>Copy</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDelete(question.id)}>Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>

      <CreateQuestionOverlay
        isOpen={isCreateOverlayOpen}
        onClose={() => setIsCreateOverlayOpen(false)}
        onCreateQuestion={handleCreateQuestion}
      />
    </>
  )
}

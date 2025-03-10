"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Plus, MoreVertical } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { supabase } from "@/lib/supabaseClient"
import { useRouter } from "next/navigation"
import { CreateQuestionOverlay } from "./create-question-overlay"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Question {
  id: number
  name: string
  type: string[]
  exam_id: number
  exam_name: string
  created_at: string
  tags: string[]
}

type SortField = 'created_at'
type SortOrder = 'asc' | 'desc'

export default function QuestionList() {
  const [questions, setQuestions] = useState<Question[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isCreateOverlayOpen, setIsCreateOverlayOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTag, setSelectedTag] = useState<string | null>(null)
  const [availableTags, setAvailableTags] = useState<string[]>([])
  const [sortField, setSortField] = useState<SortField>('created_at')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')
  const [selectedQuestions, setSelectedQuestions] = useState<number[]>([])
  const router = useRouter()

  useEffect(() => {
    fetchQuestions()
  }, [])

  async function fetchQuestions() {
    try {
      setIsLoading(true)
      setError(null)

      // First, get all questions
      const { data: questionsData, error: questionsError } = await supabase
        .from("Questions")
        .select("*")
        .order('created_at', { ascending: false })

      if (questionsError) throw new Error(`Database error: ${questionsError.message}`)
      if (!questionsData) throw new Error("No data returned from database")

      // Get all exams to map their names
      const { data: examsData, error: examsError } = await supabase
        .from("Exams")
        .select("id, name")

      if (examsError) throw new Error(`Database error: ${examsError.message}`)

      // Create a map of exam IDs to names
      const examMap = (examsData || []).reduce((acc, exam) => {
        acc[exam.id] = exam.name
        return acc
      }, {} as Record<string, string>)

      const formattedQuestions = questionsData.map(question => ({
        id: question.id,
        name: question.name || "Unnamed Question",
        type: Array.isArray(question.type) ? question.type : [],
        exam_id: question.exam_id,
        exam_name: examMap[question.exam_id] || "No exam",
        created_at: question.created_at,
        tags: question.tags === null ? [] :
          Array.isArray(question.tags) ? question.tags :
            typeof question.tags === 'string' ? JSON.parse(question.tags) : []
      }))

      setQuestions(formattedQuestions)

      // Extract unique tags for the filter dropdown
      const tags = formattedQuestions.flatMap(q => q.tags)
      setAvailableTags([...new Set(tags)])

    } catch (err) {
      console.error("Error in fetchQuestions:", err)
      setError(err instanceof Error ? err.message : "Failed to fetch questions")
    } finally {
      setIsLoading(false)
    }
  }

  const handleQuestionClick = (questionId: number, examId: number) => {
    const defaultType = "text"
    router.push(`/my-exams/${examId}/questions/${questionId}/${defaultType}`)
  }

  const handleDeleteQuestion = async (questionId: number) => {
    const { error } = await supabase.from("Questions").delete().eq("id", questionId)

    if (error) {
      console.error("Error deleting question:", error)
    } else {
      fetchQuestions()
    }
  }

  const handleCopy = async (question: Question) => {
    const newQuestion = {
      name: `${question.name} (Copy)`,
      tags: question.tags,
      exam_id: question.exam_id,
      type: question.type
    }

    const { error } = await supabase.from("Questions").insert([newQuestion])

    if (error) {
      console.error("Error copying question:", error)
    } else {
      fetchQuestions()
    }
  }

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

  const handleSelectQuestion = (questionId: number) => {
    setSelectedQuestions(prev =>
      prev.includes(questionId)
        ? prev.filter(id => id !== questionId)
        : [...prev, questionId]
    )
  }

  const handleSelectAll = () => {
    if (selectedQuestions.length === filteredQuestions.length) {
      setSelectedQuestions([])
    } else {
      setSelectedQuestions(filteredQuestions.map(q => q.id))
    }
  }

  const handleBulkDelete = async () => {
    if (!selectedQuestions.length) return

    const { error } = await supabase
      .from("Questions")
      .delete()
      .in("id", selectedQuestions)

    if (error) {
      console.error("Error deleting questions:", error)
    } else {
      setSelectedQuestions([])
      fetchQuestions()
    }
  }

  const handleBulkExport = () => {
    if (!selectedQuestions.length) return

    const questionsToExport = filteredQuestions.filter(q =>
      selectedQuestions.includes(q.id)
    )

    const dataStr = JSON.stringify(questionsToExport, null, 2)
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr)

    const exportFileDefaultName = 'questions-export.json'
    const linkElement = document.createElement('a')
    linkElement.setAttribute('href', dataUri)
    linkElement.setAttribute('download', exportFileDefaultName)
    linkElement.click()
  }

  const handleExport = (question: Question) => {
    const dataStr = JSON.stringify(question, null, 2)
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr)
    const exportFileDefaultName = `question-${question.id}-export.json`
    const linkElement = document.createElement('a')
    linkElement.setAttribute('href', dataUri)
    linkElement.setAttribute('download', exportFileDefaultName)
    linkElement.click()
  }

  const filteredQuestions = questions
    .filter(question =>
      question.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      (!selectedTag || (selectedTag === "none" ? question.tags.length === 0 : question.tags.includes(selectedTag)))
    )
    .sort((a, b) => {
      const dateA = new Date(a.created_at).getTime()
      const dateB = new Date(b.created_at).getTime()
      return sortOrder === 'asc' ? dateA - dateB : dateB - dateA
    })

  const handleCreateQuestion = async (name: string, tags: string[]) => {
    try {
      const newQuestion = {
        name,
        tags,
        exam_id: null, // You might want to set a default exam_id or handle this differently
      }

      const { data, error } = await supabase
        .from("Questions")
        .insert([newQuestion])
        .select()

      if (error) throw error

      fetchQuestions()
      setIsCreateOverlayOpen(false)
    } catch (err) {
      console.error("Error creating question:", err)
    }
  }

  return (
    <div className="container mx-auto py-6">
      {/* Header with Title and Bulk Actions */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-bold">My Questions</h1>
          {selectedQuestions.length > 0 && (
            <>
              <Button
                variant="destructive"
                onClick={handleBulkDelete}
                className="bg-red-600 hover:bg-red-700"
              >
                Delete Selected ({selectedQuestions.length})
              </Button>
              <Button
                onClick={handleBulkExport}
                className="bg-[#2B2B2B] hover:bg-[#3B3B3B]"
              >
                Export Selected ({selectedQuestions.length})
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Search, Filter, and Add Button Bar */}
      <div className="flex gap-4 mb-6">
        <Select value={selectedTag || "none"} onValueChange={(value) => setSelectedTag(value === "none" ? null : value)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by tag" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No Tags</SelectItem>
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
        <Button
          className="bg-[#2B2B2B] hover:bg-[#3B3B3B]"
          onClick={() => setIsCreateOverlayOpen(true)}
        >
          <Plus className="w-4 h-4 mr-2" />
          Create question
        </Button>
      </div>

      {/* Questions Table */}
      <div className="bg-[#B8C2D1] rounded-lg overflow-hidden">
        {/* Table Header */}
        <div className="grid grid-cols-[48px_1fr_200px_200px_200px_200px_48px] bg-[#9BA5B7] p-4 font-medium">
          <div>
            <Checkbox
              checked={selectedQuestions.length === filteredQuestions.length && filteredQuestions.length > 0}
              onCheckedChange={handleSelectAll}
            />
          </div>
          <div>Name</div>
          <div>Tags</div>
          <div>Type</div>
          <div>Exam</div>
          <div
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => handleSort('created_at')}
          >
            Date changed {getSortIcon('created_at')}
          </div>
          <div></div>
        </div>

        {/* Table Body */}
        {isLoading && (
          <div className="text-center py-8">Loading questions...</div>
        )}

        {error && (
          <div className="text-center py-8 text-red-500">Error: {error}</div>
        )}

        {!isLoading && !error && filteredQuestions.length === 0 && (
          <div className="text-center py-8">No questions found. Create your first question!</div>
        )}

        {!isLoading && !error && filteredQuestions.length > 0 && (
          <div className="divide-y divide-gray-200">
            {filteredQuestions.map((question) => (
              <div
                key={question.id}
                className="grid grid-cols-[48px_1fr_200px_200px_200px_200px_48px] p-4 bg-[#8791A7] hover:bg-[#7A84999] items-center"
              >
                <div>
                  <Checkbox
                    checked={selectedQuestions.includes(question.id)}
                    onCheckedChange={() => handleSelectQuestion(question.id)}
                  />
                </div>
                <button
                  onClick={() => handleQuestionClick(question.id, question.exam_id)}
                  className="text-left hover:underline"
                >
                  {question.name}
                </button>
                <div>{question.tags.join(", ")}</div>
                <div>{question.type.join(", ")}</div>
                <div>{question.exam_name}</div>
                <div>{new Date(question.created_at).toLocaleDateString()}</div>
                <div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleCopy(question)}>Copy</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleExport(question)}>Export</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDeleteQuestion(question.id)} className="text-red-600">Delete</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <CreateQuestionOverlay
        isOpen={isCreateOverlayOpen}
        onClose={() => setIsCreateOverlayOpen(false)}
        onCreateQuestion={handleCreateQuestion}
      />
    </div>
  )
}

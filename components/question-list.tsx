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

type SortField = 'created_at'
type SortOrder = 'asc' | 'desc'

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
  const [sortField, setSortField] = useState<SortField>('created_at')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')
  const [selectedQuestions, setSelectedQuestions] = useState<number[]>([])
  const [selectedTag, setSelectedTag] = useState<string | null>(null)
  const [availableTags, setAvailableTags] = useState<string[]>([])
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

  useEffect(() => {
    // Extract unique tags from all questions
    const tags = questions.reduce((acc, question) => {
      (question.tags || []).forEach((tag) => {
        if (!acc.includes(tag)) {
          acc.push(tag)
        }
      })
      return acc
    }, [] as string[])
    setAvailableTags(tags)
  }, [questions])

  const filteredQuestions = questions.filter(
    (question) =>
      (question.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        question.exam_name.toLowerCase().includes(searchQuery.toLowerCase())) &&
      (!selectedTag || (question.tags || []).includes(selectedTag))
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

  const handleSelectQuestion = (questionId: number) => {
    setSelectedQuestions(prev =>
      prev.includes(questionId)
        ? prev.filter(id => id !== questionId)
        : [...prev, questionId]
    )
  }

  const handleSelectAll = () => {
    if (selectedQuestions.length === sortedQuestions.length) {
      setSelectedQuestions([])
    } else {
      setSelectedQuestions(sortedQuestions.map(q => q.id))
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

    const questionsToExport = sortedQuestions.filter(q =>
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
          <Button
            className="bg-[#2B2B2B] hover:bg-[#3B3B3B]"
            onClick={() => setIsCreateOverlayOpen(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Create question
          </Button>
        </div>

        {/* Question Table */}
        <div className="bg-[#B8C2D1] rounded-lg overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-[48px_1fr_200px_200px_200px_200px_48px] bg-[#9BA5B7] p-4 font-medium">
            <div>
              <Checkbox
                checked={selectedQuestions.length === sortedQuestions.length && sortedQuestions.length > 0}
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
          <div className="divide-y divide-gray-200">
            {sortedQuestions.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                No questions yet. Click "Create question" to add one.
              </div>
            ) : (
              sortedQuestions.map((question) => (
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
                    onClick={() => handleQuestionClick(question)}
                    className="text-left hover:underline"
                  >
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

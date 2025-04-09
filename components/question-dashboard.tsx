"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
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
import { Checkbox } from "@/components/ui/checkbox"
import { RenameDialog } from "./rename-dialog"
import { toast } from "sonner"
import { HoverCard, HoverCardTrigger, HoverCardContent } from "@/components/ui/hover-card"

type SortField = 'created_at' | 'points'
type SortOrder = 'asc' | 'desc'

interface Question {
  id: number
  name: string
  tags: string[]
  created_at: string
  exam_id: number
  type: string[]
  points: number
}

interface QuestionDashboardProps {
  examId: number;
  examName: string;
  isPublic?: boolean;
}

export default function QuestionDashboard({ examId, examName, isPublic = false }: QuestionDashboardProps) {
  const router = useRouter()
  const params = useParams()
  const [searchQuery, setSearchQuery] = useState("")
  const [questions, setQuestions] = useState<Question[]>([])
  const [isCreateOverlayOpen, setIsCreateOverlayOpen] = useState(false)
  const [selectedTag, setSelectedTag] = useState<string | null>(null)
  const [availableTags, setAvailableTags] = useState<string[]>([])
  const [sortField, setSortField] = useState<SortField>('created_at')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')
  const [selectedQuestions, setSelectedQuestions] = useState<number[]>([])
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false)
  const [questionToRename, setQuestionToRename] = useState<Question | null>(null)
  const [totalPoints, setTotalPoints] = useState(0)

  // Legg til en funksjon for å bygge riktig URL
  const getQuestionUrl = (questionId: number, questionType: string[]) => {
    // Map the question type to the correct route path
    const typeToPath: Record<string, string> = {
      "True/False": "true-false",
      "Multiple Choice-single": "multiple-choice-single",
      "Multiple Choice-multi": "multiple-choice-multiple",
      "Equation": "equation",
      "Text": "text"
    }

    // Get the first type from the array and map it to the correct path
    // Default to "text" if no valid type is found
    const type = questionType[0]
    const path = typeToPath[type] || "text"

    // If we are in subjects route
    if (params.subjectId) {
      return `/subjects/${params.subjectId}/exams/${examId}/questions/${questionId}/${path}`
    }
    // If we are in my-exams route
    return `/my-exams/${examId}/questions/${questionId}/${path}`
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
      const processedData = (data || []).map((question) => ({
        ...question,
        tags: Array.isArray(question.tags)
          ? question.tags
          : typeof question.tags === "string"
            ? question.tags
              ? JSON.parse(question.tags)
              : []
            : [],
        type: Array.isArray(question.type)
          ? question.type
          : typeof question.type === "string"
            ? [question.type]  // If it's a string, wrap it in an array
            : [],
        points: question.points || 0
      }))
      setQuestions(processedData)

      // Calculate total points
      const total = processedData.reduce((sum, question) => sum + (question.points || 0), 0)
      setTotalPoints(total)
    }
  }

  const filteredQuestions = questions.filter(
    (question) =>
      question.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      (!selectedTag || (selectedTag === "none" ? question.tags.length === 0 : question.tags.includes(selectedTag)))
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
      toast.error("Failed to delete question")
    } else {
      toast.success("Question deleted successfully")
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
      toast.error("Failed to copy question")
    } else {
      toast.success("Question copied successfully")
      fetchQuestions()
    }
  }

  async function handleCreateQuestion(name: string, tags: string[]) {
    const newQuestion = {
      name,
      tags,
      exam_id: examId,
    }

    const { data, error } = await supabase.from("Questions").insert([newQuestion]).select()

    if (error) {
      console.error("Error creating question:", error)
      toast.error("Failed to create question")
    } else {
      toast.success("Question created successfully")
      // Process the new question data to ensure tags is handled correctly
      const processedNewQuestion = {
        ...data[0],
        tags: Array.isArray(data[0].tags)
          ? data[0].tags
          : typeof data[0].tags === "string"
            ? JSON.parse(data[0].tags)
            : []
      }

      // Update the questions state with the new question
      setQuestions(prevQuestions => [...prevQuestions, processedNewQuestion])
      setIsCreateOverlayOpen(false)
    }
  }

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

    // Create a JSON file and trigger download
    const dataStr = JSON.stringify(questionsToExport, null, 2)
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr)

    const exportFileDefaultName = 'questions-export.json'
    const linkElement = document.createElement('a')
    linkElement.setAttribute('href', dataUri)
    linkElement.setAttribute('download', exportFileDefaultName)
    linkElement.click()
  }

  // Add export function
  const handleExport = (question: Question) => {
    const dataStr = JSON.stringify(question, null, 2)
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr)
    const exportFileDefaultName = `question-${question.id}-export.json`
    const linkElement = document.createElement('a')
    linkElement.setAttribute('href', dataUri)
    linkElement.setAttribute('download', exportFileDefaultName)
    linkElement.click()
  }

  const handleRename = async (newName: string) => {
    if (!questionToRename) return

    const { error } = await supabase
      .from("Questions")
      .update({ name: newName })
      .eq("id", questionToRename.id)

    if (error) {
      console.error("Error renaming question:", error)
      toast.error("Failed to rename question")
    } else {
      toast.success("Question renamed successfully")
      fetchQuestions()
    }
  }

  return (
    <>
      <main className="flex-1 p-8">
        <div className="max-w-6xl mx-auto">
          {/* Header with Title and Bulk Actions */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-4">
              <h1 className="text-3xl font-bold">{examName}</h1>
              <span className="text-xl">Total points: {totalPoints}</span>
            </div>
          </div>

          {/* Search, Filter, and Add Button Bar */}
          <div className="flex gap-4 mb-6">
            {selectedQuestions.length > 0 ? (
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
                <div className="flex-1" /> {/* Spacer */}
              </>
            ) : (
              <>
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
                <div className="relative w-[270px]"> {/* Increased from 180px to 270px (1.5x) */}
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4" />
                  <Input
                    type="text"
                    placeholder="Search questions..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 w-full"
                  />
                </div>
                <div className="flex-1" /> {/* Spacer */}
              </>
            )}
            <Button
              className="bg-[#2B2B2B] hover:bg-[#3B3B3B]"
              onClick={() => setIsCreateOverlayOpen(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Question
            </Button>
          </div>

          {/* Questions Table */}
          <div className="bg-[#B8C2D1] rounded-lg overflow-hidden">
            {/* Table Header */}
            <div className="grid grid-cols-[48px_1fr_200px_200px_100px_200px_48px] bg-[#9BA5B7] p-4 font-medium">
              <div>
                <Checkbox
                  checked={selectedQuestions.length === sortedQuestions.length && sortedQuestions.length > 0}
                  onCheckedChange={handleSelectAll}
                />
              </div>
              <div>Name</div>
              <div>Type</div>
              <div>Tags</div>
              <div
                className="flex items-center gap-2 cursor-pointer"
                onClick={() => handleSort('points')}
              >
                Points {getSortIcon('points')}
              </div>
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
                  No questions yet. Click "Add Question" to create one.
                </div>
              ) : (
                sortedQuestions.map((question) => (
                  <div
                    key={question.id}
                    className="grid grid-cols-[48px_1fr_200px_200px_100px_200px_48px] p-4 bg-[#8791A7] hover:bg-[#7A84999] items-center"
                  >
                    <div>
                      <Checkbox
                        checked={selectedQuestions.includes(question.id)}
                        onCheckedChange={() => handleSelectQuestion(question.id)}
                      />
                    </div>
                    <HoverCard openDelay={400} closeDelay={0}>
                      <HoverCardTrigger asChild>
                        <button
                          onClick={() => router.push(getQuestionUrl(question.id, Array.isArray(question.type) ? question.type : [question.type]))}
                          className="text-left hover:underline"
                        >
                          {question.name}
                        </button>
                      </HoverCardTrigger>
                      <HoverCardContent
                        className="w-64 bg-[#2B2B2B] text-white p-3 rounded-lg shadow-lg pointer-events-none"
                        sideOffset={2}
                        align="start"
                        alignOffset={40}
                      >
                        <div className="space-y-1.5">
                          <h4 className="font-semibold text-sm">{question.name}</h4>
                          <div className="text-xs space-y-1">
                            <div className="flex justify-between">
                              <span>Date changed:</span>
                              <span>
                                {new Date(question.created_at).toLocaleString("no-NO", {
                                  year: 'numeric',
                                  month: '2-digit',
                                  day: '2-digit',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  hour12: false
                                })}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Type:</span>
                              <span>{Array.isArray(question.type) ? question.type.join(", ") : question.type}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Points:</span>
                              <span>{question.points || 0}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Tags:</span>
                              <span>{question.tags.join(", ")}</span>
                            </div>
                          </div>
                        </div>
                      </HoverCardContent>
                    </HoverCard>
                    <div>
                      {Array.isArray(question.type)
                        ? question.type.join(", ")
                        : question.type || ""}
                    </div>
                    <div>{question.tags.join(", ")}</div>
                    <div>{question.points || 0}</div>
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
                          <DropdownMenuItem
                            onClick={() => {
                              setQuestionToRename(question)
                              setIsRenameDialogOpen(true)
                            }}
                          >
                            Rename
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleExport(question)}>Export</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDelete(question.id)} className="text-red-600">
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
        </div>
      </main>

      <CreateQuestionOverlay
        isOpen={isCreateOverlayOpen}
        onClose={() => setIsCreateOverlayOpen(false)}
        onCreateQuestion={handleCreateQuestion}
        showExamField={false}  // Hide exam field in exam dashboard
      />
      <RenameDialog
        open={isRenameDialogOpen}
        onOpenChange={setIsRenameDialogOpen}
        currentName={questionToRename?.name || ""}
        onRename={handleRename}
      />
    </>
  )
}

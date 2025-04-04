"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Plus, MoreVertical, ChevronDown } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { supabase } from "@/lib/supabaseClient"
import { useRouter } from "next/navigation"
import { CreateQuestionOverlay } from "./create-question-overlay"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RenameDialog } from "./rename-dialog"
import { ConfirmDialog } from "./confirm-dialog"
import { toast } from "sonner"
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card"
import { formatDistanceToNow } from 'date-fns'

const selectTriggerStyles = "w-32 h-full bg-transparent border-0 hover:bg-transparent focus:ring-0 shadow-none p-0 font-inherit text-inherit text-base" // changed w-full to w-32
const selectContentStyles = "bg-[#8791A7] border-[#8791A7] text-base w-32" // added w-32

interface Question {
  id: number
  name: string
  type: string[]
  exam_id: number
  exam_name: string
  created_at: string
  tags: string[]
  points: number
}

type SortField = 'created_at'
type SortOrder = 'asc' | 'desc'
type QTIVersion = 'QTI 2.x' | 'QTI 3.x'

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
  const [exams, setExams] = useState<{ id: number; name: string }[]>([])
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false)
  const [questionToRename, setQuestionToRename] = useState<Question | null>(null)
  const [questionToDelete, setQuestionToDelete] = useState<Question | null>(null)
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false)

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

      const formattedQuestions = questionsData.map(question => {
        // Safely handle type field
        let questionType = [];
        try {
          if (typeof question.type === 'string') {
            questionType = [question.type];
          } else if (Array.isArray(question.type)) {
            questionType = question.type;
          }
        } catch (e) {
          console.error('Error parsing question type:', e);
        }

        // Safely handle tags field
        let questionTags = [];
        try {
          if (question.tags === null) {
            questionTags = [];
          } else if (Array.isArray(question.tags)) {
            questionTags = question.tags;
          } else if (typeof question.tags === 'string') {
            questionTags = JSON.parse(question.tags);
          }
        } catch (e) {
          console.error('Error parsing tags:', e);
        }

        return {
          id: question.id,
          name: question.name || "Unnamed Question",
          type: questionType,
          exam_id: question.exam_id,
          exam_name: examMap[question.exam_id] || "No exam",
          created_at: question.created_at,
          tags: questionTags,
          points: question.points || 0
        };
      });

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

  const handleQuestionClick = (questionId: number, examId: number, questionType: string[]) => {
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

    router.push(`/my-exams/${examId}/questions/${questionId}/${path}`)
  }

  const handleDeleteQuestion = async (questionId: number) => {
    const { error } = await supabase.from("Questions").delete().eq("id", questionId)

    if (error) {
      console.error("Error deleting question:", error)
      toast.error("Failed to delete question")
    } else {
      toast.success("Question deleted successfully")
      fetchQuestions()
    }
    setQuestionToDelete(null)
  }

  const handleCopy = async (question: Question) => {
    const newQuestion = {
      name: `${question.name} (Copy)`,
      tags: question.tags,
      exam_id: question.exam_id
    }

    const { error } = await supabase
      .from("Questions")
      .insert([newQuestion])

    if (error) {
      console.error("Error copying question:", error)
      toast.error("Failed to copy question")
    } else {
      toast.success("Question copied successfully")
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
    setShowBulkDeleteConfirm(false)
  }

  const handleBulkExport = (version: QTIVersion) => {
    if (!selectedQuestions.length) return

    toast.success(`Exporting ${selectedQuestions.length} questions in ${version} format`)
    // TODO: Implement actual QTI export
  }

  const handleExport = (question: Question, version: QTIVersion) => {
    toast.success(`Exporting question in ${version} format`)
    // TODO: Implement actual QTI export
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

  const handleCreateQuestion = async (name: string, tags: string[], examId: string | null) => {
    try {
      const newQuestion = {
        name,
        tags,
        exam_id: examId ? parseInt(examId) : null,
      }

      const { data, error } = await supabase
        .from("Questions")
        .insert([newQuestion])
        .select()

      if (error) throw error

      toast.success("Question created successfully")
      fetchQuestions()
      setIsCreateOverlayOpen(false)
    } catch (err) {
      console.error("Error creating question:", err)
      toast.error("Failed to create question")
    }
  }

  const handleExamChange = async (questionId: number, newExamId: string | null) => {
    const { error } = await supabase
      .from("Questions")
      .update({ exam_id: newExamId })
      .eq("id", questionId)

    if (error) {
      console.error("Error updating question exam:", error)
      toast.error("Failed to update question exam")
    } else {
      toast.success("Question exam updated successfully")
      fetchQuestions()
    }
  }

  useEffect(() => {
    async function fetchExams() {
      const { data, error } = await supabase
        .from("Exams")
        .select("id, name")
        .order('name', { ascending: true })

      if (error) {
        console.error("Error fetching exams:", error)
      } else {
        setExams(data || [])
      }
    }

    fetchExams()
  }, [])

  return (
    <div className="container mx-auto py-6">
      {/* Header with Title */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-bold">My Questions</h1>
        </div>
      </div>

      {/* Search, Filter, and Add Button Bar */}
      <div className="flex gap-4 mb-6">
        {selectedQuestions.length > 0 ? (
          <>
            <Button
              variant="destructive"
              onClick={() => setShowBulkDeleteConfirm(true)}
              disabled={selectedQuestions.length === 0}
            >
              Delete Selected ({selectedQuestions.length})
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="bg-[#2B2B2B] hover:bg-[#3B3B3B]">
                  Export Selected ({selectedQuestions.length})
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => handleBulkExport('QTI 2.x')}>
                  QTI 2.x
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleBulkExport('QTI 3.x')}>
                  QTI 3.x
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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
            <div className="relative w-[270px]"> {/* Match width with filter */}
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
          Create question
        </Button>
      </div>

      {/* Questions Table */}
      <div className="bg-[#B8C2D1] rounded-lg overflow-hidden">
        {/* Table Header */}
        <div className="grid grid-cols-[48px_1fr_200px_200px_100px_200px_200px_48px] bg-[#9BA5B7] p-4 font-medium">
          <div>
            <Checkbox
              checked={selectedQuestions.length === filteredQuestions.length && filteredQuestions.length > 0}
              onCheckedChange={handleSelectAll}
            />
          </div>
          <div>Name</div>
          <div>Type</div>
          <div>Tags</div>
          <div>Points</div>
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
                className="grid grid-cols-[48px_1fr_200px_200px_100px_200px_200px_48px] p-4 bg-[#8791A7] hover:bg-[#7A84999] items-center"
              >
                <div>
                  <Checkbox
                    checked={selectedQuestions.includes(question.id)}
                    onCheckedChange={() => handleSelectQuestion(question.id)}
                  />
                </div>
                <HoverCard openDelay={800} closeDelay={0}>
                  <HoverCardTrigger asChild>
                    <button
                      onClick={() => handleQuestionClick(question.id, question.exam_id, question.type)}
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
                          <span>{question.type.join(", ")}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Points:</span>
                          <span>{question.points || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Exam:</span>
                          <span>{exams.find(e => e.id === question.exam_id)?.name || 'None'}</span>
                        </div>
                        {question.tags.length > 0 && (
                          <div className="mt-1.5 pt-1.5 border-t border-gray-600">
                            <div className="flex flex-wrap gap-1">
                              {question.tags.map((tag, index) => (
                                <span
                                  key={index}
                                  className="px-1.5 py-0.5 bg-[#3B3B3B] rounded-full text-xs"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </HoverCardContent>
                </HoverCard>
                <div>{question.type.join(", ")}</div>
                <div>{question.tags.join(", ")}</div>
                <div>{question.points || 0}</div>
                <div>
                  <Select
                    value={question.exam_id?.toString() || "none"}
                    onValueChange={(value) => handleExamChange(question.id, value === "none" ? null : value)}
                  >
                    <SelectTrigger className={selectTriggerStyles}>
                      <SelectValue>
                        {exams.find(e => e.id === question.exam_id)?.name || "No exam"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className={selectContentStyles}>
                      <SelectItem value="none">No exam</SelectItem>
                      {exams.map((exam) => (
                        <SelectItem key={exam.id} value={exam.id.toString()}>
                          {exam.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>{new Date(question.created_at).toLocaleDateString("no-NO")}</div>
                <div>
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
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                            Export
                          </DropdownMenuItem>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem onClick={() => handleExport(question, 'QTI 2.x')}>
                            QTI 2.x
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleExport(question, 'QTI 3.x')}>
                            QTI 3.x
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      <DropdownMenuItem
                        onClick={() => setQuestionToDelete(question)}
                        className="text-red-600"
                      >
                        Delete
                      </DropdownMenuItem>
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
        showExamField={true}  // Show exam field in question list
      />
      <RenameDialog
        open={isRenameDialogOpen}
        onOpenChange={setIsRenameDialogOpen}
        currentName={questionToRename?.name || ""}
        onRename={handleRename}
      />
      <ConfirmDialog
        open={questionToDelete !== null}
        onOpenChange={(open) => !open && setQuestionToDelete(null)}
        onConfirm={() => questionToDelete && handleDeleteQuestion(questionToDelete.id)}
        title="Delete Question"
        description="Are you sure you want to delete this question? This action cannot be undone."
      />
      <ConfirmDialog
        open={showBulkDeleteConfirm}
        onOpenChange={setShowBulkDeleteConfirm}
        onConfirm={handleBulkDelete}
        title="Delete Multiple Questions"
        description={`Are you sure you want to delete ${selectedQuestions.length} selected questions? This action cannot be undone.`}
      />
    </div>
  )
}

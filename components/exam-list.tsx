"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Plus, MoreVertical, ArrowUpDown, ChevronDown } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { supabase } from "@/lib/supabaseClient"
import { useRouter } from "next/navigation"
import { CreateExamOverlay } from "./create-exam-overlay"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RenameDialog } from "./rename-dialog"

const selectTriggerStyles = "w-32 h-full bg-transparent border-0 hover:bg-transparent focus:ring-0 shadow-none p-0 font-inherit text-inherit text-base" // changed w-full to w-32
const selectContentStyles = "bg-[#8791A7] border-[#8791A7] text-base w-32" // added w-32

interface Exam {
  id: number
  name: string
  created_at: string
  description: string
  subject_id: string
}

type SortField = 'subject_id' | 'created_at'
type SortOrder = 'asc' | 'desc'

export default function ExamList({ subjectId = null }: { subjectId?: string | null }) {
  const [searchQuery, setSearchQuery] = useState("")
  const [exams, setExams] = useState<Exam[]>([])
  const [isCreateOverlayOpen, setIsCreateOverlayOpen] = useState(false)
  const [sortField, setSortField] = useState<SortField>('created_at')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')
  const router = useRouter()
  const [subjects, setSubjects] = useState<{ id: string; name: string }[]>([])
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false)
  const [examToRename, setExamToRename] = useState<Exam | null>(null)

  useEffect(() => {
    fetchExams()
  }, [subjectId]) // Legg til subjectId som dependency

  async function fetchExams() {
    let query = supabase.from("Exams").select("*")

    if (subjectId) {
      const normalizedSubjectId = subjectId.toLowerCase()
      console.log("Fetching exams for subject:", normalizedSubjectId)
      query = query.eq("subject_id", normalizedSubjectId)
    }

    const { data, error } = await query.order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching exams:", error)
    } else {
      console.log("Fetched exams:", data)
      setExams(data || [])
    }
  }

  const filteredExams = exams.filter(
    (exam) =>
      exam.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exam.description.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // If clicking the same field, toggle the order
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      // If clicking a new field, set it as the sort field and default to ascending
      setSortField(field)
      setSortOrder('asc')
    }
  }

  const sortedExams = [...filteredExams].sort((a, b) => {
    if (sortField === 'subject_id') {
      const subjectA = (a.subject_id || '').toLowerCase()
      const subjectB = (b.subject_id || '').toLowerCase()
      return sortOrder === 'asc'
        ? subjectA.localeCompare(subjectB)
        : subjectB.localeCompare(subjectA)
    } else {
      const dateA = new Date(a.created_at).getTime()
      const dateB = new Date(b.created_at).getTime()
      return sortOrder === 'asc'
        ? dateA - dateB
        : dateB - dateA
    }
  })

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return '↕'
    return sortOrder === 'asc' ? '↑' : '↓'
  }

  async function handleDelete(examId: number) {
    const { error } = await supabase.from("Exams").delete().eq("id", examId)

    if (error) {
      console.error("Error deleting exam:", error)
    } else {
      fetchExams()
    }
  }

  async function handleCopy(exam: Exam) {
    const newExam = {
      name: `${exam.name} (Copy)`,
      description: exam.description,
      subject_id: exam.subject_id,
    }

    const { error } = await supabase.from("Exams").insert([newExam])

    if (error) {
      console.error("Error copying exam:", error)
    } else {
      fetchExams()
    }
  }

  async function handleCreateExam(name: string, description: string, subjectId: string | null) {
    const newExam = {
      name,
      description,
      subject_id: subjectId,
    }

    const { error } = await supabase.from("Exams").insert([newExam])

    if (error) {
      console.error("Error creating exam:", error)
    } else {
      fetchExams()
    }
  }

  function handleExport(examId: number) {
    console.log(`Export exam with id: ${examId}`)
    // Implement export logic here
  }

  function handleExamClick(exam: Exam) {
    if (subjectId) {
      router.push(`/subjects/${subjectId}/exams/${exam.id}`)
    } else {
      router.push(`/my-exams/${exam.id}`)
    }
  }

  useEffect(() => {
    async function fetchSubjects() {
      try {
        // First try to fetch from Supabase
        const { data, error } = await supabase.from("Subjects").select("id, name")

        if (error) {
          console.error("Error fetching subjects from Supabase:", error)
          // Fall back to hardcoded data if there's an error
          setHardcodedSubjects()
        } else if (data && data.length > 0) {
          console.log("Subjects fetched from Supabase:", data)
          setSubjects(data)
        } else {
          console.log("No subjects found in Supabase, using hardcoded data")
          setHardcodedSubjects()
        }
      } catch (error) {
        console.error("Failed to fetch subjects:", error)
        setHardcodedSubjects()
      }
    }

    fetchSubjects()
  }, [])

  // Hardcoded subjects as fallback
  function setHardcodedSubjects() {
    const hardcodedSubjects = [
      { id: "ikt210", name: "IKT210" },
      { id: "ikt211", name: "IKT211" },
      { id: "ikt212", name: "IKT212" },
      { id: "ikt213", name: "IKT213" },
      { id: "ikt214", name: "IKT214" }
    ]
    setSubjects(hardcodedSubjects)
  }

  const handleSubjectChange = async (examId: number, newSubjectId: string | null) => {
    const finalSubjectId = newSubjectId ? newSubjectId.toLowerCase() : null
    const { error } = await supabase
      .from("Exams")
      .update({ subject_id: finalSubjectId })
      .eq("id", examId)

    if (error) {
      console.error("Error updating exam subject:", error)
    } else {
      fetchExams()
    }
  }

  const handleRename = async (newName: string) => {
    if (!examToRename) return

    const { error } = await supabase
      .from("Exams")
      .update({ name: newName })
      .eq("id", examToRename.id)

    if (error) {
      console.error("Error renaming exam:", error)
    } else {
      fetchExams()
    }
  }

  return (
    <main className="flex-1 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">{subjectId ? `Exams for ${subjectId}` : "My Exams"}</h1>
        </div>

        {/* Search Bar and Create Button */}
        <div className="flex gap-4 mb-6">
          <div className="relative w-[270px]"> {/* Increased from 180px to 270px (1.5x) */}
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4" />
            <Input
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-full"
            />
          </div>
          <div className="flex-1" /> {/* Spacer */}
          <Button
            className="bg-[#2B2B2B] hover:bg-[#3B3B3B]"
            onClick={() => setIsCreateOverlayOpen(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Create exam
          </Button>
        </div>

        {/* Exam Table */}
        <div className="bg-[#B8C2D1] rounded-lg overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-[1fr_1fr_200px_200px_48px] bg-[#9BA5B7] p-4 font-medium">
            <div>Name</div>
            <div>Description</div>
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => handleSort('subject_id')}>
              Subject {getSortIcon('subject_id')}
            </div>
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => handleSort('created_at')}>
              Date changed {getSortIcon('created_at')}
            </div>
            <div></div>
          </div>

          {/* Table Body */}
          <div className="divide-y divide-gray-200">
            {sortedExams.length === 0 ? (
              <div className="p-8 text-center text-gray-500">No exams yet. Click "Create exam" to add one.</div>
            ) : (
              sortedExams.map((exam) => (
                <div
                  key={exam.id}
                  className="grid grid-cols-[1fr_1fr_200px_200px_48px] p-4 bg-[#8791A7] hover:bg-[#7A84999] items-center"
                >
                  <button onClick={() => handleExamClick(exam)} className="text-left hover:underline">
                    {exam.name}
                  </button>
                  <div>{exam.description}</div>
                  <div>
                    <Select
                      value={exam.subject_id || "none"}
                      onValueChange={(value) => handleSubjectChange(exam.id, value === "none" ? null : value)}
                    >
                      <SelectTrigger className={selectTriggerStyles}>
                        <SelectValue>
                          {subjects.find(s => s.id === exam.subject_id)?.name || "No subject"}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent className={selectContentStyles}>
                        <SelectItem value="none">No subject</SelectItem>
                        {subjects.map((subject) => (
                          <SelectItem key={subject.id} value={subject.id}>
                            {subject.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>{new Date(exam.created_at).toLocaleDateString("no-NO")}</div>
                  <div className="flex justify-end">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleCopy(exam)}>Copy</DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setExamToRename(exam)
                            setIsRenameDialogOpen(true)
                          }}
                        >
                          Rename
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleExport(exam.id)}>Export</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDelete(exam.id)} className="text-red-600">
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

        {/* Create Exam Overlay */}
        <CreateExamOverlay
          isOpen={isCreateOverlayOpen}
          onClose={() => setIsCreateOverlayOpen(false)}
          onCreateExam={handleCreateExam}
          subjectId={subjectId}
        />
        <RenameDialog
          open={isRenameDialogOpen}
          onOpenChange={setIsRenameDialogOpen}
          currentName={examToRename?.name || ""}
          onRename={handleRename}
        />
      </div>
    </main>
  )
}


"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, MoreVertical, ArrowUpDown } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { supabase } from "@/lib/supabaseClient"
import { toast } from "sonner"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { ConfirmDialog } from "./confirm-dialog"

interface DeletedExam {
  id: number
  name: string
  deleted_at: string
  subject_id: string | null
  description: string | null
}

type SortField = 'name' | 'deleted_at'
type SortOrder = 'asc' | 'desc'

export default function DeletedExamList() {
  const [deletedExams, setDeletedExams] = useState<DeletedExam[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [sortField, setSortField] = useState<SortField>('deleted_at')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')
  const [examToDelete, setExamToDelete] = useState<DeletedExam | null>(null)

  const fetchDeletedExams = async () => {
    const { data, error } = await supabase
      .from("Exams")
      .select("*")
      .eq("is_deleted", true)

    if (error) {
      console.error("Error fetching deleted exams:", error)
    } else {
      setDeletedExams(data || [])
    }
  }

  useEffect(() => {
    fetchDeletedExams()
  }, [])

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return '↕'
    return sortOrder === 'asc' ? '↑' : '↓'
  }

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('asc')
    }
  }

  const filteredAndSortedExams = deletedExams
    .filter(exam =>
      exam.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (exam.description?.toLowerCase() || "").includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      const multiplier = sortOrder === 'asc' ? 1 : -1
      if (sortField === 'name') {
        return multiplier * a.name.localeCompare(b.name)
      } else {
        return multiplier * (new Date(a.deleted_at).getTime() - new Date(b.deleted_at).getTime())
      }
    })

  const handleRestore = async (examId: number) => {
    const { error } = await supabase
      .from("Exams")
      .update({ is_deleted: false })
      .eq("id", examId)

    if (error) {
      console.error("Error restoring exam:", error)
      toast.error("Failed to restore exam")
    } else {
      toast.success("Exam restored successfully")
      fetchDeletedExams()
    }
  }

  const handlePermanentDelete = async (examId: number) => {
    const { error } = await supabase
      .from("Exams")
      .delete()
      .eq("id", examId)

    if (error) {
      console.error("Error permanently deleting exam:", error)
      toast.error("Failed to permanently delete exam")
    } else {
      toast.success("Exam permanently deleted")
      fetchDeletedExams()
    }
  }

  return (
    <main className="flex-1 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Deleted Exams</h1>
        </div>

        {/* Search Bar */}
        <div className="flex gap-4 mb-6">
          <div className="relative w-[270px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4" />
            <Input
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-full"
            />
          </div>
        </div>

        {/* Exam Table */}
        <div className="bg-[#B8C2D1] rounded-lg overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-[1fr_1fr_200px_200px_48px] bg-[#9BA5B7] p-4 font-medium">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => handleSort('name')}>
              Name {getSortIcon('name')}
            </div>
            <div>Description</div>
            <div>Subject</div>
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => handleSort('deleted_at')}>
              Deleted at {getSortIcon('deleted_at')}
            </div>
            <div></div>
          </div>

          {/* Table Body */}
          <div className="divide-y divide-gray-200">
            {filteredAndSortedExams.length === 0 ? (
              <div className="p-8 text-center text-gray-500">No deleted exams found.</div>
            ) : (
              filteredAndSortedExams.map((exam) => (
                <div
                  key={exam.id}
                  className="grid grid-cols-[1fr_1fr_200px_200px_48px] p-4 bg-[#8791A7] hover:bg-[#7A84999] items-center"
                >
                  <div>{exam.name}</div>
                  <div>{exam.description || "-"}</div>
                  <div>{exam.subject_id?.toUpperCase() || "No subject"}</div>
                  <div>{new Date(exam.deleted_at).toLocaleDateString("no-NO")}</div>
                  <div className="flex justify-end">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleRestore(exam.id)}>
                          Restore
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setExamToDelete(exam)}
                          className="text-red-600"
                        >
                          Delete Permanently
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
      <ConfirmDialog
        open={examToDelete !== null}
        onOpenChange={(open) => !open && setExamToDelete(null)}
        onConfirm={() => {
          if (examToDelete) {
            handlePermanentDelete(examToDelete.id)
            setExamToDelete(null)
          }
        }}
        title="Delete Exam Permanently"
        description="Are you sure you want to permanently delete this exam? This action cannot be undone."
      />
    </main>
  )
}

"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { supabase } from "@/lib/supabaseClient"

interface CreateQuestionOverlayProps {
  isOpen: boolean
  onClose: () => void
  onCreateQuestion: (name: string, tags: string[], examId: string | null) => void
  showExamField?: boolean
}

export function CreateQuestionOverlay({ isOpen, onClose, onCreateQuestion, showExamField = false }: CreateQuestionOverlayProps) {
  const [name, setName] = useState("")
  const [tags, setTags] = useState("")
  const [selectedExam, setSelectedExam] = useState<string | null>(null)
  const [exams, setExams] = useState<{ id: number; name: string }[]>([])

  useEffect(() => {
    if (isOpen && showExamField) {
      fetchExams()
    }
  }, [isOpen, showExamField])

  useEffect(() => {
    if (isOpen) {
      setName("")
      setTags("")
      setSelectedExam(null)
    }
  }, [isOpen])

  const fetchExams = async () => {
    const { data, error } = await supabase
      .from("Exams")
      .select("id, name")

    if (error) {
      console.error("Error fetching exams:", error)
    } else {
      setExams(data || [])
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onCreateQuestion(
      name,
      tags
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag),
      showExamField ? selectedExam : null  // Always pass a value, null if no exam selected
    )
    setName("")
    setTags("")
    setSelectedExam(null)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Question</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Question Name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tags">Tags (comma-separated)</Label>
            <Input id="tags" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="tag1, tag2, tag3" />
          </div>
          {showExamField && (
            <div className="space-y-2">
              <Label htmlFor="exam">Exam</Label>
              <Select value={selectedExam || ""} onValueChange={setSelectedExam}>
                <SelectTrigger id="exam">
                  <SelectValue placeholder="Select an exam">
                    {selectedExam ? exams.find(e => e.id.toString() === selectedExam)?.name : "Select an exam"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {exams.map((exam) => (
                    <SelectItem key={exam.id} value={exam.id.toString()}>
                      {exam.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <Button type="submit">Add Question</Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}


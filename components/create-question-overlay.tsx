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
}

export function CreateQuestionOverlay({ isOpen, onClose, onCreateQuestion }: CreateQuestionOverlayProps) {
  const [name, setName] = useState("")
  const [tags, setTags] = useState("")
  const [selectedExam, setSelectedExam] = useState<string>("")
  const [exams, setExams] = useState<{ id: string; name: string }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isOpen) {
      fetchExams()
      // Reset form when opening
      setName("")
      setTags("")
      setSelectedExam("")
    }
  }, [isOpen])

  async function fetchExams() {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from("Exams")
        .select("id, name")
        .order('name', { ascending: true })

      if (error) throw error

      if (data) {
        setExams(data)
      }
    } catch (error) {
      console.error("Error fetching exams:", error)
    } finally {
      setLoading(false)
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
      selectedExam || null
    )
    setName("")
    setTags("")
    setSelectedExam("")
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
          <div className="space-y-2">
            <Label htmlFor="exam">Exam (Optional)</Label>
            <Select value={selectedExam} onValueChange={setSelectedExam}>
              <SelectTrigger id="exam">
                <SelectValue placeholder="Select an exam">
                  {selectedExam ? exams.find(e => e.id.toString() === selectedExam)?.name : "Select an exam"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {loading ? (
                  <SelectItem value="loading" disabled>Loading exams...</SelectItem>
                ) : exams.length > 0 ? (
                  exams.map((exam) => (
                    <SelectItem key={exam.id} value={exam.id.toString()}>
                      {exam.name}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="no-exams" disabled>No exams available</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
          <Button type="submit">Add Question</Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}


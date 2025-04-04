"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { supabase } from "@/lib/supabaseClient"

interface CreateExamOverlayProps {
  isOpen: boolean
  onClose: () => void
  onCreateExam: (name: string, description: string | null, subjectId: string | null) => void
  subjectId?: string | null
}

export function CreateExamOverlay({ isOpen, onClose, onCreateExam, subjectId = null }: CreateExamOverlayProps) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  // Konverter subjectId til små bokstaver med en gang
  const [selectedSubject, setSelectedSubject] = useState(subjectId?.toLowerCase() || "")
  const [subjects, setSubjects] = useState<{ id: string; name: string }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isOpen && !subjectId) {
      fetchSubjects()
    }
  }, [isOpen, subjectId])

  useEffect(() => {
    if (subjectId) {
      setSelectedSubject(subjectId.toLowerCase())
    }
  }, [subjectId])

  async function fetchSubjects() {
    setLoading(true)
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
    } finally {
      setLoading(false)
    }
  }

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Only use selectedSubject if one is selected
    const finalSubjectId = selectedSubject ? selectedSubject.toLowerCase() : null
    // Pass null if description is empty
    const finalDescription = description.trim() || null
    onCreateExam(name, finalDescription, finalSubjectId)
    setName("")
    setDescription("")
    setSelectedSubject("")
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Exam</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter description"
            />
          </div>
          {!subjectId && (
            <div className="space-y-2">
              <Label htmlFor="subject">Subject (Optional)</Label>
              <Select
                value={selectedSubject}
                onValueChange={(value) => {
                  console.log('Selected value:', value); // Add this for debugging
                  setSelectedSubject(value);
                }}
              >
                <SelectTrigger id="subject" className="w-full">
                  <SelectValue placeholder="Select a subject">
                    {subjects.find(s => s.id === selectedSubject)?.name || "Select a subject"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {loading ? (
                    <SelectItem value="loading" disabled>Loading subjects...</SelectItem>
                  ) : subjects.length > 0 ? (
                    subjects.map((subject) => (
                      <SelectItem key={subject.id} value={subject.id}>
                        {subject.name}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-subjects" disabled>No subjects available</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          )}
          <Button type="submit">Create Exam</Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}


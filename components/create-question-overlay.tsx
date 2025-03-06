"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface CreateQuestionOverlayProps {
  isOpen: boolean
  onClose: () => void
  onCreateQuestion: (name: string, tags: string[]) => void
}

export function CreateQuestionOverlay({ isOpen, onClose, onCreateQuestion }: CreateQuestionOverlayProps) {
  const [name, setName] = useState("")
  const [tags, setTags] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onCreateQuestion(
      name,
      tags
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag),
    )
    setName("")
    setTags("")
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
          <Button type="submit">Add Question</Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}


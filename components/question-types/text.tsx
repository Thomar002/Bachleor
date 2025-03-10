"use client"

import { useState, useRef } from "react"
import { Menu, Bot } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { EditorToolbar } from "../editor-toolbar"
import { QuestionTypeDialog } from "../question-type-dialog"

interface Attachment {
  type: 'image' | 'video' | 'file';
  url: string;
  name: string;
}

export function Text() {
  const [displayName, setDisplayName] = useState("")
  const [answer, setAnswer] = useState("")
  const [isTypeDialogOpen, setIsTypeDialogOpen] = useState(false)
  const [type, setType] = useState<string[]>([])
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const questionTextareaRef = useRef<HTMLTextAreaElement>(null)

  const handleTypeChange = (newTypes: string[]) => {
    setType(newTypes)
    setIsTypeDialogOpen(false)
  }

  const handleBold = () => {
    if (questionTextareaRef.current) {
      const start = questionTextareaRef.current.selectionStart
      const end = questionTextareaRef.current.selectionEnd
      const text = questionTextareaRef.current.value
      const selectedText = text.substring(start, end)
      const newText = text.substring(0, start) + `**${selectedText}**` + text.substring(end)
      questionTextareaRef.current.value = newText
    }
  }

  const handleItalic = () => {
    if (questionTextareaRef.current) {
      const start = questionTextareaRef.current.selectionStart
      const end = questionTextareaRef.current.selectionEnd
      const text = questionTextareaRef.current.value
      const selectedText = text.substring(start, end)
      const newText = text.substring(0, start) + `*${selectedText}*` + text.substring(end)
      questionTextareaRef.current.value = newText
    }
  }

  const handleUnderline = () => {
    if (questionTextareaRef.current) {
      const start = questionTextareaRef.current.selectionStart
      const end = questionTextareaRef.current.selectionEnd
      const text = questionTextareaRef.current.value
      const selectedText = text.substring(start, end)
      const newText = text.substring(0, start) + `__${selectedText}__` + text.substring(end)
      questionTextareaRef.current.value = newText
    }
  }

  const handleAlign = (alignment: 'left' | 'center' | 'right' | 'justify') => {
    if (questionTextareaRef.current) {
      // Apply alignment to the current paragraph
      const text = questionTextareaRef.current.value
      const start = questionTextareaRef.current.selectionStart
      const textBeforeCursor = text.substring(0, start)
      const textAfterCursor = text.substring(start)

      // Find the current paragraph
      const lastNewLine = textBeforeCursor.lastIndexOf('\n')
      const nextNewLine = textAfterCursor.indexOf('\n')

      const startPos = lastNewLine === -1 ? 0 : lastNewLine + 1
      const endPos = nextNewLine === -1 ? text.length : start + nextNewLine

      const newText = text.substring(0, startPos) +
        `<div style="text-align: ${alignment}">` +
        text.substring(startPos, endPos) +
        '</div>' +
        text.substring(endPos)

      questionTextareaRef.current.value = newText
    }
  }

  const handleFontChange = (font: string) => {
    if (questionTextareaRef.current) {
      const start = questionTextareaRef.current.selectionStart
      const end = questionTextareaRef.current.selectionEnd
      const text = questionTextareaRef.current.value
      const selectedText = text.substring(start, end)
      const newText = text.substring(0, start) +
        `<span style="font-family: ${font}">` +
        selectedText +
        '</span>' +
        text.substring(end)
      questionTextareaRef.current.value = newText
    }
  }

  const handleSizeChange = (size: string) => {
    if (questionTextareaRef.current) {
      const start = questionTextareaRef.current.selectionStart
      const end = questionTextareaRef.current.selectionEnd
      const text = questionTextareaRef.current.value
      const selectedText = text.substring(start, end)
      const newText = text.substring(0, start) +
        `<span style="font-size: ${size}px">` +
        selectedText +
        '</span>' +
        text.substring(end)
      questionTextareaRef.current.value = newText
    }
  }

  const handleFileUpload = (type: 'image' | 'video' | 'file') => {
    if (fileInputRef.current) {
      fileInputRef.current.accept = type === 'image' ? 'image/*' :
        type === 'video' ? 'video/*' :
          '*/*'
      fileInputRef.current.click()
    }
  }

  const handleFileSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Here you would typically upload the file to your server
      // For now, we'll just create a local URL
      const url = URL.createObjectURL(file)
      const newAttachment: Attachment = {
        type: file.type.startsWith('image/') ? 'image' :
          file.type.startsWith('video/') ? 'video' :
            'file',
        url,
        name: file.name
      }
      setAttachments([...attachments, newAttachment])
    }
  }

  return (
    <div className="bg-gray-50">
      <div className="border-b bg-white">
        <div className="flex items-center gap-4 p-4">
          <div className="mb-8 flex gap-4">
            <Button
              onClick={() => setIsTypeDialogOpen(true)}
              className="flex items-center gap-2"
            >
              <Menu className="h-5 w-5" />
              Question Type
            </Button>
            <Button className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              AI creator
            </Button>
          </div>
        </div>
        <div className="p-4 border-t">
          <h1 className="text-xl font-semibold">Text Question</h1>
        </div>
        <div className="px-4 pb-4">
          <Input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Enter display name..."
            className="max-w-md mx-auto"
          />
        </div>
        <EditorToolbar
          onBold={handleBold}
          onItalic={handleItalic}
          onUnderline={handleUnderline}
          onAlign={handleAlign}
          onFontChange={handleFontChange}
          onSizeChange={handleSizeChange}
          onImageUpload={() => handleFileUpload('image')}
          onVideoUpload={() => handleFileUpload('video')}
          onFileUpload={() => handleFileUpload('file')}
        />
      </div>

      <div className="container mx-auto p-6 max-w-3xl">
        <div className="flex gap-6">
          <div className="flex-1">
            <Textarea
              ref={questionTextareaRef}
              className="text-lg mb-8"
              placeholder="Enter your question description here..."
            />
            <div className="space-y-4">
              <h2 className="font-medium">Correct Answer</h2>
              <Textarea
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                className="min-h-[200px]"
                placeholder="Enter the correct answer here..."
              />
            </div>
          </div>

          {attachments.length > 0 && (
            <div className="w-64 space-y-4">
              <h2 className="font-medium">Attachments</h2>
              {attachments.map((attachment, index) => (
                <div key={index} className="border rounded p-2">
                  {attachment.type === 'image' && (
                    <img src={attachment.url} alt={attachment.name} className="w-full" />
                  )}
                  {attachment.type === 'video' && (
                    <video src={attachment.url} controls className="w-full" />
                  )}
                  {attachment.type === 'file' && (
                    <a href={attachment.url} download={attachment.name} className="text-blue-500 hover:underline">
                      {attachment.name}
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        onChange={handleFileSelected}
      />

      <QuestionTypeDialog
        open={isTypeDialogOpen}
        onOpenChange={setIsTypeDialogOpen}
        onTypeSelect={handleTypeChange}
        currentTypes={type}
      />
    </div>
  )
}

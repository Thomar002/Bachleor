"use client"

import { useState, useRef } from "react"
import { Menu, Bot, Check, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { EditorToolbar } from "../editor-toolbar"
import { QuestionTypeDialog } from "../question-type-dialog"

interface Option {
  id: string
  text: string
  isCorrect: boolean
}

interface Attachment {
  type: 'image' | 'video' | 'file'
  url: string
  name: string
}

interface Props {
  questionName: string;
}

export function MultipleChoiceSingle({ questionName }: Props) {
  const [displayName, setDisplayName] = useState("")
  const [options, setOptions] = useState<Option[]>([
    { id: "1", text: "Option 1", isCorrect: false },
    { id: "2", text: "Option 2", isCorrect: false },
    { id: "3", text: "Option 3", isCorrect: false },
  ])
  const [isTypeDialogOpen, setIsTypeDialogOpen] = useState(false)
  const [type, setType] = useState<string[]>([])
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const questionTextareaRef = useRef<HTMLTextAreaElement>(null)

  const handleTypeChange = (newTypes: string[]) => {
    setType(newTypes)
    setIsTypeDialogOpen(false)
  }

  const handleOptionChange = (id: string, text: string) => {
    setOptions(options.map((opt) => (opt.id === id ? { ...opt, text } : opt)))
  }

  const handleCorrectChange = (id: string) => {
    setOptions(
      options.map((opt) => ({
        ...opt,
        isCorrect: opt.id === id,
      })),
    )
  }

  const handleDeleteOption = (id: string) => {
    setOptions(options.filter((opt) => opt.id !== id))
  }

  const addOption = () => {
    const newId = (Math.max(...options.map((opt) => Number.parseInt(opt.id))) + 1).toString()
    setOptions([...options, { id: newId, text: `Option ${newId}`, isCorrect: false }])
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
      const text = questionTextareaRef.current.value
      const start = questionTextareaRef.current.selectionStart
      const textBeforeCursor = text.substring(0, start)
      const textAfterCursor = text.substring(start)

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
        <div className="p-4">
          <h1 className="text-xl font-semibold mb-4">{questionName}</h1>
          <Separator className="my-4" />
          <div className="flex gap-4">
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
            <textarea
              ref={questionTextareaRef}
              className="w-full p-2 text-lg mb-8 border rounded"
              placeholder="Enter your question description here..."
              rows={4}
            />

            <div className="space-y-4">
              {options.map((option) => (
                <div key={option.id} className="flex items-center gap-4">
                  <div className="flex-1 flex items-center gap-4">
                    <div
                      className={`h-6 w-6 rounded-full border-2 flex items-center justify-center cursor-pointer ${option.isCorrect ? "border-green-500 bg-green-500" : "border-gray-300"
                        }`}
                      onClick={() => handleCorrectChange(option.id)}
                    >
                      {option.isCorrect && <Check className="h-4 w-4 text-white" />}
                    </div>
                    <Input
                      value={option.text}
                      onChange={(e) => handleOptionChange(option.id, e.target.value)}
                      className="flex-1"
                    />
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => handleDeleteOption(option.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            <Button variant="outline" onClick={addOption} className="mt-4">
              Add option
            </Button>
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
      <QuestionTypeDialog
        open={isTypeDialogOpen}
        onOpenChange={setIsTypeDialogOpen}
        onTypeSelect={handleTypeChange}
        currentTypes={type}
      />
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        onChange={handleFileSelected}
      />
    </div>
  )
}


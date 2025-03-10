"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Menu, Bot, Plus, Divide, Square } from "lucide-react"
import { EditorToolbar } from "@/components/editor-toolbar"
import { QuestionTypeDialog } from "@/components/question-type-dialog"
import { useRouter } from "next/navigation"
import { useParams } from "next/navigation"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ScrollArea } from "@/components/ui/scroll-area"

interface EquationProps {
  questionName: string
}

export function Equation({ questionName }: EquationProps) {
  const router = useRouter()
  const params = useParams()

  const [displayName, setDisplayName] = useState(questionName)
  const [isTypeDialogOpen, setIsTypeDialogOpen] = useState(false)
  const [equation, setEquation] = useState("")
  const [answer, setAnswer] = useState("")
  const questionTextareaRef = useRef<HTMLTextAreaElement>(null)
  const [attachments, setAttachments] = useState<Array<{ type: string; url: string }>>([])

  const equationSymbols = [
    { label: "Fraction", symbol: "÷", icon: <Divide className="h-4 w-4" /> },
    { label: "Square", symbol: "²", icon: <Square className="h-4 w-4" /> },
    {
      label: "Square Root",
      symbol: "√",
      icon: (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-4 w-4"
        >
          <path d="M7 17l4-8 4 8M7 17h8" />
        </svg>
      )
    },
    { label: "Pi", symbol: "π" },
    { label: "Infinity", symbol: "∞" },
    { label: "Plus/Minus", symbol: "±" },
    { label: "Less than or equal", symbol: "≤" },
    { label: "Greater than or equal", symbol: "≥" },
    { label: "Not equal", symbol: "≠" },
    { label: "Approximately", symbol: "≈" },
    { label: "If and only if", symbol: "⇔" },
    { label: "Implies", symbol: "⇒" },
    { label: "Is implied by", symbol: "⇐" },
  ]

  const insertSymbol = (symbol: string) => {
    setEquation(prev => prev + symbol)
  }

  const handleFileUpload = async (type: 'image' | 'video' | 'file') => {
    // Implement file upload logic
  }

  const handleTypeSelect = (types: string[]) => {
    if (types.length > 0 && types[0] !== "equation") {
      // Construct the URL based on the current route
      const baseUrl = params.subjectId
        ? `/subjects/${params.subjectId}/exams/${params.examId}/questions/${params.questionId}`
        : `/my-exams/${params.examId}/questions/${params.questionId}`

      router.push(`${baseUrl}/${types[0]}`)
    }
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

  const handleAlign = (alignment: string) => {
    // Implement text alignment
  }

  const handleFontChange = (font: string) => {
    // Implement font change
  }

  const handleSizeChange = (size: string) => {
    // Implement size change
  }

  return (
    <div className="flex-1 flex flex-col">
      <div className="border-b">
        <div className="container mx-auto py-4">
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
            <Textarea
              ref={questionTextareaRef}
              className="text-lg mb-8"
              placeholder="Enter your question description here..."
            />
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <h2 className="font-medium">Equation Editor</h2>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Insert Symbol
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56">
                    <ScrollArea className="h-[300px]">
                      <DropdownMenuGroup>
                        {equationSymbols.map((item) => (
                          <DropdownMenuItem
                            key={item.symbol}
                            onClick={() => insertSymbol(item.symbol)}
                          >
                            <span className="flex items-center">
                              {item.icon && <span className="mr-2">{item.icon}</span>}
                              {item.label} ({item.symbol})
                            </span>
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuGroup>
                    </ScrollArea>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="border rounded-lg p-4">
                <Input
                  value={equation}
                  onChange={(e) => setEquation(e.target.value)}
                  placeholder="Click 'Insert Symbol' to add mathematical symbols"
                  className="font-mono"
                />
                <div className="mt-2 p-4 bg-gray-100 rounded text-lg">
                  Preview: {equation}
                </div>
              </div>

              <div className="space-y-4">
                <h2 className="font-medium">Correct Answer</h2>
                <div className="flex items-center gap-2">
                  <Input
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    placeholder="Enter the correct answer"
                    className="font-mono"
                  />
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Insert Symbol
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56">
                      <ScrollArea className="h-[300px]">
                        <DropdownMenuGroup>
                          {equationSymbols.map((item) => (
                            <DropdownMenuItem
                              key={item.symbol}
                              onClick={() => setAnswer(prev => prev + item.symbol)}
                            >
                              <span className="flex items-center">
                                {item.icon && <span className="mr-2">{item.icon}</span>}
                                {item.label} ({item.symbol})
                              </span>
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuGroup>
                      </ScrollArea>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="mt-2 p-4 bg-gray-100 rounded text-lg">
                  Preview: {answer}
                </div>
              </div>
            </div>
          </div>

          {attachments.length > 0 && (
            <div className="w-64 space-y-4">
              <h2 className="font-medium">Attachments</h2>
              {attachments.map((attachment, index) => (
                <div key={index} className="border rounded p-2">
                  {/* Attachment preview logic */}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <QuestionTypeDialog
        open={isTypeDialogOpen}
        onOpenChange={setIsTypeDialogOpen}
        onTypeSelect={() => { }}
        currentTypes={["equation"]}
      />
    </div>
  )
}

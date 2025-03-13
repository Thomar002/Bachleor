"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Menu, Bot, Plus, Divide, Square, Tag } from "lucide-react"
import { EditorToolbar } from "@/components/editor-toolbar"
import { QuestionTypeDialog } from "@/components/question-type-dialog"
import { TagDialog } from "@/components/tag-dialog"
import { supabase } from "@/lib/supabaseClient"
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

interface Props {
  questionName: string;
  initialTags?: string[];
  onTagsChange?: (tags: string[]) => void;
}

export function Equation({ questionName, initialTags = [], onTagsChange }: Props) {
  const router = useRouter()
  const params = useParams()
  const questionId = params.questionId as string

  const [displayName, setDisplayName] = useState(questionName)
  const [isTypeDialogOpen, setIsTypeDialogOpen] = useState(false)
  const [isTagDialogOpen, setIsTagDialogOpen] = useState(false)
  const [type, setType] = useState<string[]>([])
  const [tags, setTags] = useState<string[]>(initialTags)
  const [availableTags, setAvailableTags] = useState<string[]>([])
  const [equation, setEquation] = useState("")
  const [answer, setAnswer] = useState("")
  const questionTextareaRef = useRef<HTMLTextAreaElement>(null)
  const [attachments, setAttachments] = useState<Array<{ type: string; url: string }>>([])
  const editorRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchAvailableTags()
    if (initialTags.length > 0) {
      setTags(initialTags)
    } else {
      fetchQuestionTags()
    }
  }, [initialTags])

  const fetchQuestionTags = async () => {
    if (!questionId) return

    const { data, error } = await supabase
      .from("Questions")
      .select("tags")
      .eq("id", questionId)
      .single()

    if (error) {
      console.error("Error fetching question tags:", error)
      return
    }

    if (data?.tags) {
      const parsedTags = Array.isArray(data.tags)
        ? data.tags
        : typeof data.tags === 'string'
          ? JSON.parse(data.tags)
          : []
      setTags(parsedTags)
    }
  }

  const fetchAvailableTags = async () => {
    const { data, error } = await supabase
      .from("Questions")
      .select("tags")

    if (error) {
      console.error("Error fetching tags:", error)
      return
    }

    const allTags = data
      .flatMap(q => {
        if (Array.isArray(q.tags)) return q.tags
        if (typeof q.tags === 'string') {
          try {
            return JSON.parse(q.tags)
          } catch {
            return []
          }
        }
        return []
      })
      .filter((tag): tag is string => typeof tag === 'string' && tag.length > 0)

    setAvailableTags([...new Set(allTags)])
  }

  const handleTagsChange = async (newTags: string[]) => {
    if (!questionId) return

    setTags(newTags)

    const { error } = await supabase
      .from("Questions")
      .update({ tags: newTags })
      .eq("id", questionId)

    if (error) {
      console.error("Error updating tags:", error)
      return
    }

    onTagsChange?.(newTags)
  }

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

  const handleTypeChange = (newTypes: string[]) => {
    if (newTypes.length > 0 && newTypes[0] !== "equation") {
      // Construct the URL based on the current route
      const baseUrl = params.subjectId
        ? `/subjects/${params.subjectId}/exams/${params.examId}/questions/${params.questionId}`
        : `/my-exams/${params.examId}/questions/${params.questionId}`

      router.push(`${baseUrl}/${newTypes[0]}`)
    }
    setType(newTypes)
    setIsTypeDialogOpen(false)
  }

  const handleBold = () => {
    document.execCommand('bold', false);
  }

  const handleItalic = () => {
    document.execCommand('italic', false);
  }

  const handleUnderline = () => {
    document.execCommand('underline', false);
  }

  const handleAlign = (alignment: 'left' | 'center' | 'right' | 'justify') => {
    document.execCommand(`justify${alignment.charAt(0).toUpperCase() + alignment.slice(1)}`, false);
  }

  const handleFontChange = (font: string) => {
    document.execCommand('fontName', false, font);
  }

  const handleSizeChange = (size: string) => {
    document.execCommand('fontSize', false, size);
  }

  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.focus();
    }
  }, []);

  return (
    <div className="bg-gray-50">
      <div className="border-b bg-white">
        <div className="p-4">
          <h1 className="text-xl font-semibold mb-4">{questionName}</h1>
          <div className="flex gap-4">
            <div className="flex flex-col items-center">
              <Button
                onClick={() => setIsTypeDialogOpen(true)}
                className="flex items-center gap-2"
              >
                <Menu className="h-5 w-5" />
                Question Type
              </Button>
              <span className="text-sm text-gray-600 mt-1">Equation</span>
            </div>
            <Button
              onClick={() => setIsTagDialogOpen(true)}
              className="flex items-center gap-2"
            >
              <Tag className="h-5 w-5" />
              Tags ({tags.length})
            </Button>
            <div className="flex flex-col items-center">
              <Button className="flex items-center gap-2">
                <Bot className="h-5 w-5" />
                AI creator
              </Button>
              <span className="text-sm text-gray-600 mt-1">&nbsp;</span>
            </div>
          </div>
          {/* Display current tags */}
          <div className="mt-2 flex flex-wrap gap-2">
            {tags.map((tag) => (
              <div key={tag} className="bg-gray-100 px-2 py-1 rounded text-sm">
                {tag}
              </div>
            ))}
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
            <div
              ref={editorRef}
              contentEditable
              data-placeholder="Enter your question description here..."
              className="min-h-[50px] p-4 border rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 empty:before:content-[attr(data-placeholder)] empty:before:text-gray-400 mb-8"
              style={{ lineHeight: '1.5' }}
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
        onTypeSelect={handleTypeChange}
        currentTypes={type}
      />

      <TagDialog
        open={isTagDialogOpen}
        onOpenChange={setIsTagDialogOpen}
        currentTags={tags}
        availableTags={availableTags}
        onTagsChange={handleTagsChange}
      />
    </div>
  )
}

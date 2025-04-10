"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Menu, Bot, Plus, Square, Tag, Divide, X, ChevronLeft, ChevronRight, Eye, EyeOff } from "lucide-react"
import { supabase } from "@/lib/supabaseClient"
import { SaveQuestionButton } from "../save-question-button"
import { QuestionTypeDialog } from "../question-type-dialog"
import { TagDialog } from "../tag-dialog"
import { EditorToolbar } from "../editor-toolbar"
import { toast } from "sonner"
import { QuestionType } from "@/types"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ScrollArea } from "@/components/ui/scroll-area"
import { AICreatorOverlay } from "@/components/ai-creator-overlay"
import { Separator } from "@/components/ui/separator"

interface Props {
  questionName: string;
  initialTags?: string[];
  onTagsChange?: (tags: string[]) => void;
}

interface Attachment {
  type: 'image' | 'video' | 'file';
  url: string;
  name: string;
}

interface Question {
  id: string;
  type: string[];
  exam_id?: number;
}

export function Equation({ questionName, initialTags = [], onTagsChange }: Props) {
  const router = useRouter()
  const params = useParams()
  const questionId = params.questionId as string

  const [displayName, setDisplayName] = useState("")
  const [isTypeDialogOpen, setIsTypeDialogOpen] = useState(false)
  const [isTagDialogOpen, setIsTagDialogOpen] = useState(false)
  const [type, setType] = useState<string[]>([])
  const [tags, setTags] = useState<string[]>(initialTags)
  const [availableTags, setAvailableTags] = useState<string[]>([])
  const [equation, setEquation] = useState("")
  const [answer, setAnswer] = useState("")
  const editorRef = useRef<HTMLDivElement>(null)
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [newTag, setNewTag] = useState("")
  const [currentPoints, setCurrentPoints] = useState<number>(0)
  const [points, setPoints] = useState<number>(0)
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentIndex, setCurrentIndex] = useState<number>(0)
  const [isAICreatorOpen, setIsAICreatorOpen] = useState(false)
  const [isStudentView, setIsStudentView] = useState(false)

  const toggleView = () => {
    setIsStudentView(!isStudentView)
  }

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      const updatedTags = [...tags, newTag.trim()]
      setTags(updatedTags)
      handleTagsChange(updatedTags)
      setNewTag("")
    }
  }

  useEffect(() => {
    const fetchQuestionData = async () => {
      if (!questionId) return

      try {
        const { data, error } = await supabase
          .from("Questions")
          .select("*")
          .eq("id", questionId)
          .single()

        if (error) throw error

        if (data) {
          setDisplayName(data.display_name || "")
          setEquation(data.question || "")

          // Håndter correct_answer
          if (data.correct_answer && Array.isArray(data.correct_answer) && data.correct_answer.length > 0) {
            setAnswer(data.correct_answer[0].answer || "")
          }

          // Håndter tags
          if (data.tags) {
            const parsedTags = Array.isArray(data.tags)
              ? data.tags
              : typeof data.tags === 'string'
                ? JSON.parse(data.tags)
                : []
            setTags(parsedTags)
          }
        }
      } catch (error) {
        console.error("Error fetching question:", error)
        toast.error("Failed to load question")
      }
    }

    fetchQuestionData()
  }, [questionId])

  const handleSave = async () => {
    if (!questionId) return

    try {
      const { error } = await supabase
        .from("Questions")
        .update({
          display_name: displayName,
          question: equation,
          type: "Equation",
          correct_answer: [{ answer: answer }],
          attachments: attachments,
          points: points
        })
        .eq("id", questionId)

      if (error) throw error

      toast.success("Question saved successfully")
    } catch (error) {
      console.error("Error saving question:", error)
      toast.error("Failed to save question")
    }
  }

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

    try {
      const { data, error } = await supabase
        .from("Questions")
        .select("tags")
        .eq("id", questionId)
        .single()

      if (error) throw error

      if (data?.tags) {
        const parsedTags = Array.isArray(data.tags)
          ? data.tags
          : typeof data.tags === 'string'
            ? JSON.parse(data.tags)
            : []
        setTags(parsedTags)
      }
    } catch (error) {
      console.error("Error fetching question tags:", error)
      // Ikke vis feilmelding til bruker siden dette ikke er kritisk
    }
  }

  const fetchAvailableTags = async () => {
    try {
      const { data, error } = await supabase
        .from("Questions")
        .select("tags")

      if (error) throw error

      const allTags = (data || [])
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
    } catch (error) {
      console.error("Error fetching available tags:", error)
      // Ikke vis feilmelding til bruker siden dette ikke er kritisk
    }
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
    {
      label: "Pi",
      symbol: "π",
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
          <path d="M3 12h18M7 4v16M17 4v16" />
        </svg>
      )
    },
    {
      label: "Infinity",
      symbol: "∞",
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
          <path d="M18.178 8c5.096 0 5.096 8 0 8-5.095 0-7.133-8-12.739-8-4.585 0-4.585 8 0 8 5.606 0 7.644-8 12.739-8z" />
        </svg>
      )
    },
    {
      label: "Plus/Minus",
      symbol: "±",
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
          <path d="M12 4v16m-8-8h16M12 20v4m0-24v4" />
        </svg>
      )
    },
    {
      label: "Less than or equal",
      symbol: "≤",
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
          <path d="M16 8L8 12L16 16M5 18H19" />
        </svg>
      )
    },
    {
      label: "Greater than or equal",
      symbol: "≥",
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
          <path d="M8 8L16 12L8 16M5 18H19" />
        </svg>
      )
    },
    {
      label: "Not equal",
      symbol: "≠",
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
          <path d="M5 12H19M5 9H19M19 15L5 15M4 4L20 20" />
        </svg>
      )
    },
    {
      label: "Approximately",
      symbol: "≈",
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
          <path d="M5 9c4-1.5 6 1.5 10 0M5 15c4-1.5 6 1.5 10 0" />
        </svg>
      )
    },
    {
      label: "If and only if",
      symbol: "⇔",
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
          <path d="M4 12h16m-4-4l4 4-4 4m-8-8L4 12l4 4" />
        </svg>
      )
    },
    {
      label: "Implies",
      symbol: "⇒",
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
          <path d="M4 12h16m-4-4l4 4-4 4" />
        </svg>
      )
    },
    {
      label: "Is implied by",
      symbol: "⇐",
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
          <path d="M20 12H4m4-4L4 12l4 4" />
        </svg>
      )
    }
  ]

  const insertSymbol = (symbol: string) => {
    setEquation(prev => prev + symbol)
  }

  const handleFileUpload = (type: 'image' | 'video' | 'file') => {
    if (fileInputRef.current) {
      fileInputRef.current.accept = type === 'image' ? 'image/*' :
        type === 'video' ? 'video/*' : '*/*'
      fileInputRef.current.click()
    }
  }

  const handleFileSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `questions/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('questions')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('questions')
        .getPublicUrl(filePath)

      const newAttachment: Attachment = {
        type: file.type.startsWith('image/') ? 'image' :
          file.type.startsWith('video/') ? 'video' : 'file',
        url: publicUrl,
        name: file.name
      }
      setAttachments(prev => [...prev, newAttachment])
      toast.success('File uploaded successfully')
    } catch (error: any) {
      console.error('Error uploading file:', error)
      toast.error(error.message || 'Failed to upload file')
    }
  }

  const handleRemoveAttachment = async (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index))
  }

  useEffect(() => {
    const fetchAttachments = async () => {
      if (!questionId) return

      const { data, error } = await supabase
        .from("Questions")
        .select("attachments")
        .eq("id", questionId)
        .single()

      if (error) {
        console.error("Error fetching attachments:", error)
        return
      }

      if (data?.attachments) {
        setAttachments(data.attachments)
      }
    }

    fetchAttachments()
  }, [questionId])

  const handleTypeChange = (newTypes: string[]) => {
    if (newTypes.length > 0) {
      // Map the question type to the correct route path
      const typeToPath: Record<string, string> = {
        "True/False": "true-false",
        "Multiple Choice-single": "multiple-choice-single",
        "Multiple Choice-multi": "multiple-choice-multiple",
        "Equation": "equation",
        "Text": "text"
      }

      const path = typeToPath[newTypes[0]]
      if (path && path !== "equation") {
        // Construct the URL based on the current route
        const baseUrl = params.subjectId
          ? `/subjects/${params.subjectId}/exams/${params.examId}/questions/${params.questionId}`
          : `/my-exams/${params.examId}/questions/${params.questionId}`

        router.push(`${baseUrl}/${path}`)
      }
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

  useEffect(() => {
    const fetchCurrentPoints = async () => {
      if (!questionId) return

      const { data, error } = await supabase
        .from("Questions")
        .select("points")
        .eq("id", questionId)
        .single()

      if (error) {
        console.error("Error fetching points:", error)
        return
      }

      if (data && data.points !== null) {
        setCurrentPoints(data.points)
        setPoints(data.points) // Update the points state as well
      }
    }

    fetchCurrentPoints()
  }, [questionId])

  useEffect(() => {
    const fetchQuestions = async () => {
      const { examId } = params
      let query = supabase.from("Questions").select("*")

      if (examId) {
        query = query.eq("exam_id", examId)
      } else {
        query = query.is("exam_id", null)
      }

      const { data, error } = await query

      if (error) {
        console.error("Error fetching questions:", error)
        return
      }

      if (data) {
        setQuestions(data)
        const index = data.findIndex(q => q.id === questionId)
        setCurrentIndex(index)
      }
    }

    fetchQuestions()
  }, [questionId, params])

  const navigateQuestion = (direction: 'prev' | 'next') => {
    const newIndex = direction === 'prev' ? currentIndex - 1 : currentIndex + 1

    if (newIndex >= 0 && newIndex < questions.length) {
      const question = questions[newIndex]
      const { examId } = params
      const baseUrl = examId
        ? `/my-exams/${examId}/questions`
        : '/my-questions'

      const typeToPath: Record<string, string> = {
        "True/False": "true-false",
        "Multiple Choice-single": "multiple-choice-single",
        "Multiple Choice-multi": "multiple-choice-multiple",
        "Equation": "equation",
        "Text": "text"
      }

      const type = question.type[0]
      const path = typeToPath[type] || "text"

      router.push(`${baseUrl}/${question.id}/${path}`)
    }
  }

  return (
    <div className="bg-gray-50">
      <div className="border-b bg-white">
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <Button variant="outline">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <h1 className="text-xl font-semibold">{questionName}</h1>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={toggleView}
                className="flex items-center gap-2"
              >
                {isStudentView ? (
                  <>
                    <EyeOff className="h-4 w-4" />
                    Teacher View
                  </>
                ) : (
                  <>
                    <Eye className="h-4 w-4" />
                    Student View
                  </>
                )}
              </Button>
              {!isStudentView && (
                <>
                  <Button
                    variant="outline"
                    onClick={() => navigateQuestion('prev')}
                    disabled={currentIndex === 0}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => navigateQuestion('next')}
                    disabled={currentIndex === questions.length - 1}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
          </div>
          <Separator className="my-4" />
          <div className="flex justify-between items-start">
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
                <Button
                  className="flex items-center gap-2"
                  onClick={() => setIsAICreatorOpen(true)}
                >
                  <Bot className="h-5 w-5" />
                  AI creator
                </Button>
                <span className="text-sm text-gray-600 mt-1">&nbsp;</span>
              </div>
            </div>
            <div className="flex flex-col items-center">
              <Button
                className="bg-[#2B2B2B] hover:bg-[#3B3B3B] text-white flex items-center gap-2"
                onClick={() => { }}
              >
                <Plus className="h-5 w-5" />
                Create Question
              </Button>
              <span className="text-sm text-gray-600 mt-1">&nbsp;</span>
            </div>
          </div>
          {/* Display current tags */}
          <div className="mt-2 space-y-4">
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <div key={tag} className="bg-gray-100 px-2 py-1 rounded text-sm">
                  {tag}
                </div>
              ))}
            </div>

            {/* Add new tag */}
            <div className="flex gap-2 w-[200px]">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="Add new tag..."
                onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                className="flex-1"
              />
              <Button onClick={handleAddTag}>Add</Button>
            </div>
          </div>
        </div>
        {/* Display name section */}
        <div className="px-4 pb-4">
          <div className="max-w-md mx-auto">
            <h2 className="text-sm font-medium text-gray-700 mb-2">Display name</h2>
            <Input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Enter display name..."
              className="max-w-md mx-auto"
            />
          </div>
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

      <div className="container mx-auto p-6" style={{ maxWidth: '1400px' }}>
        <div className={`flex ${attachments.length === 0 ? 'justify-center' : 'justify-start gap-8'}`}>
          <div className="w-[550px]">
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Question
                  </label>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="flex items-center gap-1"
                      >
                        <span className="text-lg">Ω</span>
                        <span className="text-sm">Symbol</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuGroup>
                        {equationSymbols.map((symbol) => (
                          <DropdownMenuItem
                            key={symbol.symbol}
                            onClick={() => insertSymbol(symbol.symbol)}
                          >
                            <div className="flex items-center">
                              {symbol.icon}
                              <span className="ml-2">{symbol.label}</span>
                            </div>
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuGroup>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <Input
                  value={equation}
                  onChange={(e) => setEquation(e.target.value)}
                  placeholder="Enter question..."
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Answer
                  </label>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="flex items-center gap-1"
                      >
                        <span className="text-lg">Ω</span>
                        <span className="text-sm">Symbol</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuGroup>
                        {equationSymbols.map((symbol) => (
                          <DropdownMenuItem
                            key={symbol.symbol}
                            onClick={() => setAnswer(answer + symbol.symbol)}
                          >
                            <div className="flex items-center">
                              {symbol.icon}
                              <span className="ml-2">{symbol.label}</span>
                            </div>
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuGroup>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <Input
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder="Enter answer..."
                />
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Points
                </label>
                <Input
                  type="number"
                  value={currentPoints || ''}
                  onChange={(e) => {
                    const value = Math.min(999, parseInt(e.target.value) || 0)
                    setCurrentPoints(value)
                    setPoints(value)
                  }}
                  min="0"
                  max="999"
                  className="w-24 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <SaveQuestionButton
                displayName={displayName}
                question={equation}
                type="Equation"
                onSave={handleSave}
              />
            </div>
          </div>

          {attachments.length > 0 && (
            <div className="w-[550px] space-y-4 sticky top-4">
              <h2 className="font-medium">Attachments</h2>
              {attachments.map((attachment, index) => (
                <div key={index} className="border rounded p-4 relative">
                  {attachment.type === 'image' && (
                    <img
                      src={attachment.url}
                      alt={attachment.name}
                      className="w-full h-auto object-contain max-h-[600px]"
                    />
                  )}
                  {attachment.type === 'video' && (
                    <video
                      src={attachment.url}
                      controls
                      className="w-full max-h-[600px]"
                    />
                  )}
                  {attachment.type === 'file' && (
                    <div className="flex flex-col gap-2">
                      <object
                        data={attachment.url}
                        type="application/pdf"
                        className="w-full h-[600px]"
                      >
                        <p>Unable to display PDF. <a href={attachment.url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">Download instead</a></p>
                      </object>
                      <a
                        href={attachment.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:underline text-sm"
                      >
                        {attachment.name}
                      </a>
                    </div>
                  )}
                  <button
                    onClick={() => handleRemoveAttachment(index)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                  >
                    <X className="h-4 w-4" />
                  </button>
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
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        onChange={handleFileSelected}
      />
      <AICreatorOverlay
        isOpen={isAICreatorOpen}
        onClose={() => setIsAICreatorOpen(false)}
      />
    </div>
  )
}

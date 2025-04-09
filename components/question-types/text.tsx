"use client"

import { useState, useRef, useEffect } from "react"
import { Menu, Bot, Tag, X, ChevronLeft, ChevronRight, Plus, Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { EditorToolbar } from "../editor-toolbar"
import { QuestionTypeDialog } from "../question-type-dialog"
import { Separator } from "@/components/ui/separator"
import { supabase } from "@/lib/supabaseClient"
import { TagDialog } from "../tag-dialog"
import { useParams, useRouter } from "next/navigation"
import { SaveQuestionButton } from "../save-question-button"
import { toast } from "sonner"
import { FileUploadHandler } from "../file-upload-handler"
import { AICreatorOverlay } from "@/components/ai-creator-overlay"

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

export function Text({ questionName, initialTags = [], onTagsChange }: Props) {
  const params = useParams()
  const questionId = params.questionId as string
  const [displayName, setDisplayName] = useState("")
  const [questionContent, setQuestionContent] = useState("")
  const [isTypeDialogOpen, setIsTypeDialogOpen] = useState(false)
  const [isTagDialogOpen, setIsTagDialogOpen] = useState(false)
  const [type, setType] = useState<string[]>([])
  const [tags, setTags] = useState<string[]>(initialTags)
  const [availableTags, setAvailableTags] = useState<string[]>([])
  const answerEditorRef = useRef<HTMLDivElement>(null)
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [newTag, setNewTag] = useState("")
  const [currentPoints, setCurrentPoints] = useState<number>(0)
  const [points, setPoints] = useState<number>(0)
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentIndex, setCurrentIndex] = useState<number>(0)
  const router = useRouter()
  const [isAICreatorOpen, setIsAICreatorOpen] = useState(false)
  const [isStudentView, setIsStudentView] = useState(false)
  const [answerContent, setAnswerContent] = useState<string>("")
  const studentAnswerEditorRef = useRef<HTMLDivElement>(null)
  const [isEditingName, setIsEditingName] = useState(false)
  const [editedName, setEditedName] = useState(questionName)

  const handleEditorChange = (e: React.FormEvent<HTMLDivElement>) => {
    const content = e.currentTarget.innerHTML;
    setQuestionContent(content);
  };

  const handleStudentAnswerChange = () => {
    if (studentAnswerEditorRef.current) {
      setAnswerContent(studentAnswerEditorRef.current.innerHTML)
    }
  }

  useEffect(() => {
    if (answerEditorRef.current && questionContent) {
      answerEditorRef.current.innerHTML = questionContent;
    }
  }, []); // Kjører bare én gang ved innlasting

  useEffect(() => {
    const fetchQuestionData = async () => {
      if (!questionId) return

      const { data, error } = await supabase
        .from("Questions")
        .select("*")
        .eq("id", questionId)
        .single()

      if (error) {
        console.error("Error fetching question data:", error)
        return
      }

      if (data) {
        setDisplayName(data.display_name || "")
        // Update both the state and the editor content
        const questionText = data.question || ""
        setQuestionContent(questionText)
        if (answerEditorRef.current) {
          answerEditorRef.current.innerHTML = questionText
        }
        if (data.tags) {
          setTags(Array.isArray(data.tags) ? data.tags : [])
        }
      }
    }

    fetchQuestionData()
    fetchAvailableTags()
  }, [questionId])

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

    // Update tags in the database
    const { error } = await supabase
      .from("Questions")
      .update({ tags: newTags })
      .eq("id", questionId)

    if (error) {
      console.error("Error updating tags:", error)
      return
    }

    // Call the onTagsChange prop if provided
    onTagsChange?.(newTags)
  }

  const handleTypeChange = (newTypes: string[]) => {
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
        setPoints(data.points)
      }
    }

    fetchCurrentPoints()
  }, [questionId])

  const handleSave = async () => {
    if (!questionId) return

    try {
      const { error } = await supabase
        .from("Questions")
        .update({
          display_name: displayName,
          question: questionContent,
          type: "text",
          attachments: attachments,
          points: currentPoints
        })
        .eq("id", questionId)

      if (error) throw error
      toast.success("Question saved successfully")
    } catch (error) {
      console.error("Error saving question:", error)
      toast.error("Failed to save question")
    }
  }

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag)) {
      setTags([...tags, newTag])
      setNewTag("")
    }
  }

  const navigateQuestion = (direction: 'prev' | 'next') => {
    const newIndex = direction === 'prev' ? currentIndex - 1 : currentIndex + 1

    if (newIndex >= 0 && newIndex < questions.length) {
      const question = questions[newIndex]
      const { examId } = params
      const baseUrl = examId
        ? `/my-exams/${examId}/questions`
        : '/my-questions'

      // Map question type to route
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

  useEffect(() => {
    const fetchQuestions = async () => {
      const { examId } = params
      let query = supabase.from("Questions").select("*")

      if (examId) {
        // If we're in an exam context
        query = query.eq("exam_id", examId)
      } else {
        // If we're in My Questions context
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

  const toggleView = () => {
    setIsStudentView(!isStudentView)
  }

  const handleNameUpdate = async () => {
    if (!questionId || editedName.trim() === '') return

    try {
      const { error } = await supabase
        .from("Questions")
        .update({ name: editedName.trim() })
        .eq("id", questionId)

      if (error) throw error
      setIsEditingName(false)
      toast.success("Question name updated successfully")
    } catch (error) {
      console.error("Error updating question name:", error)
      toast.error("Failed to update question name")
    }
  }

  return (
    <div className="bg-gray-50">
      <div className="border-b bg-white">
        <div className="p-4">
          {/* Top section with name and navigation */}
          <div className="flex items-center justify-between mb-4">
            {isStudentView ? (
              <div className="flex-1 text-center">
                <h1 className="text-xl font-semibold">
                  {displayName}
                </h1>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-4">
                  <Button variant="outline">
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  {isEditingName ? (
                    <Input
                      value={editedName}
                      onChange={(e) => setEditedName(e.target.value)}
                      onBlur={handleNameUpdate}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          handleNameUpdate()
                        } else if (e.key === 'Escape') {
                          setEditedName(questionName)
                          setIsEditingName(false)
                        }
                      }}
                      className="text-xl font-semibold w-auto"
                      autoFocus
                    />
                  ) : (
                    <h1
                      className="text-xl font-semibold cursor-pointer"
                      onDoubleClick={() => {
                        setEditedName(questionName)
                        setIsEditingName(true)
                      }}
                    >
                      {questionName}
                    </h1>
                  )}
                </div>
              </>
            )}
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

          {!isStudentView && (
            <>
              <Separator className="my-4" />

              {/* Buttons section */}
              <div className="flex justify-between items-start mb-4">
                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <Button
                      onClick={() => setIsTypeDialogOpen(true)}
                      className="flex items-center gap-2"
                    >
                      <Menu className="h-5 w-5" />
                      Question Type
                    </Button>
                    <span className="text-sm text-gray-600 mt-1">Text Answer</span>
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

              {/* Tags section */}
              <div className="space-y-4 mb-4">
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <div key={tag} className="bg-gray-100 px-2 py-1 rounded text-sm">
                      {tag}
                    </div>
                  ))}
                </div>

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

              {/* Display name input centered above toolbar */}
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
            </>
          )}
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
          isStudentView={isStudentView}
        />
      </div>

      <div className="container mx-auto p-6" style={{ maxWidth: '1400px' }}>
        <div className={`flex ${attachments.length === 0 ? 'justify-center' : 'justify-start gap-8'}`}>
          <div className="w-[550px]">
            <h2 className="text-sm font-medium text-gray-700 mb-2">Question</h2>
            <div
              ref={answerEditorRef}
              contentEditable={!isStudentView}
              data-placeholder="Enter your question here..."
              className={`min-h-[100px] p-4 border rounded-md bg-white ${!isStudentView ? 'focus:outline-none focus:ring-2 focus:ring-blue-500' : ''
                } empty:before:content-[attr(data-placeholder)] empty:before:text-gray-400 mb-4`}
              style={{ lineHeight: '1.5' }}
              onInput={!isStudentView ? handleEditorChange : undefined}
            />

            {isStudentView && (
              <>
                <h2 className="text-sm font-medium text-gray-700 mb-2 mt-6">Your Answer</h2>
                <div
                  ref={studentAnswerEditorRef}
                  contentEditable
                  data-placeholder="Write your answer here..."
                  className="min-h-[100px] p-4 border rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 empty:before:content-[attr(data-placeholder)] empty:before:text-gray-400 mb-4"
                  style={{ lineHeight: '1.5' }}
                  onInput={handleStudentAnswerChange}
                />
              </>
            )}

            {!isStudentView && (
              <>
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
                <div className="mt-4 flex justify-end">
                  <SaveQuestionButton
                    displayName={displayName}
                    question={questionContent}
                    type="text"
                    onSave={handleSave}
                  />
                </div>
              </>
            )}

            {isStudentView && (
              <div className="mt-4 flex justify-end gap-2">
                <Button
                  className="flex items-center gap-2"
                  onClick={() => navigateQuestion('prev')}
                  disabled={currentIndex === 0}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous Question
                </Button>
                <Button
                  className="flex items-center gap-2"
                  onClick={() => navigateQuestion('next')}
                  disabled={currentIndex === questions.length - 1}
                >
                  <ChevronRight className="h-4 w-4" />
                  Next Question
                </Button>
              </div>
            )}
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

        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          onChange={handleFileSelected}
        />
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

      <AICreatorOverlay
        isOpen={isAICreatorOpen}
        onClose={() => setIsAICreatorOpen(false)}
      />
    </div>
  )
}

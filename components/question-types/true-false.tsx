"use client"

import { useState, useRef, useEffect } from "react"
import { Check, Menu, Bot, Tag, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { EditorToolbar } from "../editor-toolbar"
import { QuestionTypeDialog } from "../question-type-dialog"
import { TagDialog } from "../tag-dialog"
import { Separator } from "@/components/ui/separator"
import { supabase } from "@/lib/supabaseClient"
import { useParams, useRouter } from "next/navigation"
import { SaveQuestionButton } from "../save-question-button"
import { toast } from "sonner"
import { QuestionType } from "@/types"
import { FileUploadHandler } from "../file-upload-handler"

interface Attachment {
  type: 'image' | 'video' | 'file'
  url: string
  name: string
}

interface Props {
  questionName: string;
  initialTags?: string[];
  onTagsChange?: (tags: string[]) => void;
}

export function TrueFalse({ questionName, initialTags = [], onTagsChange }: Props) {
  const params = useParams()
  const questionId = params.questionId as string
  const router = useRouter()

  const [isLoading, setIsLoading] = useState(true)
  const [displayName, setDisplayName] = useState("")
  const [questionContent, setQuestionContent] = useState("")
  const [correctAnswer, setCorrectAnswer] = useState<boolean | null>(null)
  const [type, setType] = useState(["True/False"])
  const [tags, setTags] = useState<string[]>(initialTags)
  const [isTypeDialogOpen, setIsTypeDialogOpen] = useState(false)
  const [isTagDialogOpen, setIsTagDialogOpen] = useState(false)
  const [availableTags, setAvailableTags] = useState<string[]>([])
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [newTag, setNewTag] = useState("")
  const [points, setPoints] = useState<number>(0);
  const [inputValue, setInputValue] = useState<string>('');

  // Add logging to track points changes
  const logPointsChange = (value: number, source: string) => {
    console.log(`Points changed to ${value} from ${source}`);
  };

  // Separate input handling from state updates
  const handlePointsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    console.log('Input change - Raw value:', rawValue);

    // Allow empty input during typing
    if (rawValue === '') {
      setInputValue('');
      setPoints(0);
      return;
    }

    // Only allow digits
    if (/^\d+$/.test(rawValue)) {
      setInputValue(rawValue);
      const numValue = parseInt(rawValue, 10);
      console.log('Setting points to:', numValue);
      setPoints(numValue);
    }
  };

  const editorRef = useRef<HTMLDivElement>(null)

  const handleAddTag = () => {
    if (newTag && !tags.includes(newTag)) {
      const updatedTags = [...tags, newTag]
      setTags(updatedTags)
      onTagsChange?.(updatedTags)
      setNewTag("")
    }
  }

  // Legg til disse funksjonene for rik-tekst-redigering
  const handleBold = () => {
    document.execCommand('bold', false)
  }

  const handleItalic = () => {
    document.execCommand('italic', false)
  }

  const handleUnderline = () => {
    document.execCommand('underline', false)
  }

  const handleAlign = (alignment: 'left' | 'center' | 'right' | 'justify') => {
    document.execCommand(`justify${alignment.charAt(0).toUpperCase() + alignment.slice(1)}`, false)
  }

  const handleFontChange = (font: string) => {
    document.execCommand('fontName', false, font)
  }

  const handleSizeChange = (size: string) => {
    document.execCommand('fontSize', false, size)
  }

  const handleFileUpload = (type: 'image' | 'video' | 'file') => {
    console.log('File upload triggered:', type); // Debug log
    if (fileInputRef.current) {
      fileInputRef.current.accept = type === 'image' ? 'image/*' :
        type === 'video' ? 'video/*' : '*/*';
      fileInputRef.current.click();
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
          setQuestionContent(data.question || "")
          setPoints(data.points || 0)
          setInputValue(data.points?.toString() || '')
          if (editorRef.current) {
            editorRef.current.innerHTML = data.question || ""
          }

          if (data.correct_answer && data.correct_answer[0]) {
            setCorrectAnswer(data.correct_answer[0].answer === "true")
          }

          // Parse and set tags
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
      } finally {
        setIsLoading(false)
      }
    }

    fetchQuestionData()
    fetchAvailableTags()
  }, [questionId])

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

  const handleSave = async () => {
    if (!questionId) return;

    try {
      // Ensure we're working with the exact integer value
      const currentPoints = Math.trunc(points); // Remove any decimal part
      console.log('Save - Current points state:', points);
      console.log('Save - Points to be saved:', currentPoints);

      const updates = {
        display_name: displayName,
        question: questionContent,
        type: "True/False",
        correct_answer: correctAnswer !== null ? [{ answer: correctAnswer }] : [],
        attachments: attachments,
        points: currentPoints,
        tags: tags
      };

      console.log('Save - Full update payload:', updates);

      const { data, error } = await supabase
        .from("Questions")
        .update(updates)
        .eq("id", questionId)
        .select();

      if (error) throw error;

      if (data && data[0]) {
        console.log('Save - Response data:', data[0]);
        console.log('Save - Saved points value:', data[0].points);

        // Only update if there's an actual difference
        if (data[0].points !== currentPoints) {
          console.log('Save - Points mismatch detected:', {
            'current': currentPoints,
            'received': data[0].points
          });
          setPoints(data[0].points);
        }
      }

      toast.success("Question saved successfully");
    } catch (error: any) {
      console.error("Save - Error:", error);
      toast.error(`Failed to save question: ${error.message}`);
    }
  };

  useEffect(() => {
    if (editorRef.current && questionContent) {
      editorRef.current.innerHTML = questionContent;
    }
  }, []); // Kjører bare én gang ved innlasting

  const handleEditorChange = (e: React.FormEvent<HTMLDivElement>) => {
    const content = e.currentTarget.innerHTML;
    setQuestionContent(content);
  };

  if (isLoading) {
    return <div className="p-4">Loading...</div>
  }

  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        onChange={handleFileSelected}
      />
      <div className="bg-gray-50">
        <div className="border-b bg-white">
          <div className="p-4">
            <h1 className="text-xl font-semibold mb-4">{questionName}</h1>
            <Separator className="my-4" />
            <div className="flex gap-4">
              <div className="flex flex-col items-center">
                <Button
                  onClick={() => setIsTypeDialogOpen(true)}
                  className="flex items-center gap-2"
                >
                  <Menu className="h-5 w-5" />
                  Question Type
                </Button>
                <span className="text-sm text-gray-600 mt-1">True/False</span>
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

          {/* Legg til EditorToolbar her */}
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
              <h2 className="text-sm font-medium text-gray-700 mb-2">Question</h2>
              <div
                ref={editorRef}
                contentEditable
                data-placeholder="Enter your question here..."
                className="min-h-[100px] p-4 border rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 empty:before:content-[attr(data-placeholder)] empty:before:text-gray-400 mb-8"
                style={{ lineHeight: '1.5' }}
                onInput={handleEditorChange}
              />
              <div className="mt-4">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Select correct answer:</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-4">
                    <div className="flex-1 flex items-center gap-4">
                      <div
                        className={`h-6 w-6 rounded-full border-2 flex items-center justify-center cursor-pointer ${correctAnswer === true ? "border-green-500 bg-green-500" : "border-gray-300"}`}
                        onClick={() => setCorrectAnswer(true)}
                      >
                        {correctAnswer === true && <Check className="h-4 w-4 text-white" />}
                      </div>
                      <span>True</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex-1 flex items-center gap-4">
                      <div
                        className={`h-6 w-6 rounded-full border-2 flex items-center justify-center cursor-pointer ${correctAnswer === false ? "border-green-500 bg-green-500" : "border-gray-300"}`}
                        onClick={() => setCorrectAnswer(false)}
                      >
                        {correctAnswer === false && <Check className="h-4 w-4 text-white" />}
                      </div>
                      <span>False</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-6">
                <h2 className="text-sm font-medium text-gray-700 mb-2">Points</h2>
                <Input
                  type="text"
                  value={inputValue}
                  onChange={handlePointsChange}
                  onBlur={(e) => {
                    const finalValue = e.target.value === '' ? '0' : e.target.value;
                    const numValue = parseInt(finalValue, 10);
                    console.log('Blur - Final value:', numValue);
                    setInputValue(finalValue);
                    setPoints(numValue);
                  }}
                  className="w-24"
                  placeholder="Points"
                />
              </div>
              <div className="mt-4 flex justify-end">
                <SaveQuestionButton
                  displayName={displayName}
                  question={questionContent}
                  type="True/False"
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
          onTypeSelect={(newTypes) => {
            setType(newTypes)
            setIsTypeDialogOpen(false)
          }}
          currentTypes={type}
        />

        <TagDialog
          open={isTagDialogOpen}
          onOpenChange={setIsTagDialogOpen}
          currentTags={tags}
          availableTags={availableTags}
          onTagsChange={(newTags) => {
            setTags(newTags)
            onTagsChange?.(newTags)
          }}
        />
      </div>
    </>
  )
}


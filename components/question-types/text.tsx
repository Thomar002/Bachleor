"use client"

import { useState, useRef, useEffect } from "react"
import { Menu, Bot, Tag, X } from "lucide-react"
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
  const [points, setPoints] = useState<number>(0);
  const [inputValue, setInputValue] = useState<string>('');

  const logPointsChange = (value: number, source: string) => {
    console.log(`Points changed to ${value} from ${source}`);
  };

  const handleEditorChange = (e: React.FormEvent<HTMLDivElement>) => {
    const content = e.currentTarget.innerHTML;
    setQuestionContent(content);
  };

  useEffect(() => {
    if (answerEditorRef.current && questionContent) {
      answerEditorRef.current.innerHTML = questionContent;
    }
  }, []); // Kjører bare én gang ved innlasting

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
          if (data.points !== undefined && data.points !== null) {
            setPoints(data.points)
            setInputValue(data.points.toString())
          }
          if (answerEditorRef.current) {
            answerEditorRef.current.innerHTML = data.question || ""
          }

          if (data.tags) {
            setTags(Array.isArray(data.tags) ? data.tags : [])
          }
        }
      } catch (error) {
        console.error("Error fetching question data:", error)
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

  const handleSaveQuestion = async () => {
    if (!questionId) return

    const updates = {
      display_name: displayName,
      answer: answerEditorRef.current?.innerHTML || "",
      type: ["text"],
      tags: tags
    }

    const { error } = await supabase
      .from("Questions")
      .update(updates)
      .eq("id", questionId)

    if (error) {
      console.error("Error saving question:", error)
    }
  }

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag)) {
      setTags([...tags, newTag])
      setNewTag("")
    }
  }

  const handlePointsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    console.log('Input change - Raw value:', rawValue);

    if (rawValue === '') {
      setInputValue('');
      setPoints(0);
      return;
    }

    if (/^\d+$/.test(rawValue)) {
      setInputValue(rawValue);
      const numValue = parseInt(rawValue, 10);
      console.log('Setting points to:', numValue);
      setPoints(numValue);
    }
  };

  return (
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
        {/* Display name section */}
        <div className="px-4 pb-4">
          <div className="max-w-md mx-auto">
            <h2 className="text-sm font-medium text-gray-700 mb-2">Display name</h2>
            <Input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Enter display name..."
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
            <h2 className="text-sm font-medium text-gray-700 mb-2">Question</h2>
            <div
              ref={answerEditorRef}
              contentEditable
              data-placeholder="Enter your question here..."
              className="min-h-[100px] p-4 border rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 empty:before:content-[attr(data-placeholder)] empty:before:text-gray-400 mb-8"
              style={{ lineHeight: '1.5' }}
              onInput={handleEditorChange}
            />

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
                type="text"
                onSave={async () => {
                  if (!questionId) return

                  try {
                    const { error } = await supabase
                      .from("Questions")
                      .update({
                        display_name: displayName,
                        question: questionContent,
                        type: "text",
                        tags: tags,
                        attachments: attachments
                      })
                      .eq("id", questionId)

                    if (error) throw error

                    toast.success("Question saved successfully")
                  } catch (error) {
                    console.error("Error saving question:", error)
                    toast.error("Failed to save question")
                  }
                }}
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
    </div>
  )
}

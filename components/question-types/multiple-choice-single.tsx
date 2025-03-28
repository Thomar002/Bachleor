"use client"

import { useState, useRef, useEffect } from "react"
import { Menu, Bot, Tag, Check, Trash2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { EditorToolbar } from "../editor-toolbar"
import { QuestionTypeDialog } from "../question-type-dialog"
import { TagDialog } from "../tag-dialog"
import { supabase } from "@/lib/supabaseClient"
import { useParams } from "next/navigation"
import { toast } from 'sonner'
import { FileUploadHandler } from "../file-upload-handler"
import { SaveQuestionButton } from "@/components/save-question-button"

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
  questionId?: number;
  initialDisplayName?: string;
  initialQuestionContent?: string;
  initialOptions?: Option[];
  initialTags?: string[];
  initialAttachments?: Attachment[];
  initialPoints?: number;
  onTagsChange?: (tags: string[]) => void;
}

export function MultipleChoiceSingle({
  questionName,
  questionId,  // This is already passed as a prop
  initialDisplayName = "",
  initialQuestionContent = "",
  initialOptions = [],
  initialTags = [],
  initialAttachments = [],
  initialPoints = 0,
  onTagsChange,
}: Props) {
  const params = useParams()
  const [displayName, setDisplayName] = useState(initialDisplayName)
  const [options, setOptions] = useState<Option[]>(initialOptions)
  const [isTypeDialogOpen, setIsTypeDialogOpen] = useState(false)
  const [isTagDialogOpen, setIsTagDialogOpen] = useState(false)
  const [type, setType] = useState<string[]>([])
  const [tags, setTags] = useState<string[]>(initialTags)
  const [availableTags, setAvailableTags] = useState<string[]>([])
  const [attachments, setAttachments] = useState<Attachment[]>(initialAttachments)
  const [points, setPoints] = useState<number>(0)
  const [inputValue, setInputValue] = useState<string>('')

  const fileInputRef = useRef<HTMLInputElement>(null)
  const questionTextareaRef = useRef<HTMLTextAreaElement>(null)
  const editorRef = useRef<HTMLDivElement>(null)
  const [questionContent, setQuestionContent] = useState(initialQuestionContent)
  const [newTag, setNewTag] = useState("")

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

          // Parse options and correct_answer from database
          if (data.options && Array.isArray(data.options)) {
            const correctAnswerId = data.correct_answer?.[0]?.id
            const parsedOptions = data.options.map((opt: any) => ({
              id: opt.id,
              text: opt.text,
              isCorrect: opt.id === correctAnswerId
            }))
            setOptions(parsedOptions)
          }

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
    fetchAvailableTags()
  }, [questionId])  // Make sure questionId is in the dependency array

  useEffect(() => {
    if (editorRef.current && questionContent) {
      editorRef.current.innerHTML = questionContent;
    }
  }, []); // Kjører bare én gang ved innlasting

  const handleEditorChange = (e: React.FormEvent<HTMLDivElement>) => {
    const content = e.currentTarget.innerHTML;
    setQuestionContent(content);
  };

  const handleSave = async () => {
    if (!questionId) return;

    try {
      const currentPoints = Math.trunc(points);
      console.log('Save - Current points state:', points);
      console.log('Save - Points to be saved:', currentPoints);

      // Find the correct answer and create the updates object
      const correctOption = options.find(opt => opt.isCorrect);
      const optionsJson = options.map(opt => ({
        id: opt.id,
        text: opt.text
      }));
      const correctAnswerJson = correctOption
        ? [{ id: correctOption.id, answer: correctOption.text }]
        : [];

      const updates = {
        display_name: displayName,
        question: questionContent,
        type: "Multiple Choice-single",
        options: optionsJson,
        correct_answer: correctAnswerJson,
        attachments: attachments,
        points: currentPoints,
        tags: tags
      };

      const { data, error } = await supabase
        .from("Questions")
        .update(updates)
        .eq("id", questionId)
        .select();

      if (error) throw error;

      if (data && data[0]) {
        if (data[0].points !== currentPoints) {
          setPoints(data[0].points);
        }
      }

      toast.success("Question saved successfully");
    } catch (error: any) {
      console.error("Save - Error:", error);
      toast.error(`Failed to save question: ${error.message}`);
    }
  }

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

  const handleFileUploaded = (url: string, fileName: string, fileType: string) => {
    const newAttachment: Attachment = {
      type: fileType.startsWith('image/') ? 'image' :
        fileType.startsWith('video/') ? 'video' :
          'file',
      url,
      name: fileName
    }
    console.log('Adding new attachment:', newAttachment); // For debugging
    setAttachments(prev => [...prev, newAttachment]);
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
              <span className="text-sm text-gray-600 mt-1">Multiple Choice (Single)</span>
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
            <h2 className="text-sm font-medium text-gray-700 mb-2">Question</h2>
            <div
              ref={editorRef}
              contentEditable
              data-placeholder="Enter your question here..."
              className="min-h-[100px] p-4 border rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 empty:before:content-[attr(data-placeholder)] empty:before:text-gray-400 mb-8"
              style={{ lineHeight: '1.5' }}
              onInput={handleEditorChange}
            >
              {questionContent && <div dangerouslySetInnerHTML={{ __html: questionContent }} />}
            </div>

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
                type="Multiple Choice-single"
                onSave={async () => {
                  if (!questionId) return;

                  try {
                    const correctOption = options.find(opt => opt.isCorrect);
                    const optionsJson = options.map(opt => ({
                      id: opt.id,
                      text: opt.text
                    }));
                    const correctAnswerJson = correctOption
                      ? [{ id: correctOption.id, answer: correctOption.text }]
                      : [];

                    const updates = {
                      display_name: displayName,
                      question: questionContent,
                      type: "Multiple Choice-single",
                      options: optionsJson,
                      correct_answer: correctAnswerJson,
                      attachments: attachments,
                      points: points,
                      tags: tags
                    };

                    const { error } = await supabase
                      .from("Questions")
                      .update(updates)
                      .eq("id", questionId);

                    if (error) throw error;
                    toast.success("Question saved successfully");
                  } catch (error: any) {
                    console.error("Error saving question:", error);
                    toast.error(`Failed to save question: ${error.message}`);
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
    </div>
  )
}


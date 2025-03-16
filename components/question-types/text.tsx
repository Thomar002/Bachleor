"use client"

import { useState, useRef, useEffect } from "react"
import { Menu, Bot, Tag } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { EditorToolbar } from "../editor-toolbar"
import { QuestionTypeDialog } from "../question-type-dialog"
import { Separator } from "@/components/ui/separator"
import { supabase } from "@/lib/supabaseClient"
import { TagDialog } from "../tag-dialog"
import { useParams, useRouter } from "next/navigation"
import { SaveQuestionButton } from "../save-question-button"

interface Props {
  questionName: string;
  initialTags?: string[];
  onTagsChange?: (tags: string[]) => void;
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

  const handleEditorChange = () => {
    const content = answerEditorRef.current?.innerHTML || ""
    console.log("Editor content updated:", content)
    setQuestionContent(content)
  }

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
          <div className="mt-2 flex flex-wrap gap-2">
            {tags.map((tag) => (
              <div key={tag} className="bg-gray-100 px-2 py-1 rounded text-sm">
                {tag}
              </div>
            ))}
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
          onImageUpload={() => { }}
          onVideoUpload={() => { }}
          onFileUpload={() => { }}
        />
      </div>

      <div className="container mx-auto p-6 max-w-3xl">
        <div className="flex gap-6">
          <div className="flex-1">
            <h2 className="text-sm font-medium text-gray-700 mb-2">Question</h2>
            <div
              ref={answerEditorRef}
              contentEditable
              data-placeholder="Enter your question here..."
              className="min-h-[200px] p-4 border rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 empty:before:content-[attr(data-placeholder)] empty:before:text-gray-400"
              style={{ lineHeight: '1.5' }}
              onInput={handleEditorChange}
              dangerouslySetInnerHTML={{ __html: questionContent }}
            />
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <SaveQuestionButton
            displayName={displayName}
            question={questionContent}
            type="text"
          />
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

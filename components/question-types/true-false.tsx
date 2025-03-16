"use client"

import { useState, useRef, useEffect } from "react"
import { Check, Menu, Bot, Tag } from "lucide-react"
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

interface Attachment {
  type: 'image' | 'video' | 'file';
  url: string;
  name: string;
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

  const editorRef = useRef<HTMLDivElement>(null)

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
          if (editorRef.current) {
            editorRef.current.innerHTML = data.question || ""
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
  }, [questionId])

  const handleSave = async () => {
    if (!questionId) return

    try {
      const { error } = await supabase
        .from("Questions")
        .update({
          display_name: displayName,
          question: questionContent,
          type: "True/False"
        })
        .eq("id", questionId)

      if (error) throw error

      toast.success("Question saved successfully")
    } catch (error) {
      console.error("Error saving question:", error)
      toast.error("Failed to save question")
    }
  }

  const handleEditorChange = () => {
    if (editorRef.current) {
      setQuestionContent(editorRef.current.innerHTML)
    }
  }

  if (isLoading) {
    return <div className="p-4">Loading...</div>
  }

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
              <span className="text-sm text-gray-600 mt-1">True/False</span>
            </div>
            <Button
              onClick={() => setIsTagDialogOpen(true)}
              className="flex items-center gap-2"
            >
              <Tag className="h-5 w-5" />
              Tags ({tags.length})
            </Button>
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
      </div>

      <div className="container mx-auto p-6 max-w-3xl">
        <div className="flex gap-6">
          <div className="flex-1">
            <h2 className="text-sm font-medium text-gray-700 mb-2">Question</h2>
            <div
              ref={editorRef}
              contentEditable
              data-placeholder="Enter your question here..."
              className="min-h-[200px] p-4 border rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 empty:before:content-[attr(data-placeholder)] empty:before:text-gray-400"
              style={{ lineHeight: '1.5' }}
              onInput={handleEditorChange}
              dangerouslySetInnerHTML={{ __html: questionContent }}
            />

            <div className="mt-8 space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex-1 flex items-center gap-4">
                  <div
                    className={`h-6 w-6 rounded-full border-2 flex items-center justify-center cursor-pointer ${correctAnswer === true ? "border-green-500 bg-green-500" : "border-gray-300"
                      }`}
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
                    className={`h-6 w-6 rounded-full border-2 flex items-center justify-center cursor-pointer ${correctAnswer === false ? "border-green-500 bg-green-500" : "border-gray-300"
                      }`}
                    onClick={() => setCorrectAnswer(false)}
                  >
                    {correctAnswer === false && <Check className="h-4 w-4 text-white" />}
                  </div>
                  <span>False</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <SaveQuestionButton
            displayName={displayName}
            question={questionContent}
            type={"True/False" as QuestionType}
            onSave={handleSave}
          />
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
  )
}


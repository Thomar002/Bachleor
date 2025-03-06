"use client"

import { useState } from "react"
import { Check, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { EditorToolbar } from "../editor-toolbar"
import { useRouter } from "next/navigation"

export function TrueFalse() {
  const router = useRouter()
  const [correctAnswer, setCorrectAnswer] = useState<"true" | "false" | null>(null)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="border-b bg-white">
        <div className="flex items-center gap-4 p-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-xl font-semibold">True/False Question</h1>
        </div>
        <EditorToolbar />
      </div>

      <div className="container mx-auto p-6 max-w-3xl">
        <Input className="text-lg mb-8" placeholder="Enter your question description here..." />

        <div className="space-y-4">
          {["true", "false"].map((option) => (
            <div key={option} className="flex items-center gap-4">
              <div
                className={`h-6 w-6 rounded-full border-2 flex items-center justify-center cursor-pointer ${
                  correctAnswer === option ? "border-green-500 bg-green-500" : "border-gray-300"
                }`}
                onClick={() => setCorrectAnswer(option as "true" | "false")}
              >
                {correctAnswer === option && <Check className="h-4 w-4 text-white" />}
              </div>
              <span className="capitalize">{option}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}


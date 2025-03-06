"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { SubjectDialog } from "./subject-dialog"

export default function SubjectSelection() {
  const router = useRouter()
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null)
  const [favorites, setFavorites] = useState<string[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)

  useEffect(() => {
    const savedFavorites = localStorage.getItem("favoriteSubjects")
    if (savedFavorites) {
      setFavorites(JSON.parse(savedFavorites))
    }
  }, [])

  const handleSubjectClick = (subject: string) => {
    setSelectedSubject(subject)
    router.push(`/subjects/${subject}`)
  }

  const handleFavoritesChange = (newFavorites: string[]) => {
    setFavorites(newFavorites)
  }

  return (
    <div className="flex-1 p-8">
      {/* Header with Choose Subjects button */}
      <div className="max-w-6xl mx-auto mb-8 flex justify-between items-center">
        <h1 className="text-3xl font-bold">My Subjects</h1>
        <Button
          onClick={() => setDialogOpen(true)}
          className="bg-[#2B4270] hover:bg-[#3B5280] text-white"
        >
          Choose subjects
        </Button>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto">
        {favorites.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[60vh] text-gray-500">
            <p className="text-xl mb-4">No subjects selected</p>
            <Button onClick={() => setDialogOpen(true)}>Choose subjects</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {favorites.map((subject) => (
              <button
                key={subject}
                onClick={() => handleSubjectClick(subject)}
                className={cn(
                  "aspect-video bg-slate-500 p-6 rounded-lg transition-all",
                  "hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500",
                  selectedSubject === subject && "ring-2 ring-blue-500",
                )}
              >
                <span className="text-white text-2xl font-medium">{subject}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <SubjectDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onFavoritesChange={handleFavoritesChange}
      />
    </div>
  )
}


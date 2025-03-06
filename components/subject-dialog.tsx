"use client"

import { useState, useEffect } from "react"
import { Star } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface Subject {
  code: string
  description: string
}

interface SubjectDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onFavoritesChange: (favorites: string[]) => void
}

export function SubjectDialog({ open, onOpenChange, onFavoritesChange }: SubjectDialogProps) {
  const [favorites, setFavorites] = useState<string[]>([])

  const subjects: Subject[] = [
    { code: "IKT210", description: "Menu description." },
    { code: "IKT211", description: "Menu description." },
    { code: "IKT212", description: "Menu description." },
    { code: "IKT213", description: "Menu description." },
    { code: "IKT214", description: "Menu description." },
  ]

  useEffect(() => {
    const savedFavorites = localStorage.getItem("favoriteSubjects")
    if (savedFavorites) {
      setFavorites(JSON.parse(savedFavorites))
    }
  }, [])

  const toggleFavorite = (code: string) => {
    const newFavorites = favorites.includes(code) ? favorites.filter((f) => f !== code) : [...favorites, code]

    setFavorites(newFavorites)
    localStorage.setItem("favoriteSubjects", JSON.stringify(newFavorites))
    onFavoritesChange(newFavorites)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-normal text-center">Subjects</DialogTitle>
          <p className="text-xl text-center font-semibold">Choose the subjects you have</p>
        </DialogHeader>
        <div className="mt-4">
          {subjects.map((subject) => (
            <div key={subject.code} className="flex items-center gap-4 py-4 border-b last:border-b-0">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => toggleFavorite(subject.code)}
                className="hover:bg-transparent"
              >
                <Star
                  className={cn(
                    "w-6 h-6 stroke-2",
                    favorites.includes(subject.code)
                      ? "fill-yellow-400 stroke-yellow-400"
                      : "fill-none stroke-gray-400",
                  )}
                />
              </Button>
              <div>
                <h3 className="text-lg font-semibold">{subject.code}</h3>
                <p className="text-gray-500">{subject.description}</p>
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}


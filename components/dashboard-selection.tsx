"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"

export default function DashboardSelection() {
  const router = useRouter()

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="space-y-4">
        <Button className="w-64 h-16 text-xl" onClick={() => router.push("/my-questions")}>
          My Questions
        </Button>
        <Button className="w-64 h-16 text-xl" onClick={() => router.push("/my-exams")}>
          My Exams
        </Button>
        <Button className="w-64 h-16 text-xl" onClick={() => router.push("/subjects")}>
          Subjects
        </Button>
      </div>
    </div>
  )
}


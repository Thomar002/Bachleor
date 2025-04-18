import ExamList from "@/components/exam-list"
import { Button } from "@/components/ui/button"
import { ChevronLeft } from "lucide-react"
import Link from "next/link"

export default function PublicSubjectPage({ params }: { params: { subjectId: string } }) {
  return (
    <div className="relative pt-12">
      <div className="absolute top-0 left-4">
        <Link href="/public-exams">
          <Button variant="outline">
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back to Subjects
          </Button>
        </Link>
      </div>
      <ExamList subjectId={params.subjectId} isPublic={true} />
    </div>
  )
}

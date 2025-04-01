import QuestionDashboard from "@/components/question-dashboard"
import { supabase } from "@/lib/supabaseClient"
import { unstable_noStore as noStore } from 'next/cache'
import { Button } from "@/components/ui/button"
import { ChevronLeft } from "lucide-react"
import Link from "next/link"

export default async function MyExamPage({ params }: { params: { examId: string } }) {
  noStore()
  const { data: exam } = await supabase.from("Exams").select("*").eq("id", params.examId).single()

  if (!exam) {
    return <div>Exam not found</div>
  }

  return (
    <div className="relative pt-12">
      <div className="absolute top-0 left-4">
        <Link href="/my-exams">
          <Button variant="outline">
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back to My Exams
          </Button>
        </Link>
      </div>
      <QuestionDashboard examId={Number(params.examId)} examName={exam.name} />
    </div>
  )
}

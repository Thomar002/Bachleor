import QuestionDashboard from "@/components/question-dashboard"
import { supabase } from "@/lib/supabaseClient"
import { unstable_noStore as noStore } from 'next/cache'

export default async function MyExamPage({ params }: { params: { examId: string } }) {
  noStore() // Add this line to prevent caching
  const { data: exam } = await supabase.from("Exams").select("*").eq("id", params.examId).single()

  if (!exam) {
    return <div>Exam not found</div>
  }

  return <QuestionDashboard examId={Number(params.examId)} examName={exam.name} />
}


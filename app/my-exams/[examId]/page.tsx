import QuestionDashboard from "@/components/question-dashboard"
import { supabase } from "@/lib/supabaseClient"
import MainLayout from "@/components/layouts/main-layout"

export default async function MyExamPage({ params }: { params: { examId: string } }) {
  const { data: exam } = await supabase.from("Exams").select("*").eq("id", params.examId).single()

  if (!exam) {
    return <div>Exam not found</div>
  }

  return <QuestionDashboard examId={Number(params.examId)} examName={exam.name} />
}


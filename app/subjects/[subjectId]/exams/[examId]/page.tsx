import QuestionDashboard from "@/components/question-dashboard"
import { supabase } from "@/lib/supabaseClient"
import MainLayout from "@/components/layouts/main-layout"

export default async function ExamPage({ params }: { params: { subjectId: string; examId: string } }) {
  const { data: exam } = await supabase.from("Exams").select("*").eq("id", params.examId).single()

  if (!exam) {
    return <div>Exam not found</div>
  }

  return (
    <MainLayout>
      <QuestionDashboard examId={Number(params.examId)} examName={exam.name} />
    </MainLayout>
  )
}


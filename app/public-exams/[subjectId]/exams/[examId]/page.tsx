import QuestionDashboard from "@/components/question-dashboard"
import { supabase } from "@/lib/supabaseClient"
import { unstable_noStore as noStore } from 'next/cache'

export default async function PublicExamPage({ params }: { params: { subjectId: string; examId: string } }) {
  noStore()
  const { data: exam } = await supabase
    .from("Exams")
    .select("*")
    .eq("id", params.examId)
    .eq("is_public", true)
    .single()

  if (!exam) {
    return <div>Exam not found</div>
  }

  return <QuestionDashboard examId={Number(params.examId)} examName={exam.name} isPublic={true} />
}
import QuestionEditor from "@/components/question-editor"
import { supabase } from "@/lib/supabaseClient"
import MainLayout from "@/components/layouts/main-layout"

export default async function QuestionPage({ params }: { params: { examId: string; questionId: string } }) {
  const { data: question } = await supabase
    .from("Questions")
    .select("*")
    .eq("id", params.questionId)
    .single()

  if (!question) {
    return <div>Question not found</div>
  }

  return (
    <QuestionEditor
      questionId={Number(params.questionId)}
      examId={Number(params.examId)}
      initialName={question.name}
      initialDescription={question.description || ""}
      initialType={question.type || []}
    />
  )
}
import ExamList from "@/components/exam-list"

export default function SubjectPage({ params }: { params: { subjectId: string } }) {
  // Send subjectId direkte uten å konvertere til uppercase
  return <ExamList subjectId={params.subjectId} />
}


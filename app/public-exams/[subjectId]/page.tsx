import ExamList from "@/components/exam-list"

export default function PublicSubjectPage({ params }: { params: { subjectId: string } }) {
  return <ExamList subjectId={params.subjectId} isPublic={true} />
}
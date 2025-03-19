import { RenameDialog } from "@/components/rename-dialog"
import ExamList from "@/components/exam-list"

export default function SubjectPage({ params }: { params: { subjectId: string } }) {
  return <ExamList subjectId={params.subjectId} />
}



export type QuestionType =
  | "text"
  | "True/False"
  | "Multiple Choice-single"
  | "Multiple Choice-multi"
  | "Equation";

export interface Exam {
  id: string
  name: string
  description: string
  subject_id: string
  created_at: string
}

export interface Question {
  id: string
  name: string
  content: string
  tags: string[]
  exam_id: string
}

export interface Subject {
  id: string
  name: string
  code: string
}
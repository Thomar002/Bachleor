export type QuestionType =
  | "text"
  | "True/False"
  | "Multiple Choice-single"
  | "Multiple Choice-multi"
  | "Equation";

export interface Exam {
  id: number;
  name: string;
  description: string;
  subject_id: string | null;
  created_at: string;
  is_public: boolean;  // Make sure this is defined as a required boolean
}

export interface Question {
  id: string
  name: string
  content: string
  tags: string[]
  exam_id: string
  points: number
}

export interface Subject {
  id: string
  name: string
  code: string
}

import { supabase } from '@/lib/supabaseClient'
import type { Exam, Question, Subject } from '@/types'

export const api = {
  exams: {
    getAll: async () => {
      const { data, error } = await supabase.from('Exams').select('*')
      if (error) throw error
      return data as Exam[]
    },
    getBySubject: async (subjectId: string) => {
      const { data, error } = await supabase
        .from('Exams')
        .select('*')
        .eq('subject_id', subjectId.toLowerCase())
      if (error) throw error
      return data as Exam[]
    },
  },
  questions: {
    getByExam: async (examId: string) => {
      const { data, error } = await supabase
        .from('Questions')
        .select('*')
        .eq('exam_id', examId)
      if (error) throw error
      return data as Question[]
    },
  },
}
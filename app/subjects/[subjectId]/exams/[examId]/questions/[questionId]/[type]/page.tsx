import { MultipleChoiceSingle } from "@/components/question-types/multiple-choice-single"
import { MultipleChoiceMultiple } from "@/components/question-types/multiple-choice-multiple"
import { TrueFalse } from "@/components/question-types/true-false"

export default function QuestionTypePage({ params }: { params: { type: string } }) {
  const components = {
    "multiple-choice-single": MultipleChoiceSingle,
    "multiple-choice-multiple": MultipleChoiceMultiple,
    "true-false": TrueFalse,
  }

  const Component = components[params.type as keyof typeof components]
  
  if (!Component) {
    return <div>Question type not found</div>
  }

  return <Component />
}
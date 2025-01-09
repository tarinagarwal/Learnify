export interface Question {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

export interface QuizConfig {
  topic: string;
  difficulty: string;
  numQuestions: number;
  pdfContent?: string;
}

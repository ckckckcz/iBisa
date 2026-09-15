export type QuizOption = [string, string, string, string];

export type QuizQuestionInput = {
  question: string;
  options: QuizOption;
  answerIndex: number;
  explanation: string;
};

export type QuizRecord = {
  id: string;
  school_id: string | null;
  created_by: string | null;
  code: string;
  title: string;
  subject: string;
  time_limit: number;
  base_points: number;
  questions: QuizQuestionInput[];
  created_at: string;
};



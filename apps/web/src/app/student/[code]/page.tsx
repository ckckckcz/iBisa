"use client";

import { useParams, useRouter } from "next/navigation";
import { getQuizByCode } from "@/types/questions";
import { QuizNotFound } from "@/features/student-quiz/quiz-not-found";
import { QuizSession } from "@/features/student-quiz/quiz-session";

export default function QuizPlayerPage() {
  const params = useParams<{ code: string }>();
  const router = useRouter();
  const quiz = getQuizByCode(params.code ?? "");

  if (!quiz) {
    return <QuizNotFound onBack={() => router.push("/student")} />;
  }

  return <QuizSession quiz={quiz} />;
}

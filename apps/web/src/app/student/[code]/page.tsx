"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import type { Quiz } from "@/types/questions";
import { fetchQuizByCode } from "@/lib/quizzes";
import { QuizNotFound } from "@/features/student-quiz/quiz-not-found";
import { QuizSession } from "@/features/student-quiz/quiz-session";

export default function QuizPlayerPage() {
  const params = useParams<{ code: string }>();
  const router = useRouter();
  const [quiz, setQuiz] = useState<Quiz | null | undefined>(undefined);

  useEffect(() => {
    let live = true;
    void fetchQuizByCode(params.code ?? "").then((q) => {
      if (live) setQuiz(q);
    });
    return () => {
      live = false;
    };
  }, [params.code]);

  if (quiz === undefined) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-slate-100 px-4">
        <p className="text-sm font-semibold text-slate-500" role="status">Memuat kuis…</p>
      </div>
    );
  }

  if (!quiz) {
    return <QuizNotFound onBack={() => router.push("/student")} />;
  }

  return <QuizSession quiz={quiz} />;
}

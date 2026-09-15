"use client";

import { useRouter } from "next/navigation";
import type { Quiz } from "@/types/questions";
import { useVoiceQuiz } from "@/hooks/use-voice-quiz";
import { useStudentIdentity } from "@/hooks/use-student-identity";
import { useFullscreen } from "../../hooks/use-fullscreen";
import { QuizDetailView } from "./quiz-detail-view";
import { QuizArenaView } from "./quiz-arena-view";

export function QuizSession({ quiz }: { quiz: Quiz }) {
  const router = useRouter();
  const vq = useVoiceQuiz(quiz);
  const { identity } = useStudentIdentity();
  const { isFullscreen, toggleFullscreen } = useFullscreen();

  if (vq.phase === "idle") {
    return (
      <QuizDetailView
        quiz={quiz}
        identity={identity}
        isFullscreen={isFullscreen}
        toggleFullscreen={toggleFullscreen}
        onStartQuiz={vq.start}
        onBack={() => router.push("/student")}
      />
    );
  }

  return (
    <QuizArenaView
      quiz={quiz}
      vq={vq}
      identity={identity}
      isFullscreen={isFullscreen}
      toggleFullscreen={toggleFullscreen}
      onExit={vq.resetToLobby}
    />
  );
}

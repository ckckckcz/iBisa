'use client';

import ChatPage from '@/features/ai/chat-page';

export default function TeacherAiPage() {
  return <ChatPage apiBase="/teacher/ai" allowConfigEdit={false} quizCommands />;
}

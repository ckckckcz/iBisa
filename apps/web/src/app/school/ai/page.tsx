'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AI_MODELS } from '@/lib/constants';
import { followUpsFor } from '@/lib/ai-helpers';
import { useChatSessions } from '@/hooks/use-chat-sessions';
import { useAiConfig } from '@/hooks/use-ai-config';
import { useChat } from '@/hooks/use-chat';
import PromptBar from '@/features/ai/prompt-bar';
import EmptyState from '@/features/ai/empty-state';
import Thinking from '@/features/ai/thinking';
import Loading from '@/features/ai/loading';
import StreamingText from '@/features/ai/streaming-text';
import ApprovalCard from '@/features/ai/approval-card';
import SelectableMessage from '@/features/ai/selection-actions';
import ChatSidebar from '@/features/ai/chat-sidebar';

const MODEL_ITEMS = AI_MODELS.map((m) => ({ key: m.key, name: m.name, tag: m.tag }));

export default function AiPage() {
  const [showConfig, setShowConfig] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  const { prompt, setPrompt, model, setModel, error: configError, setError: setConfigError, save } = useAiConfig();
  const { sessions, activeId, setActiveId, persistSessions, newChat: resetSession, pickSession, deleteSession } = useChatSessions();
  const { chat, setChat, thinking, streaming, activeQuery, queued, error: chatError, send, reset: resetChat } = useChat({
    getActiveId: () => activeId,
    setActiveId,
    onMessageSent: persistSessions,
  });

  const error = configError || chatError;

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [chat, thinking, streaming]);

  function handleNewChat(): void {
    resetSession();
    resetChat();
    setChat([]);
    setConfigError('');
  }

  function handlePickSession(id: string): void {
    const s = pickSession(id);
    if (!s) return;
    setChat(s.messages);
    setActiveId(s.id);
    resetChat();
  }

  function handleDeleteSession(id: string): void {
    deleteSession(id);
    if (id === activeId) handleNewChat();
  }

  return (
    <div className="flex h-[calc(100dvh-4rem)] flex-col overflow-hidden">
      <div className="flex shrink-0 items-center justify-between border-b border-neutral-200 px-4 py-3 lg:px-6">
        <h1 className="text-xl font-semibold">Chat AI</h1>
        <Button variant="outline" size="sm" onClick={() => setShowConfig((c) => !c)}>
          {showConfig ? 'Tutup Konfigurasi' : 'Konfigurasi'}
        </Button>
      </div>

      {error && (
        <div role="alert" className="mx-4 mt-3 shrink-0 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 lg:mx-6">
          {error}
        </div>
      )}

      {showConfig && (
        <div className="mx-4 mt-3 grid shrink-0 gap-3 rounded-lg border p-4 lg:mx-6">
          <Select value={model} onValueChange={(v) => setModel(v ?? model)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {AI_MODELS.map((m) => <SelectItem key={m.key} value={m.key}>{m.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <textarea
            rows={3}
            value={prompt}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setPrompt(e.target.value)}
            placeholder="System prompt"
            className="block w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm"
          />
          <Button onClick={save} className="w-fit">Simpan Konfigurasi</Button>
        </div>
      )}

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <ChatSidebar
          activeId={activeId}
          recents={sessions.map((s) => ({ id: s.id, label: s.title }))}
          onNewChat={handleNewChat}
          onPick={handlePickSession}
          onDelete={handleDeleteSession}
          onContactAdmin={() => alert('Hubungi admin sekolah Anda jika ada kendala.')}
        />

        <div className="flex min-w-0 flex-1 flex-col gap-3 overflow-hidden rounded-lg p-4">
          {chat.length === 0 && !thinking && !streaming ? (
            <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
              <EmptyState onSend={send} model={model} onModelChange={setModel} models={MODEL_ITEMS} />
            </div>
          ) : (
            <>
              <div ref={listRef} className="mx-auto flex w-full max-w-3xl min-h-0 flex-1 flex-col justify-start gap-2 overflow-y-auto px-4 pt-4">
                {chat.map((m, i) => {
                  const isLast = i === chat.length - 1;
                  return (
                    <div key={i} className={`w-full rounded px-3 py-2 text-sm ${m.role === 'user' ? 'bg-blue-50' : ''}`}>
                      {m.role === 'assistant' ? (
                        <>
                          {m.thoughts?.length ? (
                            <div className="mb-1">
                              <Thinking thinking={false} steps={m.thoughts} />
                            </div>
                          ) : null}
                          <SelectableMessage onAction={(action, selected) => send(`${action} teks berikut: "${selected}"`)}>
                            <StreamingText
                              text={isLast && streaming ? streaming : m.content}
                              animate={isLast && streaming !== ''}
                              followUps={isLast ? followUpsFor(activeQuery) : []}
                              onFollowUp={(f) => send(f)}
                              onRetry={isLast && activeQuery ? () => send(activeQuery) : undefined}
                            />
                          </SelectableMessage>
                          {m.questions?.length ? (
                            <div className="mt-2">
                              <ApprovalCard questions={m.questions} onSubmitted={(_, summary) => send(summary)} />
                            </div>
                          ) : null}
                        </>
                      ) : (
                        <>
                          {(m.attachments ?? []).map((a) =>
                            a.kind === 'image' ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img key={a.name} src={`data:${a.mimeType};base64,${a.data}`} alt={a.name} className="mb-1.5 max-h-48 rounded-lg object-cover" />
                            ) : null,
                          )}
                          {(m.attachmentMeta ?? m.attachments?.map((a) => ({ kind: a.kind, name: a.name })) ?? []).map((meta) => (
                            <span key={meta.name} className="mb-1.5 inline-flex items-center gap-1 rounded-[6px] bg-white/70 px-1.5 py-0.5 font-mono text-[11px] text-neutral-600">
                              <span className={`rounded px-1 text-[9px] font-bold uppercase ${meta.kind === 'image' ? 'bg-neutral-800 text-white' : 'bg-neutral-200'}`}>
                                {meta.kind === 'image' ? 'IMG' : meta.name.split('.').pop()}
                              </span>
                              {meta.name}
                            </span>
                          ))}
                          {m.content ? <div>{m.content}</div> : null}
                        </>
                      )}
                    </div>
                  );
                })}
                {thinking && <Loading label={`Memanggil ${model}`} variant="Drive" />}
                {queued > 1 && (
                  <div className="text-xs text-neutral-500">⏳ {queued - 1} pertanyaan dalam antrean…</div>
                )}
              </div>
              <div className="mx-auto w-full max-w-2xl shrink-0 px-4 pt-3 pb-1">
                <PromptBar placeholder="Tanya AI..." onSend={send} currentModel={model} onModelChange={setModel} models={MODEL_ITEMS} />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
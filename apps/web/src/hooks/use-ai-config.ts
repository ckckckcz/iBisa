'use client';

import { useEffect, useState } from 'react';
import { AI_MODELS } from '@/lib/constants';
import { getToken } from '@/lib/ai-helpers';

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000';

export function useAiConfig() {
  const [prompt, setPrompt] = useState('');
  const [model, setModel] = useState(AI_MODELS[0].key);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadConfig() {
      const res = await fetch(`${apiUrl}/school/ai/config`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json();
      if (data.success) {
        setPrompt(data.data.system_prompt);
        setModel(AI_MODELS.find((m) => m.key === data.data.model)?.key ?? AI_MODELS[0].key);
      } else {
        setError(data.message);
      }
    }
    loadConfig();
  }, []);

  async function save(): Promise<void> {
    setError('');
    const res = await fetch(`${apiUrl}/school/ai/config`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
      body: JSON.stringify({ system_prompt: prompt, model }),
    });
    const data = await res.json();
    if (!data.success) setError(data.message);
    else alert('Tersimpan');
  }

  return { prompt, setPrompt, model, setModel, error, setError, save };
}

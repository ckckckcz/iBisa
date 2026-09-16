'use client';

import { useEffect, useState } from 'react';
import { AI_MODELS } from '@/lib/constants';
import { getValidToken } from '@/lib/ai-helpers';

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000';

export function useAiConfig(apiBase = '/school/ai') {
  const [prompt, setPrompt] = useState('');
  const [soalPrompt, setSoalPrompt] = useState('');
  const [model, setModel] = useState(AI_MODELS[0].key);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadConfig() {
      const res = await fetch(`${apiUrl}${apiBase}/config`, {
        headers: { Authorization: `Bearer ${await getValidToken()}` },
      });
      const data = await res.json();
      if (data.success) {
        setPrompt(data.data.system_prompt);
        setSoalPrompt(data.data.soal_system_prompt ?? '');
        setModel(AI_MODELS.find((m) => m.key === data.data.model)?.key ?? AI_MODELS[0].key);
      } else {
        setError(data.message);
      }
    }
    loadConfig();
  }, [apiBase]);

  async function save(): Promise<void> {
    setError('');
    const res = await fetch(`${apiUrl}${apiBase}/config`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${await getValidToken()}` },
      body: JSON.stringify({ system_prompt: prompt, soal_system_prompt: soalPrompt, model }),
    });
    const data = await res.json();
    if (!data.success) setError(data.message);
    else alert('Tersimpan');
  }

  return { prompt, setPrompt, soalPrompt, setSoalPrompt, model, setModel, error, setError, save };
}

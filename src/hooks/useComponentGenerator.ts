import { useState, useCallback } from 'react';
import type { GeneratedComponent, Provider } from '../types';

interface UseComponentGeneratorReturn {
  components: GeneratedComponent[];
  isLoading: boolean;
  error: string | null;
  generate: (prompt: string, apiKey: string | undefined, provider: Provider) => Promise<void>;
  generateStream: (prompt: string, apiKey: string | undefined, provider: Provider) => Promise<void>;
  removeComponent: (id: string) => void;
  clearAll: () => void;
}

export function useComponentGenerator(): UseComponentGeneratorReturn {
  const [components, setComponents] = useState<GeneratedComponent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = useCallback(async (prompt: string, apiKey: string | undefined, provider: Provider) => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, ...(apiKey && { apiKey }), provider }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate component');
      }

      const newComponent: GeneratedComponent = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        prompt,
        code: data.code,
        createdAt: new Date(),
      };

      setComponents((prev) => [newComponent, ...prev]);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const generateStream = useCallback(async (
    prompt: string,
    apiKey: string | undefined,
    provider: Provider,
  ) => {
    setIsLoading(true);
    setError(null);

    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setComponents((prev) => [
      { id, prompt, code: '', createdAt: new Date(), isStreaming: true },
      ...prev,
    ]);

    try {
      const res = await fetch('/api/generate-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, ...(apiKey && { apiKey }), provider }),
      });

      if (!res.ok || !res.body) {
        let errorMessage = '서버 연결에 실패했습니다. 개발 서버가 실행 중인지 확인해주세요.';
        try {
          const data = (await res.json()) as { error?: string };
          if (data.error) errorMessage = data.error;
        } catch {
          // 응답이 JSON이 아님 (프록시 오류 등)
          errorMessage = `서버 오류 (${res.status}): 개발 서버를 재시작해주세요.`;
        }
        throw new Error(errorMessage);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let eventType = '';
      let dataLine = '';
      let receivedDone = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (line.startsWith('event: ')) {
            eventType = line.slice(7).trim();
          } else if (line.startsWith('data: ')) {
            dataLine = line.slice(6).trim();
          } else if (line === '') {
            if (eventType && dataLine) {
              try {
                const parsed = JSON.parse(dataLine) as {
                  type: string;
                  text?: string;
                  code?: string;
                  message?: string;
                };

                if (parsed.type === 'chunk' && parsed.text) {
                  setComponents((prev) =>
                    prev.map((c) => (c.id === id ? { ...c, code: c.code + parsed.text! } : c))
                  );
                } else if (parsed.type === 'done' && parsed.code !== undefined) {
                  receivedDone = true;
                  setComponents((prev) =>
                    prev.map((c) =>
                      c.id === id ? { ...c, code: parsed.code!, isStreaming: false } : c
                    )
                  );
                } else if (parsed.type === 'error') {
                  throw new Error(parsed.message ?? 'Stream error');
                }
              } catch (parseErr) {
                if (parseErr instanceof SyntaxError) {
                  // 파싱 불가 라인 무시
                } else {
                  throw parseErr;
                }
              }
            }
            eventType = '';
            dataLine = '';
          }
        }
      }

      if (!receivedDone) {
        throw new Error('스트림이 완료 이벤트 없이 종료되었습니다. 다시 시도해주세요.');
      }
    } catch (err) {
      setComponents((prev) => prev.filter((c) => c.id !== id));
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const removeComponent = useCallback((id: string) => {
    setComponents((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setComponents([]);
  }, []);

  return { components, isLoading, error, generate, generateStream, removeComponent, clearAll };
}

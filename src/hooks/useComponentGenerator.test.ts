import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useComponentGenerator } from './useComponentGenerator';

function createSseStream(events: string[]): Response {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      for (const event of events) {
        controller.enqueue(encoder.encode(event));
      }
      controller.close();
    },
  });
  return new Response(stream, {
    status: 200,
    headers: { 'Content-Type': 'text/event-stream' },
  });
}

const CHUNK_EVENT = (text: string) =>
  `event: chunk\ndata: ${JSON.stringify({ type: 'chunk', text })}\n\n`;
const DONE_EVENT = (code: string) =>
  `event: done\ndata: ${JSON.stringify({ type: 'done', code })}\n\n`;
const ERROR_EVENT = (message: string) =>
  `event: error\ndata: ${JSON.stringify({ type: 'error', message })}\n\n`;

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('useComponentGenerator - generateStream', () => {
  it('generateStream 호출 즉시 isStreaming:true placeholder 카드가 추가됨', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      createSseStream([DONE_EVENT('const A = () => <div/>; render(<A />);')])
    );
    const { result } = renderHook(() => useComponentGenerator());

    await act(async () => {
      await result.current.generateStream('버튼', undefined, 'anthropic');
    });

    expect(result.current.components).toHaveLength(1);
  });

  it('generateStream 시작 시 isLoading이 true가 됨', async () => {
    let resolveStream!: () => void;
    const pendingStream = new Promise<void>((r) => (resolveStream = r));

    vi.spyOn(globalThis, 'fetch').mockImplementation(async () => {
      await pendingStream;
      return createSseStream([DONE_EVENT('render(<A />);')]);
    });

    const { result } = renderHook(() => useComponentGenerator());

    let generatePromise: Promise<void>;
    act(() => {
      generatePromise = result.current.generateStream('버튼', undefined, 'anthropic');
    });

    expect(result.current.isLoading).toBe(true);
    resolveStream();
    await act(async () => { await generatePromise; });
  });

  it('chunk 이벤트 수신 시 해당 카드의 code에 텍스트가 누적됨', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      createSseStream([
        CHUNK_EVENT('const '),
        CHUNK_EVENT('Button'),
        DONE_EVENT('const Button = () => <button/>; render(<Button />);'),
      ])
    );
    const { result } = renderHook(() => useComponentGenerator());

    await act(async () => {
      await result.current.generateStream('버튼', undefined, 'anthropic');
    });

    expect(result.current.components[0].code).toBe(
      'const Button = () => <button/>; render(<Button />);'
    );
  });

  it('done 이벤트 수신 시 isStreaming이 false로 변경됨', async () => {
    const finalCode = 'const A = () => <div/>; render(<A />);';
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      createSseStream([DONE_EVENT(finalCode)])
    );
    const { result } = renderHook(() => useComponentGenerator());

    await act(async () => {
      await result.current.generateStream('A', undefined, 'anthropic');
    });

    expect(result.current.components[0].isStreaming).toBe(false);
  });

  it('done 이벤트 수신 시 code가 finalCode로 교체됨', async () => {
    const finalCode = 'const A = () => <div/>; render(<A />);';
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      createSseStream([
        CHUNK_EVENT('partial code'),
        DONE_EVENT(finalCode),
      ])
    );
    const { result } = renderHook(() => useComponentGenerator());

    await act(async () => {
      await result.current.generateStream('A', undefined, 'anthropic');
    });

    expect(result.current.components[0].code).toBe(finalCode);
  });

  it('done 이벤트 후 isLoading이 false로 변경됨', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      createSseStream([DONE_EVENT('render(<A />);')])
    );
    const { result } = renderHook(() => useComponentGenerator());

    await act(async () => {
      await result.current.generateStream('A', undefined, 'anthropic');
    });

    expect(result.current.isLoading).toBe(false);
  });

  it('error 이벤트 수신 시 placeholder 카드가 제거됨', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      createSseStream([ERROR_EVENT('API 오류')])
    );
    const { result } = renderHook(() => useComponentGenerator());

    await act(async () => {
      await result.current.generateStream('A', undefined, 'anthropic');
    });

    expect(result.current.components).toHaveLength(0);
  });

  it('error 이벤트 수신 시 error 상태가 설정됨', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      createSseStream([ERROR_EVENT('API 오류')])
    );
    const { result } = renderHook(() => useComponentGenerator());

    await act(async () => {
      await result.current.generateStream('A', undefined, 'anthropic');
    });

    expect(result.current.error).toBe('API 오류');
  });

  it('네트워크 에러 시 placeholder 카드가 제거됨', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Network failed'));
    const { result } = renderHook(() => useComponentGenerator());

    await act(async () => {
      await result.current.generateStream('A', undefined, 'anthropic');
    });

    expect(result.current.components).toHaveLength(0);
    expect(result.current.error).toBe('Network failed');
  });

  it('error 후 isLoading이 false로 변경됨', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      createSseStream([ERROR_EVENT('오류')])
    );
    const { result } = renderHook(() => useComponentGenerator());

    await act(async () => {
      await result.current.generateStream('A', undefined, 'anthropic');
    });

    expect(result.current.isLoading).toBe(false);
  });

  it('분할된 청크(불완전한 라인)도 올바르게 처리됨', async () => {
    const finalCode = 'const A = () => <div/>; render(<A />);';
    const fullEvent = DONE_EVENT(finalCode);
    const half = Math.floor(fullEvent.length / 2);
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      createSseStream([fullEvent.slice(0, half), fullEvent.slice(half)])
    );
    const { result } = renderHook(() => useComponentGenerator());

    await act(async () => {
      await result.current.generateStream('A', undefined, 'anthropic');
    });

    expect(result.current.components[0].code).toBe(finalCode);
    expect(result.current.components[0].isStreaming).toBe(false);
  });
});

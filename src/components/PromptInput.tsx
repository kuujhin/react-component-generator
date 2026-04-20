import { useState } from 'react';

interface PromptInputProps {
  onGenerate: (prompt: string) => void;
  isLoading: boolean;
}

const EXAMPLES = [
  '커서가 깜빡이며 한 글자씩 타이핑되는 애니메이션 텍스트. 여러 문장을 순환하며 반복',
  '클릭하면 3D로 뒤집히는 카드. 앞면은 아바타와 이름, 뒷면은 이메일과 SNS 링크',
  '0에서 목표 숫자까지 카운트업 애니메이션이 있는 통계 대시보드. 매출, 사용자 수, 전환율 3개 카드',
  '포커스 시 입력 필드가 네온 빛으로 빛나는 다크 테마 로그인 폼. 이메일, 비밀번호, 로그인 버튼 포함',
  '별 이모지에 호버하면 노란색으로 채워지고, 클릭하면 평점이 고정되는 5점 만점 리뷰 위젯',
  '반투명 배경에 블러 효과가 적용된 글래스모피즘 날씨 카드. 온도, 날씨 아이콘, 습도, 풍속 표시',
];

export function PromptInput({ onGenerate, isLoading }: PromptInputProps) {
  const [prompt, setPrompt] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim() && !isLoading) {
      onGenerate(prompt.trim());
    }
  };

  const handleExampleClick = (example: string) => {
    setPrompt(example);
  };

  const handleRandomExample = () => {
    const current = prompt.trim();
    const filtered = EXAMPLES.filter((e) => e !== current);
    const pool = filtered.length > 0 ? filtered : EXAMPLES;
    setPrompt(pool[Math.floor(Math.random() * pool.length)]);
  };

  return (
    <div className="prompt-section">
      <form onSubmit={handleSubmit} className="prompt-form">
        <div className="prompt-textarea-wrapper">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="만들고 싶은 컴포넌트를 설명해주세요..."
            className="prompt-textarea"
            rows={3}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                handleSubmit(e);
              }
            }}
          />
          <span className="prompt-char-count">{prompt.length}자</span>
        </div>
        <button
          type="submit"
          className="btn-generate"
          disabled={!prompt.trim() || isLoading}
        >
          {isLoading ? (
            <span className="loading-spinner">생성 중...</span>
          ) : (
            '컴포넌트 생성'
          )}
        </button>
      </form>
      <div className="prompt-examples">
        <span className="examples-label">예시:</span>
        <button
          type="button"
          className="btn-random-example"
          onClick={handleRandomExample}
          title="랜덤 추천 프롬프트 입력"
        >
          ⚄ RANDOM
        </button>
        {EXAMPLES.map((example) => (
          <button
            key={example}
            className="example-chip"
            onClick={() => handleExampleClick(example)}
            type="button"
          >
            {example}
          </button>
        ))}
      </div>
    </div>
  );
}

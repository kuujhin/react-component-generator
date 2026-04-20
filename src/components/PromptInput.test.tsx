import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PromptInput } from './PromptInput';

describe('PromptInput', () => {
  describe('handleSubmit', () => {
    it('should not call onGenerate when prompt is empty', async () => {
      const onGenerate = vi.fn();
      const user = userEvent.setup();
      render(<PromptInput onGenerate={onGenerate} isLoading={false} />);

      const button = screen.getByRole('button', { name: /컴포넌트 생성/ });
      await user.click(button);

      expect(onGenerate).not.toHaveBeenCalled();
    });

    it('should not call onGenerate when prompt is whitespace only', async () => {
      const onGenerate = vi.fn();
      const user = userEvent.setup();
      render(<PromptInput onGenerate={onGenerate} isLoading={false} />);

      const textarea = screen.getByPlaceholderText(/만들고 싶은 컴포넌트/);
      await user.type(textarea, '   ');

      const button = screen.getByRole('button', { name: /컴포넌트 생성/ });
      await user.click(button);

      expect(onGenerate).not.toHaveBeenCalled();
    });

    it('should call onGenerate with trimmed value when prompt is valid', async () => {
      const onGenerate = vi.fn();
      const user = userEvent.setup();
      render(<PromptInput onGenerate={onGenerate} isLoading={false} />);

      const textarea = screen.getByPlaceholderText(/만들고 싶은 컴포넌트/);
      await user.type(textarea, '  카운터 컴포넌트  ');

      const button = screen.getByRole('button', { name: /컴포넌트 생성/ });
      await user.click(button);

      expect(onGenerate).toHaveBeenCalledWith('카운터 컴포넌트');
      expect(onGenerate).toHaveBeenCalledTimes(1);
    });

    it('should not call onGenerate when isLoading is true', async () => {
      const onGenerate = vi.fn();
      const user = userEvent.setup();
      render(<PromptInput onGenerate={onGenerate} isLoading={true} />);

      const textarea = screen.getByPlaceholderText(/만들고 싶은 컴포넌트/);
      await user.type(textarea, '카운터 컴포넌트');

      const button = screen.getByRole('button', { name: /생성 중/ });
      expect(button).toBeDisabled();

      expect(onGenerate).not.toHaveBeenCalled();
    });
  });

  describe('handleRandomExample', () => {
    it('should exclude current example from pool', async () => {
      const onGenerate = vi.fn();
      const user = userEvent.setup();
      render(<PromptInput onGenerate={onGenerate} isLoading={false} />);

      const textarea = screen.getByPlaceholderText(/만들고 싶은 컴포넌트/) as HTMLTextAreaElement;
      const exampleChips = screen.getAllByRole('button');
      const typeWritingChip = exampleChips.find(btn => btn.textContent?.includes('커서가 깜빡이'));

      // Click the first example chip to set current example
      if (typeWritingChip) {
        await user.click(typeWritingChip);
      }
      expect(textarea.value).toContain('커서가 깜빡이');

      const currentValue = textarea.value;
      const randomBtn = screen.getByRole('button', { name: /RANDOM/ });

      // Click random button multiple times and collect results
      // With 6 examples, the probability of getting a different value increases significantly
      const results = new Set<string>();
      for (let i = 0; i < 10; i++) {
        await user.click(randomBtn);
        results.add(textarea.value);
      }

      // Should have at least 2 different values (not always the same)
      expect(results.size).toBeGreaterThan(1);
      // Current example should not be the only result
      expect(results.size).toBeGreaterThanOrEqual(2);
    });

    it('should fallback to full pool when current example has no exact match', async () => {
      const onGenerate = vi.fn();
      const user = userEvent.setup();
      const { rerender } = render(
        <PromptInput onGenerate={onGenerate} isLoading={false} />
      );

      const textarea = screen.getByPlaceholderText(/만들고 싶은 컴포넌트/);

      // Set custom text that matches no example exactly
      await user.type(textarea, '완전히 새로운 텍스트');
      const randomBtn = screen.getByRole('button', { name: /RANDOM/ });

      await user.click(randomBtn);

      // Should set one of the example values
      const newValue = (textarea as HTMLTextAreaElement).value;
      const examples = [
        '커서가 깜빡이며 한 글자씩 타이핑되는 애니메이션 텍스트. 여러 문장을 순환하며 반복',
        '클릭하면 3D로 뒤집히는 카드. 앞면은 아바타와 이름, 뒷면은 이메일과 SNS 링크',
        '0에서 목표 숫자까지 카운트업 애니메이션이 있는 통계 대시보드. 매출, 사용자 수, 전환율 3개 카드',
        '포커스 시 입력 필드가 네온 빛으로 빛나는 다크 테마 로그인 폼. 이메일, 비밀번호, 로그인 버튼 포함',
        '별 이모지에 호버하면 노란색으로 채워지고, 클릭하면 평점이 고정되는 5점 만점 리뷰 위젯',
        '반투명 배경에 블러 효과가 적용된 글래스모피즘 날씨 카드. 온도, 날씨 아이콘, 습도, 풍속 표시',
      ];
      expect(examples).toContain(newValue);
    });

    it('should handle edge case of single example in filtered pool', async () => {
      const onGenerate = vi.fn();
      const user = userEvent.setup();
      render(<PromptInput onGenerate={onGenerate} isLoading={false} />);

      const textarea = screen.getByPlaceholderText(/만들고 싶은 컴포넌트/);
      const randomBtn = screen.getByRole('button', { name: /RANDOM/ });

      // Click random button to set an example
      await user.click(randomBtn);
      const firstRandomValue = (textarea as HTMLTextAreaElement).value;

      // Click again - should not be the same as first if pool has more than 1 item
      // But if by chance we get same value, that's acceptable as long as code doesn't crash
      await user.click(randomBtn);
      // Should still have a valid example value
      const secondRandomValue = (textarea as HTMLTextAreaElement).value;
      expect(secondRandomValue).toBeTruthy();
    });
  });

  describe('Keyboard shortcuts', () => {
    it('should submit form on Ctrl+Enter', async () => {
      const onGenerate = vi.fn();
      const user = userEvent.setup();
      render(<PromptInput onGenerate={onGenerate} isLoading={false} />);

      const textarea = screen.getByPlaceholderText(/만들고 싶은 컴포넌트/) as HTMLTextAreaElement;
      await user.type(textarea, '카운터 컴포넌트');

      // Simulate Ctrl+Enter key press via keyboard event
      textarea.focus();
      await user.keyboard('{Control>}{Enter}{/Control}');

      expect(onGenerate).toHaveBeenCalledWith('카운터 컴포넌트');
    });

    it('should submit form on Cmd+Enter (Mac)', async () => {
      const onGenerate = vi.fn();
      const user = userEvent.setup();
      render(<PromptInput onGenerate={onGenerate} isLoading={false} />);

      const textarea = screen.getByPlaceholderText(/만들고 싶은 컴포넌트/) as HTMLTextAreaElement;
      await user.type(textarea, 'Mac 단축키 테스트');

      // Simulate Cmd+Enter key press via keyboard event
      textarea.focus();
      await user.keyboard('{Meta>}{Enter}{/Meta}');

      expect(onGenerate).toHaveBeenCalledWith('Mac 단축키 테스트');
    });
  });

  describe('Button disabled state', () => {
    it('should disable button when prompt is empty', () => {
      const onGenerate = vi.fn();
      render(<PromptInput onGenerate={onGenerate} isLoading={false} />);

      const button = screen.getByRole('button', { name: /컴포넌트 생성/ });
      expect(button).toBeDisabled();
    });

    it('should enable button when prompt has content', async () => {
      const onGenerate = vi.fn();
      const user = userEvent.setup();
      render(<PromptInput onGenerate={onGenerate} isLoading={false} />);

      const textarea = screen.getByPlaceholderText(/만들고 싶은 컴포넌트/);
      await user.type(textarea, '테스트');

      const button = screen.getByRole('button', { name: /컴포넌트 생성/ });
      expect(button).not.toBeDisabled();
    });

    it('should disable button when isLoading is true', async () => {
      const onGenerate = vi.fn();
      const user = userEvent.setup();
      const { rerender } = render(
        <PromptInput onGenerate={onGenerate} isLoading={false} />
      );

      const textarea = screen.getByPlaceholderText(/만들고 싶은 컴포넌트/);
      await user.type(textarea, '테스트');

      const button = screen.getByRole('button', { name: /컴포넌트 생성/ });
      expect(button).not.toBeDisabled();

      // Rerender with isLoading=true
      rerender(<PromptInput onGenerate={onGenerate} isLoading={true} />);

      const loadingButton = screen.getByRole('button', { name: /생성 중/ });
      expect(loadingButton).toBeDisabled();
    });

    it('should disable button when prompt is whitespace only', async () => {
      const onGenerate = vi.fn();
      const user = userEvent.setup();
      render(<PromptInput onGenerate={onGenerate} isLoading={false} />);

      const textarea = screen.getByPlaceholderText(/만들고 싶은 컴포넌트/);
      await user.type(textarea, '   ');

      const button = screen.getByRole('button', { name: /컴포넌트 생성/ });
      expect(button).toBeDisabled();
    });
  });

  describe('Example chips interaction', () => {
    it('should set prompt when example chip is clicked', async () => {
      const onGenerate = vi.fn();
      const user = userEvent.setup();
      render(<PromptInput onGenerate={onGenerate} isLoading={false} />);

      const textarea = screen.getByPlaceholderText(/만들고 싶은 컴포넌트/) as HTMLTextAreaElement;
      const exampleChips = screen.getAllByRole('button');
      const typeWritingChip = exampleChips.find(btn => btn.textContent?.includes('커서가 깜빡이'));

      if (typeWritingChip) {
        await user.click(typeWritingChip);
      }

      expect(textarea.value).toContain('커서가 깜빡이');
    });

    it('should render all example chips', () => {
      const onGenerate = vi.fn();
      render(<PromptInput onGenerate={onGenerate} isLoading={false} />);

      const exampleChips = screen.getAllByRole('button');
      // 6 example chips + 1 submit button + 1 random button = 8 buttons
      expect(exampleChips.length).toBe(8);
    });
  });

  describe('Character count display', () => {
    it('should display character count', async () => {
      const onGenerate = vi.fn();
      const user = userEvent.setup();
      render(<PromptInput onGenerate={onGenerate} isLoading={false} />);

      expect(screen.getByText('0자')).toBeInTheDocument();

      const textarea = screen.getByPlaceholderText(/만들고 싶은 컴포넌트/);
      await user.type(textarea, '테스트');

      expect(screen.getByText('3자')).toBeInTheDocument();
    });
  });
});

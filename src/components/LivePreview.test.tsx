import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LivePreview } from './LivePreview';

describe('LivePreview - Responsive Viewport', () => {
  const testCode = 'const Component = () => <div>테스트</div>; render(<Component />);';

  it('초기 뷰포트는 desktop이어야 함', () => {
    render(<LivePreview code={testCode} />);
    const desktopBtn = screen.getByRole('button', { name: /데스크탑/ });
    expect(desktopBtn).toHaveClass('btn-viewport--active');
  });

  it('모바일 버튼 클릭 시 viewport를 mobile로 변경', async () => {
    const user = userEvent.setup();
    render(<LivePreview code={testCode} />);

    const mobileBtn = screen.getByRole('button', { name: /모바일/ });
    await user.click(mobileBtn);

    expect(mobileBtn).toHaveClass('btn-viewport--active');
    expect(screen.getByRole('button', { name: /데스크탑/ })).not.toHaveClass(
      'btn-viewport--active'
    );
  });

  it('태블릿 버튼 클릭 시 viewport를 tablet으로 변경', async () => {
    const user = userEvent.setup();
    render(<LivePreview code={testCode} />);

    const tabletBtn = screen.getByRole('button', { name: /태블릿/ });
    await user.click(tabletBtn);

    expect(tabletBtn).toHaveClass('btn-viewport--active');
  });

  it('preview-render의 max-width가 viewport에 따라 변경됨', async () => {
    const user = userEvent.setup();
    const { container } = render(<LivePreview code={testCode} />);
    const previewRender = container.querySelector('.preview-render');

    // 초기값: desktop (100%)
    expect(previewRender).toHaveStyle({ maxWidth: '100%' });

    // 모바일: 375px
    const mobileBtn = screen.getByRole('button', { name: /모바일/ });
    await user.click(mobileBtn);
    expect(previewRender).toHaveStyle({ maxWidth: '375px' });

    // 태블릿: 768px
    const tabletBtn = screen.getByRole('button', { name: /태블릿/ });
    await user.click(tabletBtn);
    expect(previewRender).toHaveStyle({ maxWidth: '768px' });

    // 데스크탑: 100%
    const desktopBtn = screen.getByRole('button', { name: /데스크탑/ });
    await user.click(desktopBtn);
    expect(previewRender).toHaveStyle({ maxWidth: '100%' });
  });

  it('panel-header에 viewport 버튼 3개가 렌더링됨', () => {
    render(<LivePreview code={testCode} />);

    expect(screen.getByRole('button', { name: /모바일/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /태블릿/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /데스크탑/ })).toBeInTheDocument();
  });
});

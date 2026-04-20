import { useState } from 'react';
import { LiveProvider, LivePreview as ReactLivePreview, LiveError } from 'react-live';

interface LivePreviewProps {
  code: string;
}

type Viewport = 'mobile' | 'tablet' | 'desktop';

const VIEWPORT_SIZES: Record<Viewport, string> = {
  mobile: '375px',
  tablet: '768px',
  desktop: '100%',
};

const VIEWPORT_LABELS: Record<Viewport, string> = {
  mobile: '모바일',
  tablet: '태블릿',
  desktop: '데스크탑',
};

export function LivePreview({ code }: LivePreviewProps) {
  const [viewport, setViewport] = useState<Viewport>('desktop');

  return (
    <div className="preview-panel">
      <div className="panel-header">
        <h3>미리보기</h3>
        <div className="viewport-buttons">
          {(Object.keys(VIEWPORT_LABELS) as Viewport[]).map((vp) => (
            <button
              key={vp}
              className={`btn-viewport ${viewport === vp ? 'btn-viewport--active' : ''}`}
              onClick={() => setViewport(vp)}
            >
              {VIEWPORT_LABELS[vp]}
            </button>
          ))}
        </div>
      </div>
      <div className="preview-content">
        <LiveProvider code={code} noInline>
          <div
            className="preview-render"
            style={{ maxWidth: VIEWPORT_SIZES[viewport] }}
          >
            <ReactLivePreview />
          </div>
          <LiveError className="preview-error" />
        </LiveProvider>
      </div>
    </div>
  );
}

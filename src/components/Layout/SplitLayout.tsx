import { ReactNode } from 'react';

interface SplitLayoutProps {
  mapContent: ReactNode;
  listContent: ReactNode;
}

export function SplitLayout({ mapContent, listContent }: SplitLayoutProps) {
  return (
    <div className="split-layout">
      <div className="map-panel">{mapContent}</div>
      <div className="list-panel">{listContent}</div>
    </div>
  );
}

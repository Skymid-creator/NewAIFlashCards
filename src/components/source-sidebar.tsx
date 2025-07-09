'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface SourceSidebarProps {
  sourceText: string;
  highlightedRange: { start: number; end: number } | null;
}

export default function SourceSidebar({ sourceText, highlightedRange }: SourceSidebarProps) {
  const getHighlightedText = () => {
    if (!highlightedRange) {
      return <p>{sourceText}</p>;
    }

    const { start, end } = highlightedRange;
    const preHighlight = sourceText.substring(0, start);
    const highlight = sourceText.substring(start, end);
    const postHighlight = sourceText.substring(end);

    return (
      <p>
        {preHighlight}
        <span className="bg-yellow-200">{highlight}</span>
        {postHighlight}
      </p>
    );
  };

  return (
    <Card className="w-1/3 h-full overflow-y-auto">
      <CardHeader>
        <CardTitle>Original Source</CardTitle>
      </CardHeader>
      <CardContent>
        {getHighlightedText()}
      </CardContent>
    </Card>
  );
}

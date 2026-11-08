import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'PathTrip — 헤매지 말고, 여행하세요',
  description:
    '가고 싶은 곳을 담으면 이동 시간을 줄인 나만의 여행 동선을 만들어 드립니다.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#173e35',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}

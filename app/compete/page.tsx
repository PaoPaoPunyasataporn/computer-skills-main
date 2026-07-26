import type { Metadata } from 'next';
import CompeteApp from '@/components/CompeteApp';

export const metadata: Metadata = {
  title: 'สนามแข่งขัน · แข่งกับเพื่อน',
  description: 'แข่งพิมพ์ดีด คลิกเมาส์ และตอบสถานการณ์กับเพื่อนแบบสด ๆ ไม่ต้องสมัครสมาชิก',
};

// Live races between students. Nothing here is stored beyond the race itself.
export default function ComputePage() {
  return <CompeteApp />;
}

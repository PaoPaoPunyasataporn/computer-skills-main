import { notFound } from 'next/navigation';
import { areaByNum } from '@/lib/content';
import LessonApp from '@/components/LessonApp';

export function generateStaticParams() {
  return [0, 1, 2, 3, 4, 5].map((n) => ({ num: String(n) }));
}

export default async function AreaPage({ params }: { params: Promise<{ num: string }> }) {
  const { num } = await params;
  const area = areaByNum(Number(num));
  if (!area) notFound();
  return <LessonApp area={area} />;
}

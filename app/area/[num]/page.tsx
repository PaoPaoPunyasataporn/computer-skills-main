import { notFound } from 'next/navigation';
import { areaByNum } from '@/lib/content';
import LessonApp from '@/components/LessonApp';

// Deliberately NOT statically pre-rendered (no generateStaticParams): mixing
// static and dynamic routes here was tripping a Vercel build-output bug
// ("Unable to find lambda for route: /area/0"). Six lightweight pages
// rendered on-demand is not worth fighting that for.
export default async function AreaPage({ params }: { params: Promise<{ num: string }> }) {
  const { num } = await params;
  const area = areaByNum(Number(num));
  if (!area) notFound();
  return <LessonApp area={area} />;
}

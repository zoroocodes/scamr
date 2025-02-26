import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { TopThread } from '@/types';

export async function GET() {
  try {
    // Fetch top 5 threads with most posts
    const topThreads: TopThread[] = await prisma.cAPost.groupBy({
      by: ['ca'],
      _count: { id: true },
      orderBy: {
        _count: {
          id: 'desc'
        }
      },
      take: 5
    });

    // Transform the result to match our interface
    const formattedThreads = topThreads.map(thread => ({
      ca: thread.ca,
      postCount: thread._count.id
    }));

    return NextResponse.json(formattedThreads);
  } catch (error) {
    console.error('Error fetching top threads:', error);
    return NextResponse.json({ error: 'Failed to fetch top threads' }, { status: 500 });
  }
}
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Thread } from '@/types';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const ca = searchParams.get('ca');
    const search = searchParams.get('search');

    const whereCondition: Record<string, unknown> = ca ? { ca } : {};

    if (search) {
      whereCondition.OR = [
        { ca: { contains: search, mode: 'insensitive' } },
        { message: { contains: search, mode: 'insensitive' } },
        { twitter: { contains: search, mode: 'insensitive' } }
      ];
    }

    const posts: Thread[] = await prisma.cAPost.findMany({
      where: whereCondition,
      orderBy: {
        timestamp: 'desc'
      },
      take: 1000
    });

    return NextResponse.json(posts);
  } catch (error) {
    console.error('GET Error:', error);
    return NextResponse.json({ error: 'Error fetching posts' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body.ca) {
      return NextResponse.json({ error: 'Contract address is required' }, { status: 400 });
    }
    if (!body.message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const post = await prisma.cAPost.create({
      data: {
        ca: body.ca,
        message: body.message,
        twitter: body.twitter || null,
        link: body.link || null,
        gif: body.gif || null,
      },
    });

    return NextResponse.json(post);
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { 
        error: 'Error creating post', 
        details: (error as Error).message,
      }, 
      { status: 500 }
    );
  }
}
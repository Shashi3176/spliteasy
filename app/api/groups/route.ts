import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import Group from '@/models/Group';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    await connectDB();
    
    const groups = await Group.find({ 'members.userId': session.user.id })
      .sort({ createdAt: -1 });
    
    const groupsWithMemberCount = groups.map((group) => ({
      _id: group._id,
      name: group.name,
      description: group.description,
      currency: group.currency,
      createdAt: group.createdAt,
      memberCount: group.members.length,
    }));
    
    return NextResponse.json(groupsWithMemberCount);
  } catch (error) {
    console.error('Error fetching groups:', error);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await request.json();
    const { name, description, currency } = body;
    
    if (!name || name.trim() === '') {
      return NextResponse.json({ error: 'Group name is required' }, { status: 400 });
    }
    
    await connectDB();
    
    const group = await Group.create({
      name: name.trim(),
      description: description || '',
      currency: currency || 'INR',
      createdBy: session.user.id,
      members: [{ userId: session.user.id, role: 'admin', joinedAt: new Date() }],
    });
    
    return NextResponse.json({
      _id: group._id,
      name: group.name,
      description: group.description,
      currency: group.currency,
      createdAt: group.createdAt,
      memberCount: group.members.length,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating group:', error);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
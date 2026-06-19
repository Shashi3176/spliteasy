import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import Group from '@/models/Group';
import User from '@/models/User';

export async function POST(request: Request, { params }: { params: Promise<{ groupId: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { groupId } = await params;
    
    await connectDB();
    
    const group = await Group.findById(groupId);
    
    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }
    
    const requesterMember = group.members.find(
      (m: { userId: { toString(): string }; role: string }) => m.userId.toString() === session.user.id
    );
    
    if (!requesterMember || requesterMember.role !== 'admin') {
      return NextResponse.json({ error: 'Only admins can add members' }, { status: 403 });
    }
    
    const body = await request.json();
    const { email } = body;
    
    if (!email || email.trim() === '') {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }
    
    const user = await User.findOne({ email: email.trim().toLowerCase() });
    
    if (!user) {
      return NextResponse.json({ error: 'No user found with this email' }, { status: 404 });
    }
    
    const alreadyMember = group.members.some(
      (m: { userId: { toString(): string } }) => m.userId.toString() === user._id.toString()
    );
    
    if (alreadyMember) {
      return NextResponse.json({ error: 'User is already a member of this group' }, { status: 409 });
    }
    
    group.members.push({ userId: user._id, role: 'member', joinedAt: new Date() });
    await group.save();
    
    return NextResponse.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      role: 'member',
    }, { status: 201 });
  } catch (error) {
    console.error('Error adding member:', error);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
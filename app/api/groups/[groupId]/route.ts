import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import mongoose from 'mongoose';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import Group from '@/models/Group';

export async function GET(request: Request, { params }: { params: Promise<{ groupId: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { groupId } = await params;
    
    if (!mongoose.Types.ObjectId.isValid(groupId)) {
      return NextResponse.json({ error: 'Invalid group ID' }, { status: 400 });
    }
    
    await connectDB();
    
    const group = await Group.findById(groupId)
      .populate('members.userId', 'name email avatar')
      .populate('createdBy', 'name email avatar');
    
    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }
    
    const isMember = group.members.some(
      (member: { userId: { _id: mongoose.Types.ObjectId | string } }) => 
        member.userId._id?.toString() === session.user.id
    );
    
    if (!isMember) {
      return NextResponse.json({ error: 'You are not a member of this group' }, { status: 403 });
    }
    
    return NextResponse.json(group);
  } catch (error) {
    console.error('Error fetching group:', error);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ groupId: string }> }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { groupId } = await params;

    if (!mongoose.Types.ObjectId.isValid(groupId)) {
      return NextResponse.json({ error: 'Invalid group ID' }, { status: 400 });
    }

    await connectDB();

    const group = await Group.findById(groupId);

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    const isAdmin = group.members.some(
      (member: { userId: { _id: mongoose.Types.ObjectId | string }; role?: string }) =>
        member.userId._id?.toString() === session.user.id && member.role === 'admin'
    );

    if (!isAdmin) {
      return NextResponse.json({ error: 'Only admins can delete this group' }, { status: 403 });
    }

    // Related data cleanup will be needed once expenses exist.
    await Group.findByIdAndDelete(groupId);

    return NextResponse.json({ message: 'Group deleted successfully' });
  } catch (error) {
    console.error('Error deleting group:', error);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}

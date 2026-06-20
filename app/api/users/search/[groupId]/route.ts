import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import mongoose from 'mongoose';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import Group from '@/models/Group';
import User from '@/models/User';

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

    const email = new URL(request.url).searchParams.get('email');

    if (!email || email.trim() === '') {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    await connectDB();

    const group = await Group.findById(groupId);

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    const requesterMember = group.members.find(
      (member) => member.userId.toString() === session.user?.id
    );

    if (!requesterMember || requesterMember.role !== 'admin') {
      return NextResponse.json({ error: 'Only admins can search for new members' }, { status: 403 });
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() }).select(
      'name email avatar'
    );

    if (!user) {
      return NextResponse.json({ error: 'No user found with this email' }, { status: 404 });
    }

    return NextResponse.json({
      _id: user._id.toString(),
      name: user.name ?? '',
      email: user.email,
      avatar: user.avatar ?? null,
    });
  } catch (error) {
    console.error('Error searching user:', error);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}

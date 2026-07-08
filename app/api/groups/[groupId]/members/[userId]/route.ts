import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import Group from '@/models/Group';

export async function DELETE(request: Request, { params }: { params: Promise<{ groupId: string; userId: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { groupId, userId } = await params;
    
    await connectDB();
    
    const group = await Group.findById(groupId);
    
    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }
    
    const requesterMember = group.members.find(
      (m: { userId: { toString(): string }; role: string }) => m.userId.toString() === session.user.id
    );
    
    if (!requesterMember || requesterMember.role !== 'admin') {
      return NextResponse.json({ error: 'Only admins can remove members' }, { status: 403 });
    }
    
    const targetMember = group.members.find(
      (m: { userId: { toString(): string }; role: string }) => m.userId.toString() === userId
    );
    
    if (!targetMember) {
      return NextResponse.json({ error: 'User is not a member of this group' }, { status: 404 });
    }
    
    if (targetMember.role === 'admin') {
      const adminCount = group.members.filter(
        (m: { role: string }) => m.role === 'admin'
      ).length;
      
      if (adminCount === 1) {
        return NextResponse.json({ error: 'Cannot remove the only admin. Assign another admin first.' }, { status: 400 });
      }
    }
    
    group.members = group.members.filter(
      (m: { userId: { toString(): string } }) => m.userId.toString() !== userId
    );
    await group.save();
    
    return NextResponse.json({ message: 'Member removed successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error removing member:', error);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
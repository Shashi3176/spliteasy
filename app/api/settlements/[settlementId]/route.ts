import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import Settlement from '@/models/Settlement';
import Group from '@/models/Group';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ settlementId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { settlementId } = await params;

    if (!mongoose.Types.ObjectId.isValid(settlementId)) {
      return NextResponse.json({ error: 'Invalid settlement ID' }, { status: 400 });
    }

    await connectDB();

    const settlement = await Settlement.findById(settlementId);

    if (!settlement) {
      return NextResponse.json({ error: 'Settlement not found' }, { status: 404 });
    }

    const group = await Group.findById(settlement.groupId);

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    const userMember = group.members.find(
      (member: { userId: mongoose.Types.ObjectId }) => member.userId.toString() === session.user.id
    );

    if (!userMember) {
      return NextResponse.json({ error: "You don't have access to this settlement" }, { status: 403 });
    }

    const isFromUser = settlement.from.toString() === session.user.id;
    const isToUser = settlement.to.toString() === session.user.id;
    const isAdmin = userMember.role === 'admin';

    if (!isFromUser && !isToUser && !isAdmin) {
      return NextResponse.json(
        { error: 'Only the sender, receiver, or a group admin can mark this settlement as completed' },
        { status: 403 }
      );
    }

    settlement.status = 'completed';
    settlement.settledAt = new Date();

    await settlement.save();

    const updatedSettlement = await Settlement.findById(settlementId)
      .populate('from', 'name email avatar')
      .populate('to', 'name email avatar');

    return NextResponse.json(updatedSettlement, { status: 200 });
  } catch (error) {
    console.error('Error updating settlement:', error);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
import mongoose, { Schema, model, models } from 'mongoose';

const SettlementSchema = new Schema(
  {
    groupId: {
      type: Schema.Types.ObjectId,
      ref: 'Group',
      required: true,
    },
    from: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    to: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    algorithmUsed: {
      type: String,
      enum: ['greedy', 'optimal'],
      required: true,
      default: 'greedy',
    },
    status: {
      type: String,
      enum: ['pending', 'completed'],
      required: true,
      default: 'pending',
    },
    settledAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: {
      createdAt: true,
      updatedAt: false,
    },
  },
);

export const settlements = models.settlements || model('settlements', SettlementSchema);

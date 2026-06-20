import mongoose, { Schema, model, models, Model, Document } from 'mongoose';

export interface ISettlement extends Document {
  groupId: mongoose.Types.ObjectId;
  from: mongoose.Types.ObjectId;
  to: mongoose.Types.ObjectId;
  amount: number;
  algorithmUsed: 'greedy' | 'optimal';
  status: 'pending' | 'completed';
  settledAt: Date | null;
  createdAt: Date;
}

const SettlementSchema = new Schema<ISettlement>(
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

const Settlement: Model<ISettlement> = models.Settlement || model<ISettlement>('Settlement', SettlementSchema);

export default Settlement;

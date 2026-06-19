import mongoose, { Schema, models, model, Model, Document } from 'mongoose';

export interface IMember {
  userId: mongoose.Types.ObjectId;
  role: 'admin' | 'member';
  joinedAt: Date;
}

export interface IGroup extends Document {
  name: string;
  description?: string;
  currency: string;
  members: IMember[];
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
}

const memberSchema = new Schema<IMember>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    role: {
      type: String,
      enum: ['admin', 'member'],
      default: 'member',
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const groupSchema = new Schema<IGroup>(
  {
    name: {
      type: String,
      required: [true, 'Please provide a group name'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    currency: {
      type: String,
      default: 'INR',
    },
    members: [memberSchema],
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: {
      createdAt: true,
      updatedAt: false,
    },
  }
);

const Group: Model<IGroup> = models.Group || model<IGroup>('Group', groupSchema);

export default Group;
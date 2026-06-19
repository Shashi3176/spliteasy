import mongoose, { Schema, models, model, Model, Document } from 'mongoose';

export interface ISplitItem {
  userId: mongoose.Types.ObjectId;
  amount: number;
  percentage?: number;
}

export interface IExpense extends Document {
  groupId: mongoose.Types.ObjectId;
  description: string;
  amount: number;
  paidBy: mongoose.Types.ObjectId;
  splitAmong: ISplitItem[];
  category: 'food' | 'travel' | 'accommodation' | 'other';
  date: Date;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
}

const splitItemSchema = new Schema<ISplitItem>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    percentage: {
      type: Number,
    },
  },
  { _id: false }
);

const expenseSchema = new Schema<IExpense>(
  {
    groupId: {
      type: Schema.Types.ObjectId,
      ref: 'Group',
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0.01,
    },
    paidBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    splitAmong: [splitItemSchema],
    category: {
      type: String,
      enum: ['food', 'travel', 'accommodation', 'other'],
      default: 'other',
    },
    date: {
      type: Date,
      required: true,
      default: Date.now,
    },
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

const Expense: Model<IExpense> = models.Expense || model<IExpense>('Expense', expenseSchema);

export default Expense;
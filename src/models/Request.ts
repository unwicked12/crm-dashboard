import mongoose, { Document, Schema } from 'mongoose';

interface IRequest extends Document {
  userId: string;
  type: 'holiday' | 'special';
  startDate: Date;
  endDate: Date;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
}

const requestSchema = new Schema<IRequest>({
  userId: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ['holiday', 'special'],
    required: true,
  },
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: function(this: IRequest) {
      return this.type === 'holiday';
    },
  },
  reason: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

requestSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

const Request = mongoose.model<IRequest>('Request', requestSchema);

export default Request;

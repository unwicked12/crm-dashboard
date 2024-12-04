import mongoose from 'mongoose';

const activitySchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    required: true,
    enum: ['checked-in', 'checked-out', 'lunch', 'break'],
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  duration: {
    type: Number,
    default: 0,
  },
});

const Activity = mongoose.model('Activity', activitySchema);

export default Activity;

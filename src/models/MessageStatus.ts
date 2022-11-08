import mongoose from 'mongoose'


const MessageStatusSchema = new mongoose.Schema({
  uId: {
    type: mongoose.Types.ObjectId,
    ref: 'users',
    required: true
  },
  mId: {
    type: mongoose.Types.ObjectId,
    ref: 'messages'
  },
  sent: {
    type: Number,
    required: true
  },
  delivered: {
    type: Number,
    default: 0
  },
  seen: {
    type: Number,
    default: 0
  },
  chId: {
    type: String,
    required: true
  }
}, { timestamps: true, versionKey: false })

export default mongoose.model('message_status', MessageStatusSchema)
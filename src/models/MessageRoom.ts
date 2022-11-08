import mongoose from 'mongoose'


const MessageRoomSchema = new mongoose.Schema({
  uId: {
    type: mongoose.Types.ObjectId,
    ref: 'users',
    required: true
  },
  to: {
    type: mongoose.Types.ObjectId
  },
  chId: {
    type: String,
    required: true
  },
  role: {
    type: Number,
    default: 1
  },
  type: {
    type: Number,
    required: true,
  },
}, { timestamps: true })


export default mongoose.model('message_rooms', MessageRoomSchema)
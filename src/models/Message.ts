import mongoose from 'mongoose'
import mongoosePaginate from 'mongoose-paginate'
import { IMessage } from '../interfaces/MessageInterface'

const MessageSchema = new mongoose.Schema({
  sId: {
    type: mongoose.Types.ObjectId,
    ref: "users"
  },
  rId: {
    type: mongoose.Types.ObjectId,
    ref: "users"
  },
  gId: {
    type: mongoose.Types.ObjectId,
    ref: "groups"
  },
  chId: {
    type: String,
    required: true
  },
  msg: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: Number,
    required: true
  },
  mTy: {
    type: Number,
    required: true
  }
}, { timestamps: true })

MessageSchema.plugin(mongoosePaginate);

export default mongoose.model<IMessage>('message', MessageSchema)
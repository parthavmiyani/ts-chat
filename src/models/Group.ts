import mongoose from 'mongoose'
const GroupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  owner: {
    type: mongoose.Types.ObjectId,
    ref: "users",
    required: true
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  profileUrl: {
    type: String
  },
  chId: {
    type: String,
    required: true
  }
}, { timestamps: true })

export default mongoose.model('groups', GroupSchema)
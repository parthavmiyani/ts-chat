import mongoose from 'mongoose'
const JobSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true
  },
  status: {
    type: String,
    required: true
  },
  creationTimeMs: { type: Number, min: 0, required: true },
  log: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  }
}, { timestamps: true })

export default mongoose.model('jobs', JobSchema)
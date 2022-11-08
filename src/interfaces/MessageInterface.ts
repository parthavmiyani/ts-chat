import mongoose from "mongoose"

export interface IMessage extends mongoose.Document {
  msg: string,
  sId: string,
  rId: string,
  gId: string,
  chId: string,
  type: number,
  mTy: number
}
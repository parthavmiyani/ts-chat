import mongoose from "mongoose"

export interface IUser {
  fname: string,
  lname: string,
  email: string,
  passowrd: string,
  isVerified: boolean
}

export interface IUserSession {
  _id: string,
  fname: string,
  lname: string,
  email: string
}



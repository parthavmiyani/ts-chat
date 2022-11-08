import jwt from 'jsonwebtoken'

interface IUser {
  _id: string;
  fname: string;
  lname: string;
  email: string;
}

class JWT {
  verify(token: string): any {
    return jwt.verify(token, `${process.env.JWT_SECRET}`)
  }

  sign(data: Object) {
    return jwt.sign(data, `${process.env.JWT_SECRET}`, { expiresIn: '7d' })
  }
  
}

export default new JWT()
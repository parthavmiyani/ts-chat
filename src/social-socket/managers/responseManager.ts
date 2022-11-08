import { Server, Socket } from "socket.io"
import CHAT_CONSTANTS from "../../constants/chat"
import { IUserSession } from "../../interfaces/UserInterface"
import MessageRoom from "../../models/MessageRoom"
import Websocket from './../../loaders/socket'


class ResponseManager {
  emitToSocket(socket: Socket & { user: IUserSession }, evt: string, data: any) {
    socket.emit("res", {
      evt,
      data
    })
  }

  emitErrorToSocket(socket: Socket & { user: IUserSession }, data: any) {
    socket.emit("res", {
      evt: "ERROR",
      data
    })
  }

  async emitToChannel(socket: Socket, evt: string, data: any, chId: string) {
    // Not Working for Multiple Ports (Might Fix Later)
    // socket.to(to.toString()).emit('res', {
    //   evt,
    //   data
    // })

    let uIds = await MessageRoom.distinct('uId', { chId })
    for (let i = 0; i < uIds.length; i++) {
      socket.to(uIds[i].toString()).emit('res', { evt, data })
    }
  }

  async emitToAllChannels(evt: string, data: any) {
    let io = Websocket.getWebSocketInstance()
    let uIds = await MessageRoom.distinct('uId', { to: data.user })
    uIds = uIds.map(x => x.toString())
    io.to(uIds).emit('res', { evt, data })
    // for (let i = 0; i < uIds.length; i++) {
    //   io.to(uIds[i].toString()).emit('res', { evt, data })
    // }
  }


  emitToUser(socket: Socket, evt: string, data: any, userId: string) {
    socket.to(userId.toString()).emit('res', { evt, data })
  }

  async sendMessage(socket: Socket & { user: IUserSession }, messageObj: any) {
    this.emitToChannel(socket, "message_received", messageObj, messageObj.chId)

    // Notification Pending
  }
}


export default new ResponseManager()
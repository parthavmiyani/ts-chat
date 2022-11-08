import { Socket, Server } from "socket.io";
import { IUserSession } from "../../interfaces/UserInterface";
import User from "../../models/User";
import Response from "./../managers/responseManager"
import Websocket from './../../loaders/socket'
import chat from "../../constants/chat";
import responseManager from "./../managers/responseManager";
import MessageRoom from "../../models/MessageRoom";

class UserHandler {
    async userList(socket: Socket & { user: IUserSession }, data: any) {
        try {
            let users = await User.find({ _id: { $ne: socket.user._id } }).lean()

            Response.emitToSocket(socket, "user_list_response", users)
        } catch (e) {
            Response.emitErrorToSocket(socket, e)
        }
    }

    async userProfile(socket: Socket & { user: IUserSession }, data: any) {
        try {
            Response.emitToSocket(socket, "user_profile_response", { data: socket.user })
        } catch (e) {
            Response.emitErrorToSocket(socket, e)
        }
    }

    updateOnlineOfflineStatus(user: string, status: number, cb: Function) {
        try {
            if (status === chat.USER_STATUS.ONLINE) {
                responseManager.emitToAllChannels("user_status", { user, status })
                User.updateOne({ _id: user }, { $set: { status } }).then(() => { })
            } else if (status === chat.USER_STATUS.OFFLINE) {
                responseManager.emitToAllChannels("user_status", { user, status })
                User.updateOne({ _id: user }, { $set: { status } }).then(() => { })
            } else {
                console.log("Invalid Status");
            }
            cb()
        } catch (e) {
            console.log(e);
            cb()
        }
    }
}


export default new UserHandler

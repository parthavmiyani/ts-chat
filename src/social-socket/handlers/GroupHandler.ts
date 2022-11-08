import { Socket } from "socket.io";
import { IUserSession } from "../../interfaces/UserInterface";
import MessageRoom from "../../models/MessageRoom";
import helpers from "../../utils/helpers";
import CHATCONSTANTS from "../../constants/chat";
import Websocket from './../../loaders/socket'
import Group from "../../models/Group";
import responseManager from "../managers/responseManager";


class GroupHandler {
    async createGroup(socket: Socket & { user: IUserSession }, data: any) {
        try {
            let { name, description, profileUrl, subscribers } = data
            let groupObj = new Group({
                name,
                description,
                profileUrl,
                chId: helpers.generateUUID(),
                owner: socket.user._id
            })
            groupObj = await groupObj.save()
            await this.createGroupChannel(socket, groupObj._id, groupObj.chId, subscribers)
            responseManager.emitToSocket(socket, "group_created", groupObj)
            responseManager.emitToChannel(socket, "group_added", groupObj, groupObj.chId)
        } catch (error) {
            console.log(error);
            responseManager.emitErrorToSocket(socket, error)
            return;
        }
    }

    private async createGroupChannel(socket: Socket & { user: IUserSession }, groupId: string, chId: string, userArr: any) {


        userArr = userArr.map((user: any) => ({
            uId: user,
            to: groupId,
            chId,
            type: CHATCONSTANTS.CHAT_TYPE.GROUP,
            role: CHATCONSTANTS.USER_ROLE.USER
        }))

        userArr.push({
            uId: socket.user._id,
            to: groupId,
            chId,
            type: CHATCONSTANTS.CHAT_TYPE.GROUP,
            role: CHATCONSTANTS.USER_ROLE.ADMIN
        })
        await MessageRoom.insertMany(userArr)
        // Not Working for Multiple Ports (Might Fix Later)
        // socket.join(chId)
        // userArr.forEach(async(user:any) => {
        //     let sockets = await Websocket.getSocketsByUserId(user)
        //     sockets.forEach((socket:any) => {
        //         socket.join(chId)
        //     })
        // })
        return chId
    }

    async addKickMemberGroup(socket: Socket & { user: IUserSession }, data: any) {
        try {
            let { gId, uId, flag } = data

            let groupObj = await Group.findOne({ _id: gId })
            if (!groupObj) return responseManager.emitToSocket(socket, "create_group_res", "Group Not Found!")

            let isAdmin = await MessageRoom.exists({ to: gId, uId: socket.user._id, role: CHATCONSTANTS.USER_ROLE.ADMIN })
            if (!isAdmin) return responseManager.emitToSocket(socket, "create_group_res", "Not Admin.")

            let subObj = await MessageRoom.findOne({ to: gId, uId })
            if (subObj && flag) return responseManager.emitToSocket(socket, "create_group_res", "Already Added in Group.")


            if (subObj && flag === false) {
                await subObj.remove()
                return responseManager.emitToSocket(socket, "create_group_res", "Member Removed.")
            }

            if (!subObj && flag) {
                subObj = new MessageRoom({
                    to: groupObj._id,
                    uId,
                    chId: groupObj.chId,
                    type: CHATCONSTANTS.CHAT_TYPE.GROUP,
                    role: CHATCONSTANTS.USER_ROLE.USER
                })
                subObj = await subObj.save()
                responseManager.emitToUser(socket, "group_added", groupObj, uId)
                responseManager.emitToSocket(socket, "create_group_res", "Member Added.")
                return;
            }

            responseManager.emitToSocket(socket, "create_group_res", "Flag Not Found!")
        } catch (error) {
            console.log(error);
            responseManager.emitErrorToSocket(socket, error)
            return;
        }
    }
    async GroupInfo(socket: Socket & { user: IUserSession }, data: any) {
        try {
            let { gId } = data

            let groupObj = await Group.findOne({ _id: gId }, { owner: 0, updatedAt: 0 , __v: 0 }).lean()

            if (!groupObj) return responseManager.emitToSocket(socket, "group_info_res", "Group Not Found!")

            let groupSubscribers = await MessageRoom.find({ to: gId, type: CHATCONSTANTS.CHAT_TYPE.GROUP }, { uId: 1, role: 1 }).populate({ path: "uId", select: "fname lname profileUrl" }).lean()
            groupObj.subscribers = groupSubscribers

            responseManager.emitToSocket(socket, "group_info_res", groupObj)
        } catch (error) {
            console.log(error);
            responseManager.emitErrorToSocket(socket, error)
            return;
        }
    }
    async deleteGroup(socket: Socket & { user: IUserSession }, data: any) {
        try {
            let { gId } = data

            let groupObj = await Group.findOne({ _id: gId })
            if (!groupObj) return responseManager.emitToSocket(socket, "delete_group_res", "Group Not Found!")

            let isAdmin = await MessageRoom.exists({ to: gId, uId: socket.user._id, role: CHATCONSTANTS.USER_ROLE.ADMIN })
            if (!isAdmin) return responseManager.emitToSocket(socket, "delete_group_res", "Not Admin.")

            responseManager.emitToSocket(socket, "delete_group_res", "Group Deleted.")
            responseManager.emitToChannel(socket, "group_deleted", groupObj, groupObj.chId)
            await groupObj.remove()
            await MessageRoom.deleteMany({ to: gId })
            return;
        } catch (error) {
            console.log(error);
            responseManager.emitErrorToSocket(socket, error)
            return;
        }
    }
}


export default new GroupHandler

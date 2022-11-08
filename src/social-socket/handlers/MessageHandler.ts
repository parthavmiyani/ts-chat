import { Socket, Server } from "socket.io";
import Message from "../../models/Message";
import mongoose from "mongoose";
import { IUserSession } from './../../interfaces/UserInterface'
import MessageRoom from "../../models/MessageRoom";
import responseManager from "../managers/responseManager";
import CHATCONSTANTS from "../../constants/chat";
import Websocket from './../../loaders/socket'
import helpers from "../../utils/helpers";
import { looseObj } from "../../interfaces/Common";
import MessageStatus from "../../models/MessageStatus";


class MessageHandler {
    async getChatList(socket: Socket & { user: IUserSession }, data: any) {
        try {
            let chatArr = await MessageRoom.aggregate([
                { $match: { uId: new mongoose.Types.ObjectId(socket.user._id) } },
                { $lookup: { from: "users", localField: "to", foreignField: "_id", as: "userData" } },
                { $lookup: { from: "groups", localField: "to", foreignField: "_id", as: "groupData" } },
                {
                    $project: {
                        chId: 1,
                        type: 1,
                        to: 1,
                        data: { $arrayElemAt: [{ $concatArrays: ["$userData", "$groupData"] }, 0] }
                    }
                },
                {
                    $project: {
                        Title: { $cond: [{ $eq: ["$type", 1] }, { $concat: ["$data.fname", " ", "$data.lname"] }, "$data.name"] },
                        profileUrl: "$data.profileUrl",
                        createdAt: "$data.createdAt",
                        status: "$data.status",
                        to: 1,
                        chId: 1,
                        type: 1,
                    }
                }
            ])

            let chIds = chatArr.map(x => x.chId)

            let message = await Message.aggregate([
                { $match: { chId: { $in: chIds } } },
                { $sort: { createdAt: -1 } },
                {
                    $group: {
                        _id: "$chId",
                        data: { $first: "$_id" }
                    }
                },
                {
                    $group: {
                        _id: null,
                        data: { $push: "$data" }
                    }
                }
            ])

            let chatList = await Message.find({ _id: { $in: message[0].data } }).sort({ createdAt: -1 }).populate(CHATCONSTANTS.chatPopulate).lean()

            chatArr = chatArr.map(message => {
                message.data = chatList.find(x => x._id == message.data)
                message.lastMsg = chatList.find(x => x.chId === message.chId)
                message.createdAt = message.lastMsg ? message.lastMsg.createdAt : message.createdAt
                return message
            })

            chatArr = chatArr.sort((a, b) => {
                return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            })

            responseManager.emitToSocket(socket, "get_chat_list:response", chatArr)
            return;
        } catch (error) {
            console.log(error);
            responseManager.emitErrorToSocket(socket, error)
            return;
        }
    }

    async getChatMessageList(socket: Socket & { user: IUserSession }, data: any) {
        try {
            let { page, to } = data
            let chId = await MessageRoom.distinct('chId', { uId: socket.user._id, to })
            if (!chId.length) return responseManager.emitToSocket(socket, "get_chat_message_list:res", "Channel Not Found!")

            let query = { chId: chId[0] }

            const options = {
                sort: { createdAt: -1 },
                select: '-__v',
                populate: CHATCONSTANTS.chatPopulate,
                page,
                lean: true,
                limit: 10
            };

            let messageObj = await Message.paginate(query, options)

            let chIds = messageObj.docs.map(x => x.chId)
            let messageStatusObj = await MessageStatus.find({ chId: { $in: chIds }, to }).lean()


            let statusHash : looseObj = {}
            for (let i = 0; i < messageStatusObj.length; i++) {
                statusHash[messageStatusObj[i].mId] = (messageStatusObj[i].seen ? 2 : (messageStatusObj[i].delivered ? 1 : 0))
                
            }

            for (let j = 0; j < messageObj.docs.length; j++) {
                (messageObj.docs[j] as any).messageStatus = statusHash[messageObj.docs[j]._id]
            }

            return responseManager.emitToSocket(socket, "get_chat_message_list:res", messageObj)
        } catch (error) {
            console.log(error);
            responseManager.emitErrorToSocket(socket, error)
            return;
        }
    }

    async sendMessage(socket: Socket & { user: IUserSession }, data: any): Promise<void> {
        try {
            let { msg, to, mTy, type } = data.messageObj

            let channelObj = await MessageRoom.findOne({ uId: socket.user._id, to, type }).lean()

            if (!channelObj && data.new === true && type === CHATCONSTANTS.CHAT_TYPE.P2P) {
                channelObj = await this.createP2pChannel(socket, data.messageObj)
            } else if (!channelObj) {
                responseManager.emitToSocket(socket, 'sendMessage:response', { message: "Channel Does not Exists!" })
                return;
            }

            let messageObj = {
                sId: socket.user._id,
                rId: type === CHATCONSTANTS.CHAT_TYPE.P2P ? to : undefined,
                gId: type === CHATCONSTANTS.CHAT_TYPE.GROUP ? to : undefined,
                chId: channelObj.chId,
                msg,
                type,
                mTy
            }

            let message = await new Message(messageObj).save()
            messageObj = await Message.findById(message._id).populate(CHATCONSTANTS.chatPopulate).lean()
            await this.addMessageStatusById(messageObj, socket.user._id)
            responseManager.emitToSocket(socket, "message_received", messageObj)
            responseManager.sendMessage(socket, messageObj)
            return;
        } catch (error) {
            console.log(error);
            responseManager.emitErrorToSocket(socket, error)
            return;
        }


    }

    private async createP2pChannel(socket: Socket & { user: IUserSession }, messageObj: any) {

        let chId = helpers.generateUUID()
        let channelObj = await MessageRoom.insertMany([
            {
                uId: socket.user._id,
                to: messageObj.to,
                chId,
                type: CHATCONSTANTS.CHAT_TYPE.P2P,
            },
            {
                uId: messageObj.to,
                to: socket.user._id,
                chId,
                type: CHATCONSTANTS.CHAT_TYPE.P2P,
            }
        ])
        // Not Working for Multiple Ports (Might Fix Later)
        // socket.join(chId)
        // let sockets = await Websocket.getSocketsByUserId(messageObj.to)
        // sockets.forEach((socket:any) => {
        //     socket.join(chId)
        // })
        return channelObj[0]
    }

    private async addMessageStatusById(messageObj: any, userId: string) {
        let uIds = await MessageRoom.distinct("uId", { uId: { $ne: userId }, chId: messageObj.chId })
        let sent = Date.now()
        uIds = uIds.map(user => ({
            sent, uId: user, mId: messageObj._id , chId: messageObj.chId
        }))
        await MessageStatus.insertMany(uIds)
    }

    async acknowledgeMessage(socket: Socket & { user: IUserSession }, data: any) {
        try {
            let { mId, status } = data
            let mStatusObj = await MessageStatus.findOne({ uId: socket.user._id, mId }).select("createdAt chId").lean()
            if (!mStatusObj) return responseManager.emitToSocket(socket, "acknowledge_message:response", "Message Not Found!")


            mStatusObj.acknowledsffsdged = status

            if (status === CHATCONSTANTS.MESSAGE_STATUS.DELIVERED) {
                await MessageStatus.updateMany({ uId: socket.user._id, chId: mStatusObj.chId, createdAt: { $lte: mStatusObj.createdAt } , delivered: 0 }, { $set: { delivered: Date.now() } })
            } else if (status === CHATCONSTANTS.MESSAGE_STATUS.SEEN) {
                await Promise.all([
                    MessageStatus.updateMany({ uId: socket.user._id, chId: mStatusObj.chId, createdAt: { $lte: mStatusObj.createdAt } , delivered: 0 }, { $set: { delivered: Date.now() } }),
                    MessageStatus.updateMany({ uId: socket.user._id, chId: mStatusObj.chId, createdAt: { $lte: mStatusObj.createdAt } , seen: 0 }, { $set: { seen: Date.now() } })
                ])
            } else {
                return responseManager.emitToSocket(socket, "acknowledge_message:response", "Invalid Status!")
            }
            responseManager.emitToChannel(socket, "acknowledge_message:response" , { mId, status , chId: mStatusObj.chId } , mStatusObj.chId)

        } catch (error) {
            console.log(error);
            responseManager.emitErrorToSocket(socket, error)
            return;
        }
    }
    async getMessageStatusById(socket: Socket & { user: IUserSession }, data: any) {
        try {
            let { mId } = data
            let mStatusObj = await MessageStatus.findOne({ uId: socket.user._id, mId })
            if (!mStatusObj) return responseManager.emitToSocket(socket, "message_status:response", "Message Not Found!")
            responseManager.emitToSocket(socket, "message_status:response", mStatusObj)

        } catch (error) {
            console.log(error);
            responseManager.emitErrorToSocket(socket, error)
            return;
        }
    }
}

export default new MessageHandler

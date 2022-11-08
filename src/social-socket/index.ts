
import { Socket } from 'socket.io';
import chat from '../constants/chat';
import { IUserSession } from '../interfaces/UserInterface';
import GroupHandler from './handlers/GroupHandler';
import MessageHandler from './handlers/MessageHandler';
import UserHandler from './handlers/UserHandler'

function handlers(socket: Socket & { user: IUserSession }) {
  UserHandler.updateOnlineOfflineStatus(socket.user._id, chat.USER_STATUS.ONLINE , () => {
    console.log("Status update TRUE");
  })
  console.log("Connected", socket.id);

  socket.on("req", (payload) => {
    if (!payload || !payload.evt || !payload.data) {
      console.log(payload);
      socket.emit("res", "Invalid Payload")
      return
    }

    let { evt, data } = payload


    switch (evt) {

      /** User Events */
      case "user_list":
        UserHandler.userList(socket, data)
        break;
      case "user_profile":
        UserHandler.userProfile(socket, data)
        break;


      /** Message Events */
      case "get_chat_list":
        MessageHandler.getChatList(socket, data)
        break;
      case "get_chat_message_list":
        MessageHandler.getChatMessageList(socket, data)
        break;
      case "send_message":
        MessageHandler.sendMessage(socket, data)
        break;
      case "acknowledge_message":
        MessageHandler.acknowledgeMessage(socket, data)
        break;
      case "message_status":
        MessageHandler.getMessageStatusById(socket, data)
        break;

      /** Group Events */
      case "create_group":
        GroupHandler.createGroup(socket, data)
        break;
      case "group_info":
        GroupHandler.GroupInfo(socket, data)
        break;
      case "add_kick_memeber":
        GroupHandler.addKickMemberGroup(socket, data)
        break;
      case "delete_group":
        GroupHandler.deleteGroup(socket, data)
        break;



      default:
        socket.emit("res", "Invalid Payload")
        break;
    }
  })

  socket.on('join_room', (room) => {
    socket.join(room)
  })

  socket.on("disconnect", async () => {
    UserHandler.updateOnlineOfflineStatus(socket.user._id, chat.USER_STATUS.OFFLINE , () => {
      console.log("Status update False");
    })
    console.log("User Disconnected");
  })
}




export default handlers

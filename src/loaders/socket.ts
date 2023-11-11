import { Server } from "socket.io";
import MessageRoom from "../models/MessageRoom";
import Handlers from "../social-socket";
import jwt from "../utils/jwt";
import { createAdapter } from "@socket.io/redis-adapter";
import { createClient } from "redis";

class Websocket {
  private static io: any;

  initailizeServer(httpServer: any) {
    // const pubClient = createClient({ url: process.env.REDIS_URI });
    // const subClient = pubClient.duplicate()

    // Promise.all([
    //   pubClient.connect(),
    //   subClient.connect()
    // ]).then(() => {
    //   Websocket.io = new Server(httpServer, {
    //     adapter: createAdapter(pubClient, subClient),
    //     transports: ['websocket'],
    //     pingInterval: 75000,
    //     pingTimeout: 60000
    //   });
    //   this.initializeMiddleware()
    //   this.initializeHandlers()
    // })

    Websocket.io = new Server(httpServer, {
      transports: ["websocket"],
      pingInterval: 75000,
      pingTimeout: 60000,
    });
    this.initializeMiddleware();
    this.initializeHandlers();
  }

  getWebSocketInstance() {
    return Websocket.io;
  }

  async getSocketsByUserId(userId: string) {
    let sockets = await Websocket.io.in(userId).fetchSockets();
    return sockets;
  }

  private initializeMiddleware() {
    Websocket.io.use(async (socket: any, next: any) => {
      try {
        socket.user = jwt.verify(socket.handshake.auth.token);

        // Not Working in Multiple Ports (LMight Fix ater)
        let chIds = await MessageRoom.distinct("chId", {
          uId: socket.user._id,
        });
        chIds.map((chId) => socket.join(chId));
        console.log(socket.rooms);

        socket.join(socket.user._id);

        next();
      } catch (error) {
        next(new Error("Access Denied!"));
      }
    });
  }
  private initializeHandlers() {
    Websocket.io.on("connection", Handlers);
  }
}

export default new Websocket();

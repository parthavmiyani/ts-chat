import { Server } from "socket.io";

declare global {
  var IO: Server;
}
export = global
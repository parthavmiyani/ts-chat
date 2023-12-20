import "dotenv/config";
import app from "./loaders/express";
import * as http from "http";
import { connectToDatabase } from "./loaders/mongoose";
import SocketIO from "./loaders/socket";

const server = http.createServer(app);

connectToDatabase();
SocketIO.initailizeServer(server);

let PORT = process.env.PORT || 3000;
console.log(PORT);

server.listen(PORT, () => {
  console.log("Server Is Running on PORT", PORT);
});

process.on("message", (msg) => {
  if (msg == "shutdown") {
    console.log("Closing all connections...");
    setTimeout(() => {
      console.log("Finished closing connections");
      process.exit(0);
    }, 1500);
  }
});

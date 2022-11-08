import express from "express";
import Routes from "./../routes";
import cors from "cors";

class App {
  public app: express.Application;
  constructor() {
    this.app = express();
    this.config();
  }

  private config(): void {
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: false }));
    this.app.use(cors({
      exposedHeaders: 'x-auth-token'
    }));
    this.app.use('/api', Routes);
  }

}
export default new App().app;
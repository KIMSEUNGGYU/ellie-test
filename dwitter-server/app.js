import express from "express";
import "express-async-errors";
import cors from "cors";
import morgan from "morgan";
import helmet from "helmet";
import tweetsRouter from "./router/tweets.js";
import authRouter from "./router/auth.js";
import { config } from "./config.js";
import { initSocket, getSocketIO } from "./connection/socket.js";
import { sequelize } from "./db/database.js";
import { TweetController } from "./controller/tweet.js";
import * as tweetRepository from "./data/tweet.js";

const corsOption = {
  origin: config.cors.allowedOrigin,
  optionsSuccessStatus: 200,
};

export async function startServer(port) {
  const app = express();
  app.use(express.json());
  app.use(helmet());
  app.use(cors(corsOption));
  app.use(morgan("tiny"));

  app.use(
    "/tweets",
    tweetsRouter(new TweetController(tweetRepository, getSocketIO))
  );
  app.use("/auth", authRouter);

  app.use((req, res, next) => {
    res.sendStatus(404);
  });

  app.use((error, req, res, next) => {
    console.error(error);
    res.sendStatus(500);
  });

  await sequelize.sync();

  console.log("Server is started....");
  // startServer 인자로 넘겨온 port 로 설정,
  // 만약 port 값이 없다면 app.listen 이 가능한 포트를 찾아서 알아서 실행시켜줌 (이런 기능으로 테스트 수행)
  const server = app.listen(port);
  initSocket(server);
  return server;
}

export async function stopServer(server) {
  return new Promise((resolve, reject) => {
    server.close(async () => {
      try {
        await sequelize.close();
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  });
}

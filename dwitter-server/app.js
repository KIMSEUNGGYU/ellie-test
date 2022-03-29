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

// 서버 시작하면 app 을 등록(app.use 등)하고 sequelize 싱크 한 후 서버 실행
// startServer 에서 정상적으로 시작하면 시작된 server 를 반환하고
// 에러가 발생하면 해당 에러(promise)를 반환하는 형태로 만듦

// 즉, start 는 필요한 것을 설정하고 DB를 초기한 후에 서버를 시작 후 서버를 리턴
// 즉, app 실행하면 index에서 자동 실행하고, 테스트 시 server 를 켰다가 껐다가 할 수 있음
export async function startServer() {
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

  // sequelize 에서 문제가 생기면 에러가 반환 됨
  await sequelize.sync();

  console.log("Server is started....");
  const server = app.listen(config.port);
  initSocket(server);
  return server;
}

// stop 은 제공된 서버를 close 하고, DB도 close 하고 다 성공하면 Promise.resolve 하고 실패하면 reject 함.
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

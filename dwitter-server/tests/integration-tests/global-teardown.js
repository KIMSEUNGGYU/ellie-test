import mysql from "mysql2/promise";
import dotenv from "dotenv";
import path from "path";
import { URL } from "url";

const __dirname = new URL(".", import.meta.url).pathname;
dotenv.config({ path: path.resolve(__dirname, "../../.env.test") });

// teardown 메서드(이름 무조건 일치해야함)에 원하고자 하는 기능 추가
// mysql2 로 한 이유 - sequelize 로 하지 못하는 이유
/*
sequelize.drop 사용 못함
왜냐하면 global 하게 설정된 것은 application 과 독립적으로 수행되기 때문에 sequelize 내용들이 공유되지 않음
=> 즉, global 하게 존재하는 파일은 application 의 정보를 모르기 때문에 application 의존하는 코드를 작성하면 동작하지 않음


export default async function teardown() {
    return new Promise(async (resolve) => {
        await sequelize.drop();
        reslove()
    })
}
*/

export default async function teardown() {
  return new Promise(async (resolve) => {
    const connection = await mysql.createConnection({
      host: process.env["DB_HOST"],
      user: process.env["DB_USER"],
      database: process.env["DB_DATABASE"],
      password: process.env["DB_PASSWORD"],
    });

    try {
      await connection.execute("DROP TABLE tweets, users");
    } catch (err) {
      console.log("Something went wrong when cleaning the DB", err);
    } finally {
      connection.end();
    }

    resolve();
  });
}

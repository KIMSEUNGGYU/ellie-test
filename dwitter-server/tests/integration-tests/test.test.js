// 테스트 전! 서버 시작 및 데이터베이스 초기화! 설정!
// 테스트 후! 데이터 베이스 깨끗하게 청소해 놓기!

import axios from "axios";
import faker from "faker";

import { startServer, stopServer } from "../../app.js";
import { sequelize } from "../../db/database.js";

describe("Auth APIs", () => {
  let server;
  let request;
  beforeAll(async () => {
    server = await startServer();
    request = axios.create({
      baseURL: "http://localhost:8080",
      validateStatus: null,
      // validateStatus null 로 설정 이유는 axios 는 200은 정상, 그 외 300, 400대는 에러를 처리함
      // 하지만 테스트 할 때는 200 뿐만 아니라 300, 400 모두 의도한 것이기 때문에 error 로 처리하지 않기 위함
    });
  });

  afterAll(async () => {
    await sequelize.drop(); // sequelize 가 만든 테이블을 다 삭제함
    await stopServer(server);
  });

  // afterAll, beforeAll 인 경우, each 로 안하는 이유, each로 하면 정말 독립적인 환경에서 돌아가는 것과 같음
  // 하지만 모든 테스트 각각 마다 서버시작, db 싱크, db 지우기, 서버 끄기 와 같은 기능을 매 테스트마다 하면 성능적으로 비효율
  // all 로 auth 와 같은 특정 테스트가 시작할 때 끝날 때 동작하도록 하고, 대신!! 테스트 작성할 때 개별적으로 테스트되므로 명심해서 테스트 코드를 작성해야 함

  describe("POST to /auth/signup", () => {
    it("returns 201 and authorization token when user details are valid", async () => {
      const user = makeValidUserDetails();

      const res = await request.post("/auth/signup", user);

      expect(res.status).toBe(201);
      expect(res.data.token.length).toBeGreaterThan(0);
    });

    it("returns 409 when username has already been taken", async () => {
      const user = makeValidUserDetails();
      const firstSignup = await request.post("/auth/signup", user);
      expect(firstSignup.status).toBe(201);

      const res = await request.post("/auth/signup", user);

      expect(res.status).toBe(409);
      expect(res.data.message).toBe(`${user.username} already exists`);
    });

    // router.post('/signup', validateSignup, authController.signup);
    // 여기까지 보면 authController.signup 의 기능은 테스트했지만, validateSignup 부분은 아직 테스트 하지 않음
    // 해당 부분 테스트 validate
    // jest 에서 변수는 $ 표시 사용
    test.each([
      { missingFiledName: "name", expectedMessage: "name is missing" },
      {
        missingFiledName: "username",
        expectedMessage: "username should be at least 5 characters",
      },
      { missingFiledName: "email", expectedMessage: "invalid email" },
      {
        missingFiledName: "password",
        expectedMessage: "password should be at least 5 characters",
      },
    ])(
      `returns 400 when $missingFiledName filed is missing`,
      async ({ missingFiledName, expectedMessage }) => {
        const user = makeValidUserDetails();
        delete user[missingFiledName];

        const res = await request.post("/auth/signup", user);

        expect(res.status).toBe(400);
        expect(res.data.message).toBe(expectedMessage);
      }
    );

    it("returns 400 when password is too short", async () => {
      const user = {
        ...makeValidUserDetails(),
        password: "123",
      };

      const res = await request.post("/auth/signup", user);

      expect(res.status).toBe(400);
      expect(res.data.message).toBe("password should be at least 5 characters");
    });
  });
});

function makeValidUserDetails() {
  const fakeUser = faker.helpers.userCard();
  return {
    name: fakeUser.name,
    username: fakeUser.username,
    email: fakeUser.email,
    password: faker.internet.password(10, true),
  };
}

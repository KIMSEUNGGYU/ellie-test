import httpMocks from "node-mocks-http";

import faker from "faker";

import { isAuth } from "../auth.js";

// 단위 테스트는 다른 모듈의 의존하면 안됨
// 데이터베이스, 파일 읽기, 네트워크 등 느린 것에 대한 의존성을 가지면 안됨

import jwt from "jsonwebtoken";
import * as userRepository from "../../data/auth.js";
// userRepository 는 데이터를 읽어 오기 때문에 로직이 거기에 의존하면 안됨
// jsonwebtoken 도 토큰을 만들 때 에도 시간이 오래 걸림,
// => 단위 테스트는 외부에 의존하는 것을 테스트 하는 것이 아닌
// 느린 데이터베이스에 의존하는 것이 아닌, 다 mocking 해서 사용

jest.mock("jsonwebtoken");
jest.mock("../../data/auth.js");

describe("Auth Middleware", () => {
  // context - 실패
  it("returns 401 for the request without Authorization header", async () => {
    const request = httpMocks.createRequest({
      method: "GET",
      url: "/tweets",
    });
    const response = httpMocks.createResponse();
    const next = jest.fn();

    await isAuth(request, response, next);

    expect(response.statusCode).toBe(401);
    expect(response._getJSONData().message).toBe("Authentication Error");
    expect(next).not.toBeCalled();
  });

  it("returns 401 for the request with unsupported Authorization header", async () => {
    const request = httpMocks.createRequest({
      method: "GET",
      url: "/tweets",
      headers: { Authorization: "Basic" },
    });
    const response = httpMocks.createResponse();
    const next = jest.fn();

    await isAuth(request, response, next);

    expect(response.statusCode).toBe(401);
    expect(response._getJSONData().message).toBe("Authentication Error");
    expect(next).not.toBeCalled();
  });

  it("returns 401 for the request with invalid JWT", async () => {
    const token = faker.random.alphaNumeric(128);
    const request = httpMocks.createRequest({
      method: "GET",
      url: "/tweets",
      headers: { Authorization: `Bearer ${token}` },
    });
    const response = httpMocks.createResponse();
    const next = jest.fn();
    jwt.verify = jest.fn((token, secret, callback) => {
      callback(new Error("bad token"), undefined);
    });

    await isAuth(request, response, next);

    expect(response.statusCode).toBe(401);
    expect(response._getJSONData().message).toBe("Authentication Error");
    expect(next).not.toBeCalled();
  });

  it("returns 401 when connot find a user by id from the JWT", async () => {
    const token = faker.random.alphaNumeric(128);
    const userId = faker.random.alphaNumeric(32);
    const request = httpMocks.createRequest({
      method: "GET",
      url: "/tweets",
      headers: { Authorization: `Bearer ${token}` },
    });
    const response = httpMocks.createResponse();
    const next = jest.fn();
    // ✨🔥 jwt 및, userRepository mocking 해서 사용
    jwt.verify = jest.fn((token, secret, callback) => {
      callback(undefined, { id: userId });
    });
    userRepository.findById = jest.fn((id) => Promise.resolve(undefined));

    await isAuth(request, response, next);

    expect(response.statusCode).toBe(401);
    expect(response._getJSONData().message).toBe("Authentication Error");
    expect(next).not.toBeCalled();
  });

  // context - 성공
  it("passes a request with valid Authorization header with token", async () => {
    const token = faker.random.alphaNumeric(128);
    const userId = faker.random.alphaNumeric(32);
    const request = httpMocks.createRequest({
      method: "GET",
      url: "/tweets",
      headers: { Authorization: `Bearer ${token}` },
    });
    const response = httpMocks.createResponse();
    const next = jest.fn();
    // ✨🔥 jwt 및, userRepository mocking 해서 사용
    jwt.verify = jest.fn((token, secret, callback) => {
      callback(undefined, { id: userId });
    });
    userRepository.findById = jest.fn((id) => Promise.resolve({ id }));

    await isAuth(request, response, next);

    expect(request).toMatchObject({ userId, token });
    expect(next).toHaveBeenCalledTimes(1);
  });
});

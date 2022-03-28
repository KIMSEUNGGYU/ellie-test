import httpMocks from "node-mocks-http";
import { isAuth } from "../auth.js";

describe("Auth Middleware", () => {
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
});

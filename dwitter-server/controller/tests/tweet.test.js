import faker from "faker";
import { TweetController } from "../tweet.js";

import httpMocks from "node-mocks-http";

describe("TweetController", () => {
  let tweetController;
  let tweetsRepository;
  let mockedSocket;

  // 하나의 테스트가 다른 테스트에 영향을 주지 않도록 만들어야함
  beforeEach(() => {
    // 다른 프로그래밍 언어는 stub 으로 만들 수 밖에 없음
    // JS 는 모든 것이 Object 베이스 이기 때문에 좀 더 유연하게 만들 수 있음
    // => 즉, 모듈 전체를 mock 할 필요 없이, 디펜던시를 주입하도록 리팩토링 했기 때문에
    // 전체 클래스를 stub 으로 만드는 것이 아닌,  JS 만의 유연한 방법으로 사용

    // tweetRepository 는 mock 은 아닌데 비어있음 (빈 객체)
    // tweetRepository 모듈에는 다양한 함수들이 export 로 구성되어 있음.
    // 아래와 같은 형태로 구성되어 있음, test할 때도 tweetRepository 를 그런 형태인 {} 로 구현
    // {
    //     getAll: () => { ... },
    //     getAllByUsername: () => {}
    // }

    tweetsRepository = {};
    mockedSocket = { emit: jest.fn() };
    tweetController = new TweetController(tweetsRepository, () => mockedSocket);
  });

  describe("getTweets", () => {
    it("returns all tweets when username is not provided", async () => {
      const request = httpMocks.createRequest();
      const response = httpMocks.createResponse();
      const allTweets = [
        { text: faker.random.words(3) },
        { text: faker.random.words(3) },
      ];
      tweetsRepository.getAll = () => allTweets;

      await tweetController.getTweets(request, response);

      expect(response.statusCode).toBe(200);
      expect(response._getJSONData()).toEqual(allTweets);
    });

    it("returns tweets for the given user when username is provided", async () => {
      const username = faker.internet.userName();
      const request = httpMocks.createRequest({
        query: { username },
      });
      const response = httpMocks.createResponse();
      const userTweets = [{ text: faker.random.words(3) }];
      // tweetsRepository.getAllByUsername = () => userTweets;
      tweetsRepository.getAllByUsername = jest.fn(() => userTweets);

      await tweetController.getTweets(request, response);

      expect(response.statusCode).toBe(200);
      expect(response._getJSONData()).toEqual(userTweets);
      expect(tweetsRepository.getAllByUsername).toBeCalledTimes(1);
      expect(tweetsRepository.getAllByUsername).toHaveBeenCalledWith(username);
    });
  });
});

// tweet 컨트롤러 안에서 개별적인 모듈을 사용 하는 것이 아닌
// 필요한 디펜던시를 받아와서 받아온 디펜던시를 내부적으로 사용하는 클래스로 만들어서 리팩토링

export class TweetController {
  // 필요한 기능을 외부로 부터 받음
  constructor(tweetRepository, getSocket) {
    this.tweets = tweetRepository;
    this.getSocket = getSocket;
  }

  // 화살표 함수는 한 이유는 this를 TweetController 를 보게 하기 위해
  getTweets = async (req, res, next) => {
    const username = req.query.username;
    const data = await (username
      ? this.tweets.getAllByUsername(username)
      : this.tweets.getAll());
    res.status(200).json(data);
  };

  getTweet = async (req, res, next) => {
    const id = req.params.id;
    const tweet = await this.tweets.getById(id);
    if (tweet) {
      res.status(200).json(tweet);
    } else {
      res.status(404).json({ message: `Tweet id(${id}) not found` });
    }
  };

  createTweet = async (req, res, next) => {
    const { text } = req.body;
    const tweet = await this.tweets.create(text, req.userId);
    res.status(201).json(tweet);
    this.getSocket().emit("tweets", tweet);
  };

  updateTweet = async (req, res, next) => {
    const id = req.params.id;
    const text = req.body.text;
    const tweet = await this.tweets.getById(id);
    if (!tweet) {
      return res.status(404).json({ message: `Tweet not found: ${id}` });
    }
    if (tweet.userId !== req.userId) {
      return res.sendStatus(403);
    }
    const updated = await this.tweets.update(id, text);
    res.status(200).json(updated);
  };

  deleteTweet = async (req, res, next) => {
    const id = req.params.id;
    const tweet = await this.tweets.getById(id);
    if (!tweet) {
      return res.status(404).json({ message: `Tweet not found: ${id}` });
    }
    if (tweet.userId !== req.userId) {
      return res.sendStatus(403);
    }
    await this.tweets.remove(id);
    res.sendStatus(204);
  };
}

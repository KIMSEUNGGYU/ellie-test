# 서버

## 실행 방법

- 도커로 mysql 서버 생성

```sh
docker run --name dwitter-mysql -e MYSQL_ROOT_PASSWORD="dwitter-password" -d -p 3306:3306 mysql
```

- 서버 패키지 설치 및 수행

```sh
npm i && npm start
```

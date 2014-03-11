Web Application Framework for Node.js
### Server Start Options ###
-p port
-c cache
-s single

기본 사용은 node app.js 하면 멀티 프로세스가 실행됨.

디버깅 할때는 아래 처럼 사용하면 됩니다.
node app.js -p 8080 -c false -s true
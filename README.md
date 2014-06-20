Web Application Framework for Node.js


# express, socket.io redis Backbone.js 를 활용한 웹프레임워크 입니다.
간단하게웹서버 포트를 열고,경우에 따라서 클러스터로 기동하고, 
또 Redis 를 통한 세션 공유, 서버와 application 의 분리가 주 목적입니다.

#application
 - controllers --> 사용자가 임의의 컨트롤을 추가하여 웹 라우팅 혹은 소켓 통신을 연결 할 수 있습니다.
 - public
 - routers
 - views 
 - 


Express, Socket.io, Backbone.JS
### Server Start Options ###
-p port    // 사용할 포트 

-s single  // 기본값이 true

node app.js


node app.js -p 8080  -s false // 클러스터로 기동


from node:10

workdir /app
copy . .
run yarn install && yarn compile

cmd yarn server

expose 9500

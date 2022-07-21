FROM node:17

#This is a working diretory setup
WORKDIR /src/app

COPY package*.json ./

RUN npm install
RUN apt-get -y update && apt-get -y upgrade && apt-get install -y ffmpeg

COPY . .

EXPOSE 3000

CMD ["npm", "start"]
FROM gliderlabs/alpine:3.3
MAINTAINER douglascon@gmail.com

WORKDIR /app
ADD package.json .

# If you have native dependencies, you'll need extra tools
#RUN apk add --no-cache curl make gcc g++ binutils-gold python linux-headers paxctl libgcc libstdc++
#RUN apk add curl make gcc g++ binutils-gold python linux-headers paxctl libgcc libstdc++
RUN     apk update && apk --update add build-base nodejs
RUN     apk add python


# If you need npm, don't use a base tag
RUN npm install

ADD . .

EXPOSE 3100
CMD ["node", "index.js"]

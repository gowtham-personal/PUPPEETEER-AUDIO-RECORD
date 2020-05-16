# FROM node:10-alpine
# RUN mkdir -p /home/node/service
# WORKDIR /home/node/service
# COPY package.json /home/node/service
# COPY package*.json ./

# USER node

# RUN npm install

# COPY --chown=node:node . .

# EXPOSE 8080

# CMD [ "node", "app.js" ]
FROM node:slim
#RUN /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install.sh)"
#RUN brew install ffmpeg
RUN apt-get update \
    && apt-get install -y wget gnupg \
    && wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
    && sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' \
    && apt-get update \
    && apt-get install -y ffmpeg \
    && apt-get install -y psmisc \
    && apt-get install -y google-chrome-unstable fonts-ipafont-gothic fonts-wqy-zenhei fonts-thai-tlwg fonts-kacst fonts-freefont-ttf \
      --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*
RUN apt-get install libasound2 alsa-utils alsa-oss
RUN mkdir -p /home/node/service
WORKDIR /home/node/service
COPY package.json /home/node/service
RUN npm install
RUN npm install -g puppeteer --unsafe-perm=true
COPY . /home/node/service
# EXPOSE 3000
CMD ["google-chrome-unstable"]
CMD [ "node", "index.js" ]


FROM node:22.3-slim as ui-builder

RUN mkdir /usr/src/app
ENV PATH /usr/src/app/node_modules/.bin:$PATH

COPY package.json /usr/src/app/package.json

WORKDIR /usr/src/app

RUN npm install

COPY . /usr/src/app

RUN npm run build && \
    mkdir /tmp/app && \
    cp -rp /usr/src/app/dist /tmp/app && \
    rm -fr /usr/src/app

FROM nginx

COPY ./docker/nginx.conf /etc/nginx/nginx.conf
COPY  --from=ui-builder /tmp/app/dist /usr/share/nginx/html
EXPOSE 80

# Copy the env.js file into the html build folder so the env vars are exposed to the UI
COPY ./public/* /usr/share/nginx/html

CMD ["nginx", "-g", "daemon off;"]

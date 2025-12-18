FROM node:25-slim AS ui-builder

RUN mkdir /usr/src/app
ENV PATH=/usr/src/app/node_modules/.bin:$PATH

COPY package.json /usr/src/app/package.json

WORKDIR /usr/src/app

RUN npm install

COPY . /usr/src/app

RUN npm run build && \
    mkdir /tmp/app && \
    cp -rp /usr/src/app/dist /tmp/app && \
    rm -fr /usr/src/app

FROM nginx

# Create a non-root user and group
RUN addgroup --system wis2box-ui && adduser --system --ingroup wis2box-ui wis2box-ui

COPY ./docker/nginx.conf /etc/nginx/nginx.conf
COPY --from=ui-builder /tmp/app/dist /usr/share/nginx/html
EXPOSE 80

# After copying in the base env.js file, use entrypoint.sh to override the values
COPY ./docker/entrypoint.sh /docker-entrypoint.d/entrypoint.sh
RUN chmod +x /docker-entrypoint.d/entrypoint.sh

# Change ownership of files to the non-root user
RUN chown -R wis2box-ui:wis2box-ui /usr/share/nginx/html /docker-entrypoint.d

# Switch to the non-root user
USER wis2box-ui

CMD ["nginx", "-g", "daemon off;"]

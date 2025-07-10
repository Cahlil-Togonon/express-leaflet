FROM node:16

WORKDIR /express-leaflet
COPY . .

RUN npm install

EXPOSE 3000

CMD ["npm", "start"]
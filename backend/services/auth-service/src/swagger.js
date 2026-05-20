import swaggerJsdoc from "swagger-jsdoc";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "EPFMS Auth Service",
      version: "1.0.0",
    },
    servers: [{ url: "http://localhost:3001" }],
  },
  apis: ["./src/controllers/*.js", "./src/server.js"],
};

export const swaggerSpec = swaggerJsdoc(options);

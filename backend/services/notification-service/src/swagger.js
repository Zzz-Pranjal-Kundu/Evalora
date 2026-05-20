import swaggerJsdoc from "swagger-jsdoc";

export const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: "3.0.0",
    info: { title: "EPFMS Notification Service", version: "1.0.0" },
    servers: [{ url: "http://localhost:3003" }],
  },
  apis: ["./src/controllers/*.js"],
});

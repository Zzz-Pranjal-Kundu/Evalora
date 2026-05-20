import swaggerJsdoc from "swagger-jsdoc";

export const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: "3.0.0",
    info: { title: "EPFMS User Service", version: "1.0.0" },
    servers: [{ url: "http://localhost:3002" }],
  },
  apis: ["./src/controllers/*.js"],
});

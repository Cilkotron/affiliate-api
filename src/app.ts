import "dotenv/config";
import express from "express";
import cors from "cors";
import routes from "./routes";
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger';

const app = express();

app.use(cors({
  origin: ['http://localhost:5173', 'https://localhost:5173', 'http://localhost:3000', 'https://localhost:3000'],
  credentials: true,
}));
app.use(express.json());
app.use("/api", routes);

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  swaggerOptions: {
    validatorUrl: null,
    tryItOutEnabled: true,
  },
}));

export default app;
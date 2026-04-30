import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

const rawOrigins = process.env["CORS_ORIGINS"];
const corsOptions: cors.CorsOptions = rawOrigins
  ? {
      origin: rawOrigins.split(",").map((o) => o.trim()),
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
    }
  : {
      origin: true,
    };

if (!rawOrigins) {
  logger.warn(
    "CORS_ORIGINS env var not set — allowing all origins. " +
      "Set CORS_ORIGINS=https://your-app.com,https://your-mobile-api.com in production.",
  );
}

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

export default app;

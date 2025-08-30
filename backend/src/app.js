import express from "express";
import cors from "cors";
import morgan from "morgan";
import authRouter from "./routes/auth.js";
import lotteriesRouter from "./routes/lotteries.js";
import dashboardRouter from "./routes/dashboard.js";
import activitiesRouter from "./routes/activities.js";
import systemStatusRouter from "./routes/systemStatus.js";
import agentsRouter from "./routes/agents.js";
import staffRouter from "./routes/staff.js";
import winnersRouter from "./routes/winners.js";
import { errorHandler } from './middleware/errorHandler.js';

const app = express();


const allowedOrigins = [
  'http://localhost:5173',
  'https://kiya-lottery.vercel.app',
  /\.vercel\.app$/  // ✅ allows preview branches too
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like Postman) or in allowed list
    if (!origin || allowedOrigins.some(o => typeof o === 'string' ? o === origin : o.test(origin))) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.options('*any', cors()) //express to handle OPTIONS requests globally

app.use(morgan("combined"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.get('/test', (req, res) => {
    res.send('Backend is working');
  });


// Routes
app.use("/api/auth", authRouter);
app.use("/api/lotteries", lotteriesRouter);
app.use("/api/dashboard", dashboardRouter);
app.use("/api/activities", activitiesRouter);
app.use("/api/system-status", systemStatusRouter);
app.use("/api/agents", agentsRouter);
app.use("/api/staff", staffRouter);
app.use("/api/winners", winnersRouter);

app.use(errorHandler);

export default app;
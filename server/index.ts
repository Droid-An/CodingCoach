import express, { Request, Response } from "express";
import cors from "cors";
import axios from "axios";
import "dotenv/config";

const app = express();
app.use(cors());
app.use(express.json());

app.post("/api/chat", async (req: Request, res: Response) => {
  try {
    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      req.body,
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    res.json(response.data);
  } catch (err: any) {
    console.log(err.message);
    res.status(500).json({ error: err.message });
  }
});

app.listen(3001, () => {
  console.log("API running on http://localhost:3001");
});

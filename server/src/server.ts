import "dotenv/config";
import { createServer } from "http";
import app from "./app.js";
import { initSocket } from "./socket.js";
import pool from "./config/db.js";

const PORT = process.env.PORT || 5000;

const httpServer = createServer(app);
initSocket(httpServer);
app.get("/", (req, res) => {
  res.json({
    message: "Warka API is running successfully 🚀"
  });
});

app.get("/api/test-db", async(req,res)=>{
  try {
    const result = await pool.query("SELECT NOW()");
    res.json(result.rows);
  } catch(err){
    res.status(500).json(err);
  }
});

httpServer.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

import "dotenv/config";
import { createServer } from "http";
import app from "./app.js";
import { initSocket } from "./socket.js";

const PORT = process.env.PORT || 5000;

const httpServer = createServer(app);
initSocket(httpServer);
app.get("/", (req, res) => {
  res.json({
    message: "Warka API is running successfully 🚀"
  });
});

httpServer.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

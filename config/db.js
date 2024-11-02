// db2Connection.js
import mongoose from "mongoose";

const DB2_URI = process.env.MONGODB_DB2_URI;

const db2Connection = mongoose.createConnection(DB2_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

db2Connection.on("connected", () => {
  console.log("Connected to DB2");
});

db2Connection.on("error", (err) => {
  console.error("Failed to connect to DB2", err);
});

export default db2Connection; // Export the connection instance

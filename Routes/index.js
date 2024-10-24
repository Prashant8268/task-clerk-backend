const express = require("express");
const { Worker } = require("worker_threads");
const router = express.Router();

router.get("/", (req, res) => {
  res.send("Welcome to the homepage");
});

router.post("/sendOtp", (req, res) => {
  const { otp, companyEmail } = req.body;
  // Make sure to destructure otp and companyEmail
  console.log(otp, companyEmail, "herer");

  const emailWorker = new Worker("./config/nodemailer.js", {
    workerData: { email: companyEmail, otp },
  });

  // Handle worker messages
  emailWorker.on("message", (message) => {
    if (message.success) {
      res.json({ message: "OTP sent successfully to company email." });
    } else {
      res
        .status(500)
        .json({ error: "Failed to send OTP", details: message.error });
    }
  });

  // Handle worker errors
  emailWorker.on("error", (error) => {
    console.error("Error from worker:", error);
    res.status(500).json({ error: "Worker encountered an error." });
  });

  // Handle worker exit
  emailWorker.on("exit", (code) => {
    if (code !== 0) {
      console.error(`Worker stopped with exit code ${code}`);
    }
  });
});

router.post("/reset-link", (req, res) => {
  const { email, resetToken } = req.body;
  console.log("reset link");
  const emailWorker = new Worker("./config/nodemailer2.js", {
    workerData: { email, resetToken },
  });
  // Handle worker messages
  emailWorker.on("message", (message) => {
    if (message.success) {
      res.json({ message: "Reset Link sent successfully to  email." });
    } else {
      res
        .status(500)
        .json({ error: "Failed to send reset Link", details: message.error });
    }
  });

  // Handle worker errors
  emailWorker.on("error", (error) => {
    console.error("Error from worker:", error);
    res.status(500).json({ error: "Worker encountered an error." });
  });

  // Handle worker exit
  emailWorker.on("exit", (code) => {
    if (code !== 0) {
      console.error(`Worker stopped with exit code ${code}`);
    }
  });
});

module.exports = router;

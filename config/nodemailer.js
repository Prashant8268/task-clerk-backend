const { parentPort, workerData } = require("worker_threads");
const nodemailer = require("nodemailer");

async function sendOtpEmail({ email, otp }) {
  const transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    to: email,
    from: "no-reply@apedia.com",
    subject: "Your OTP for Email Verification",
    html: `
      <html>
        <body style="font-family: Arial, sans-serif; background-color: #f3f4f6; margin: 0; padding: 0;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);">
            <h2 style="color: #1f2937; text-align: center; font-size: 24px; font-weight: 600; margin-bottom: 20px;">Email Verification OTP</h2>
            <p style="color: #4b5563; font-size: 16px; margin-bottom: 20px;">Hi there,</p>
            <p style="color: #4b5563; font-size: 16px; margin-bottom: 20px;">Your OTP for email verification is:</p>
            <div style="text-align: center; margin: 30px 0;">
              <span style="background-color: #3b82f6; color: #ffffff; padding: 12px 24px; border-radius: 5px; font-size: 24px; font-weight: bold; display: inline-block;">
                ${otp}
              </span>
            </div>
            <p style="color: #4b5563; font-size: 16px; margin-bottom: 20px;">Please use this OTP within the next 10 minutes.</p>
            <hr style="border-top: 1px solid #e5e7eb; margin: 20px 0;">
            <p style="color: #9ca3af; font-size: 14px; text-align: center;">Regards,<br>Apedia</p>
          </div>
        </body>
      </html>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    parentPort.postMessage({ success: true });
  } catch (error) {
    console.error("Error sending OTP email:", error);
    parentPort.postMessage({ success: false, error: error.message });
  }
}

sendOtpEmail(workerData);

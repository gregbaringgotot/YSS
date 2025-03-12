const http = require("http");
const nodemailer = require("nodemailer");

// Your Gmail credentials (App Password required)
const EMAIL_USER = "grba.gotot.swu@phinmaed.com";
const EMAIL_PASS = "esif nnur zdgy zgqg"; // Replace with your actual App Password

// Ensure credentials exist
if (!EMAIL_USER || !EMAIL_PASS) {
  console.error("Missing EMAIL_USER or EMAIL_PASS");
  process.exit(1);
}

// Nodemailer transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: EMAIL_USER, // Gmail Account
    pass: EMAIL_PASS, // App Password
  },
});

// Create an HTTP server to handle requests
const server = http.createServer((req, res) => {
  // CORS Headers (Allow requests from frontend)
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Handle preflight OPTIONS request
  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method === "POST" && req.url === "/send") {
    let body = "";

    req.on("data", (chunk) => {
      body += chunk.toString();
    });

    req.on("end", async () => {
      const { name, phone, email, comment } = JSON.parse(body);

      if (!name || !email || !comment) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ message: "Name, Email, and Comment are required" }));
        return;
      }

      const mailOptions = {
        from: `"${name}" <${email}>`,
        to: EMAIL_USER,
        subject: `New Contact Form Submission Young Soul Seekers from ${name}`,
        text: `Young Soul Seekers\nName: ${name}\nPhone: ${phone || "N/A"}\nEmail: ${email}\nMessage: ${comment}`,
      };

      try {
        await transporter.sendMail(mailOptions);
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ message: "Email sent successfully!" }));
      } catch (error) {
        console.error("Error sending email:", error);
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ message: "Error sending email", error }));
      }
    });
  } else {
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("Not Found");
  }
});

// Start the server
const PORT = 5000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

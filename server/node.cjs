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

  // Contact form endpoint
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
  } 
  // NEW ENDPOINT: Send order details to customer email
  else if (req.method === "POST" && req.url === "/send-order-email") {
    let body = "";

    req.on("data", (chunk) => {
      body += chunk.toString();
    });

    req.on("end", async () => {
      try {
        const { orderId, customerEmail, customerName, items, subtotal, status, deliveryDate } = JSON.parse(body);

        if (!orderId || !customerEmail || !customerName || !items) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ message: "Missing required order information" }));
          return;
        }

        // Build the items HTML for the email
        let itemsHtml = '';
        items.forEach(item => {
          itemsHtml += `
            <tr>
              <td>${item.name}</td>
              <td>${item.size || 'N/A'}</td>
              <td>${item.quantity}</td>
              <td>₱${item.price.toFixed(2)}</td>
            </tr>
          `;
        });

        // Email to customer with their order details
        const mailOptions = {
          from: `"Young Soul Seekers" <${EMAIL_USER}>`,
          to: customerEmail, // Send to the customer's email
          subject: `Your Order Details #${orderId}`,
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <style>
                body {
                  font-family: Arial, sans-serif;
                  line-height: 1.6;
                  color: #333;
                  max-width: 600px;
                  margin: 0 auto;
                  padding: 20px;
                }
                .header {
                  text-align: center;
                  padding: 20px 0;
                  border-bottom: 2px solid #000;
                }
                .logo {
                  font-size: 24px;
                  font-weight: bold;
                  color: #000;
                }
                .order-confirmation {
                  background-color: #f7f7f7;
                  border-radius: 8px;
                  padding: 20px;
                  margin: 20px 0;
                }
                .greeting {
                  font-size: 18px;
                  margin-bottom: 15px;
                }
                .section-title {
                  font-size: 16px;
                  font-weight: bold;
                  margin-top: 25px;
                  margin-bottom: 10px;
                  border-bottom: 1px solid #ddd;
                  padding-bottom: 5px;
                }
                .order-details {
                  margin-bottom: 20px;
                }
                .order-details p {
                  margin: 5px 0;
                }
                table {
                  width: 100%;
                  border-collapse: collapse;
                  margin-top: 10px;
                }
                th {
                  background-color: #000;
                  color: #fff;
                  padding: 10px;
                  text-align: left;
                }
                td {
                  padding: 10px;
                  border-bottom: 1px solid #ddd;
                }
                .footer {
                  text-align: center;
                  margin-top: 30px;
                  padding-top: 20px;
                  border-top: 1px solid #ddd;
                  font-size: 12px;
                  color: #777;
                }
              </style>
            </head>
            <body>
              <div class="header">
                <div class="logo">Young Soul Seekers</div>
              </div>
              
              <div class="order-confirmation">
                <div class="greeting">Hello ${customerName},</div>
                <p>Thank you for your order with Young Soul Seekers. Your order has been received, and we're working on it right away.</p>
              </div>
              
              <div class="section-title">Order Summary</div>
              <div class="order-details">
                <p><strong>Order ID:</strong> #${orderId}</p>
                <p><strong>Status:</strong> <span style="background-color: #f0f0f0; padding: 3px 8px; border-radius: 4px;">${status}</span></p>
                <p><strong>Total Amount:</strong> ₱${subtotal.toFixed(2)}</p>
                ${deliveryDate ? `<p><strong>Estimated Delivery Date:</strong> ${new Date(deliveryDate).toLocaleDateString()}</p>` : ''}
              </div>
              
              <div class="section-title">Order Items</div>
              <table>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Size</th>
                    <th>Quantity</th>
                    <th>Price</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHtml}
                </tbody>
              </table>
              
              <div class="footer">
                <p>Thank you for shopping with Young Soul Seekers!</p>
                <p>If you have any questions about your order, please contact our customer service at youngsoulseekers.com</p>
                <p>© ${new Date().getFullYear()} Young Soul Seekers. All rights reserved.</p>
              </div>
            </body>
            </html>
          `
        };

        await transporter.sendMail(mailOptions);
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ message: "Order details email sent successfully!" }));
      } catch (error) {
        console.error("Error sending order email:", error);
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ message: "Error sending order email", error: error.message }));
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
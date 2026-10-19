import https from 'https';
import http from 'http';
import fs from 'fs';
import path from 'path';
import app from './app';

const PORT = process.env.PORT || 3000;
const HTTP_PORT = 3001; // Separate port for HTTP (for Swagger UI)

// Only use HTTPS in development (production should use reverse proxy or proper SSL)
if (process.env.NODE_ENV !== 'production') {
  const certPath = path.join(__dirname, '..', '.certs');
  const httpsOptions = {
    key: fs.readFileSync(path.join(certPath, 'key.pem')),
    cert: fs.readFileSync(path.join(certPath, 'cert.pem')),
  };

  // HTTPS server (for frontend)
  https.createServer(httpsOptions, app).listen(PORT, () => {
    console.log(`HTTPS Server running on port ${PORT}`);
  });

  // HTTP server (for Swagger UI - self-signed HTTPS doesn't work well with Swagger)
  http.createServer(app).listen(HTTP_PORT, () => {
    console.log(`HTTP Server running on port ${HTTP_PORT} (for Swagger UI)`);
  });
} else {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

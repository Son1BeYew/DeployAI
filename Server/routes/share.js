const express = require("express");
const History = require("../models/History");

const router = express.Router();

/**
 * @swagger
 * /share/{historyId}:
 *   get:
 *     summary: Get share page with Open Graph meta tags for social media
 *     tags: [Share]
 *     parameters:
 *       - in: path
 *         name: historyId
 *         required: true
 *         schema:
 *           type: string
 *         description: History ID of the generated image
 *     responses:
 *       200:
 *         description: HTML page with Open Graph meta tags
 *         content:
 *           text/html:
 *             schema:
 *               type: string
 *       404:
 *         description: Image not found
 *       500:
 *         description: Server error
 */
router.get("/:historyId", async (req, res) => {
  try {
    const { historyId } = req.params;

    const history = await History.findById(historyId);

    if (!history) {
      return res.status(404).send("Không tìm thấy ảnh");
    }

    const imageUrl = history.outputImagePath;
    const title = history.promptTitle || history.promptName || "Ảnh AI";
    const siteName = "EternaPicSHT Studio";
    const description = `Ảnh được tạo bởi ${siteName} - Tạo ảnh AI chuyên nghiệp`;

    // Use BACKEND_URL for public URL (ngrok/production), fallback to request host
    const baseUrl = process.env.BACKEND_URL || `${req.protocol}://${req.get('host')}`;
    const shareUrl = `${baseUrl}/share/${historyId}`;

    // Return HTML page with Open Graph meta tags
    res.send(`
    <!DOCTYPE html>
    <html lang="vi">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title} - ${siteName}</title>

      <!-- Open Graph Meta Tags -->
      <meta property="og:title" content="${title}" />
      <meta property="og:description" content="${description}" />
      <meta property="og:image" content="${imageUrl}" />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content="${siteName}" />
      <meta property="og:url" content="${shareUrl}" />

      <!-- Twitter Card Meta Tags -->
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content="${title}" />
      <meta name="twitter:description" content="${description}" />
      <meta name="twitter:image" content="${imageUrl}" />

      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          background: #ffffff;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          color: #000000;
          position: relative;
          overflow-x: hidden;
        }
        body::before {
          content: '';
          position: fixed;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: radial-gradient(circle at 20% 50%, rgba(255, 0, 0, 0.03) 0%, transparent 50%),
                      radial-gradient(circle at 80% 80%, rgba(0, 0, 0, 0.02) 0%, transparent 50%);
          animation: gradientShift 15s ease infinite;
          pointer-events: none;
        }
        @keyframes gradientShift {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          50% { transform: translate(-5%, -5%) rotate(5deg); }
        }
        .container {
          max-width: 900px;
          width: 100%;
          position: relative;
          z-index: 1;
        }
        .header {
          text-align: center;
          margin-bottom: 40px;
          animation: fadeInDown 0.8s ease;
        }
        @keyframes fadeInDown {
          from {
            opacity: 0;
            transform: translateY(-30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .logo {
          font-size: 32px;
          font-weight: 800;
          margin-bottom: 8px;
          color: #000000;
          letter-spacing: -0.5px;
        }
        .tagline {
          font-size: 14px;
          color: #666666;
          font-weight: 500;
        }
        .card {
          background: #ffffff;
          border-radius: 24px;
          padding: 32px;
          border: 2px solid #000000;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
          animation: fadeInUp 0.8s ease 0.2s both;
        }
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .image-wrapper {
          position: relative;
          margin-bottom: 28px;
          border-radius: 16px;
          overflow: hidden;
          background: #f5f5f5;
          border: 2px solid #000000;
        }
        .image-wrapper::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(255, 0, 0, 0.05);
          opacity: 0;
          transition: opacity 0.3s;
          pointer-events: none;
          z-index: 1;
        }
        .image-wrapper:hover::before {
          opacity: 1;
        }
        .shared-image {
          width: 100%;
          height: auto;
          display: block;
          border-radius: 16px;
          transition: transform 0.3s ease;
        }
        .image-wrapper:hover .shared-image {
          transform: scale(1.02);
        }
        .content {
          text-align: center;
        }
        .title {
          font-size: 24px;
          font-weight: 700;
          margin-bottom: 12px;
          color: #000000;
          line-height: 1.4;
        }
        .description {
          color: #666666;
          margin-bottom: 28px;
          font-size: 15px;
          line-height: 1.6;
        }
        .actions {
          display: flex;
          gap: 12px;
          justify-content: center;
          flex-wrap: wrap;
        }
        .btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 14px 32px;
          text-decoration: none;
          border-radius: 12px;
          font-weight: 600;
          font-size: 15px;
          transition: all 0.3s ease;
          border: none;
          cursor: pointer;
        }
        .btn-primary {
          background: #ff0000;
          color: #ffffff;
          box-shadow: 0 4px 15px rgba(255, 0, 0, 0.3);
          border: 2px solid #ff0000;
        }
        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 25px rgba(255, 0, 0, 0.5);
          background: #cc0000;
        }
        .btn-secondary {
          background: #ffffff;
          color: #000000;
          border: 2px solid #000000;
        }
        .btn-secondary:hover {
          background: #f5f5f5;
          border-color: #000000;
        }
        .stats {
          display: flex;
          justify-content: center;
          gap: 32px;
          margin-top: 24px;
          padding-top: 24px;
          border-top: 2px solid #000000;
        }
        .stat-item {
          text-align: center;
        }
        .stat-value {
          font-size: 20px;
          font-weight: 700;
          color: #ff0000;
          display: block;
        }
        .stat-label {
          font-size: 13px;
          color: #666666;
          margin-top: 4px;
        }
        @media (max-width: 640px) {
          .card {
            padding: 24px;
          }
          .logo {
            font-size: 28px;
          }
          .title {
            font-size: 20px;
          }
          .actions {
            flex-direction: column;
          }
          .btn {
            width: 100%;
            justify-content: center;
          }
          .stats {
            gap: 20px;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">${siteName}</div>
          <div class="tagline">Nền tảng tạo ảnh AI chuyên nghiệp</div>
        </div>
        
        <div class="card">
          <div class="image-wrapper">
            <img src="${imageUrl}" alt="${title}" class="shared-image" loading="lazy" />
          </div>
          
          <div class="content">
            <h1 class="title">${title}</h1>
            <p class="description">${description}</p>
            
            <div class="actions">
              <a href="/" class="btn btn-primary">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M12 5v14M5 12h14"/>
                </svg>
                Tạo ảnh AI của bạn
              </a>
              <button onclick="downloadImage()" class="btn btn-secondary">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>
                </svg>
                Tải xuống
              </button>
            </div>
            
            <div class="stats">
              <div class="stat-item">
                <span class="stat-value">AI</span>
                <span class="stat-label">Powered</span>
              </div>
              <div class="stat-item">
                <span class="stat-value">HD</span>
                <span class="stat-label">Quality</span>
              </div>
              <div class="stat-item">
                <span class="stat-value">Fast</span>
                <span class="stat-label">Generation</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <script>
        function downloadImage() {
          const link = document.createElement('a');
          link.href = '${imageUrl}';
          link.download = '${title.replace(/[^a-z0-9]/gi, '_')}.jpg';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
      </script>
    </body>
    </html>
    `);
  } catch (error) {
    console.error("Share page error:", error);
    res.status(500).send("Đã xảy ra lỗi");
  }
});

module.exports = router;


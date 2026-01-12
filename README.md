# EternalPic - AI Image Generation Platform

AI-powered image generation and editing platform using Google Gemini AI for creating high-quality images from text descriptions or editing existing images.

## Features

- **Text-to-Image Generation**: Create images from text prompts with multiple styles (Realistic, Anime, Cartoon, Painting)
- **360° Panoramic Images**: Generate 360° panoramic images (requires Pro/Max plan)
- **Image Editing**: Edit images with AI by describing desired changes
- **Background Removal**: Automatically remove image backgrounds
- **Face Swap**: Swap faces in images
- **Virtual Try-On**: Change outfits and hairstyles in images
- **Image Enhancement**: Improve image quality
- **Gallery Management**: Organize and manage generated images
- **Favorites & History**: Save favorites and view generation history
- **Trending Images**: Discover popular image trends

## Requirements

- Node.js >= 18.x
- MongoDB >= 6.x
- npm or yarn
- Google Gemini API Key and Replicate
- Firebase Storage account
- (Optional) Replicate API Token for advanced features
- (Optional) Remove.bg API Key for background removal

## Installation

### 1. Clone Repository

```bash
git clone https://github.com/Son1BeYew/eternal-pic-generator.git
cd eternal-pic-generator
```

### 2. Install Dependencies

**Frontend:**

```bash
cd client
npm install
```

**Backend:**

```bash
cd server
npm install
```

### 3. Setup Environment Variables

**Frontend (`client/.env.local`):**

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

**Backend (`server/.env`):**

```env
# Server
PORT=5000

# Database
MONGO_URI=mongodb://localhost:27017/eternalpic

# JWT
JWT_SECRET=your_jwt_secret_key

# Client URL
CLIENT_URL=http://localhost:3000

# AI Services
GEMINI_API_KEY=your_gemini_api_key
REPLICATE_API_TOKEN=your_replicate_api_token
REMOVE_BG_API_KEY=your_remove_bg_api_key

# OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
FACEBOOK_APP_ID=your_facebook_app_id
FACEBOOK_APP_SECRET=your_facebook_app_secret

# Firebase
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_CLIENT_EMAIL=your_firebase_client_email
FIREBASE_PRIVATE_KEY=your_firebase_private_key
FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket

# Or use JSON service account
FIREBASE_SERVICE_ACCOUNT={"type":"service_account",...}
```

### 4. Setup Firebase

1. Create a project on [Firebase Console](https://console.firebase.google.com/)
2. Create a Storage bucket
3. Download service account JSON or configure via environment variables
4. Place `firebase-service-account.json` in `server/config/` or use `FIREBASE_SERVICE_ACCOUNT` env variable

### 5. Setup MongoDB

1. Install MongoDB locally or use MongoDB Atlas
2. Update `MONGO_URI` in `server/.env`

## Configuration

### Environment Variables

| Variable                  | Required | Description                               |
| ------------------------- | -------- | ----------------------------------------- |
| `PORT`                    | Yes      | Backend server port (default: 5000)       |
| `MONGO_URI`               | Yes      | MongoDB connection string                 |
| `JWT_SECRET`              | Yes      | Secret key for JWT token signing          |
| `GEMINI_API_KEY`          | Yes      | Google Gemini AI API key                  |
| `FIREBASE_PROJECT_ID`     | Yes      | Firebase project ID                       |
| `FIREBASE_STORAGE_BUCKET` | Yes      | Firebase Storage bucket name              |
| `REPLICATE_API_TOKEN`     | No       | Replicate API token for advanced features |
| `REMOVE_BG_API_KEY`       | No       | Remove.bg API key for background removal  |
| `GOOGLE_CLIENT_ID`        | No       | Google OAuth client ID                    |
| `GOOGLE_CLIENT_SECRET`    | No       | Google OAuth client secret                |
| `FACEBOOK_APP_ID`         | No       | Facebook OAuth app ID                     |
| `FACEBOOK_APP_SECRET`     | No       | Facebook OAuth app secret                 |

### Example Configuration

**Frontend (`client/.env.local`):**

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

**Backend (`server/.env`):**

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/eternalpic
JWT_SECRET=your_super_secret_jwt_key_here
CLIENT_URL=http://localhost:3000
GEMINI_API_KEY=AIzaSy...
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_STORAGE_BUCKET=your-project.appspot.com
```

## Usage

### Development Mode

**Start Backend Server:**

```bash
cd server
npm run dev
```

Server runs at `http://localhost:5000`

**Start Frontend:**

```bash
cd client
npm run dev
```

Frontend runs at `http://localhost:3000`

### Production Build

**Build Frontend:**

```bash
cd client
npm run build
npm start
```

**Start Backend:**

```bash
cd server
npm start
```

## API Documentation

### Authentication

| Endpoint             | Method | Description                   |
| -------------------- | ------ | ----------------------------- |
| `/api/auth/register` | POST   | Register new account          |
| `/api/auth/login`    | POST   | Login with email/password     |
| `/api/auth/me`       | GET    | Get current user information  |
| `/api/auth/google`   | GET    | Google OAuth authentication   |
| `/api/auth/facebook` | GET    | Facebook OAuth authentication |

### Image Generation

**Generate Image from Text:**

```http
POST /api/images/generate
Authorization: Bearer <token>
Content-Type: application/json

{
  "prompt": "A beautiful sunset over mountains",
  "style": "realistic",
  "outputType": "normal"
}
```

**Generate 360° Image:**

```http
POST /api/images/generate
Authorization: Bearer <token>
Content-Type: application/json

{
  "prompt": "A panoramic view of a beach",
  "style": "realistic",
  "outputType": "360"
}
```

**Edit Image:**

```http
POST /api/images/edit
Authorization: Bearer <token>
Content-Type: application/json

{
  "baseImage": "data:image/png;base64,...",
  "baseImageUrl": "https://...",
  "originalPrompt": "Original description",
  "editPrompt": "Add more clouds in the sky"
}
```

### Other Endpoints

| Endpoint                   | Method | Description               |
| -------------------------- | ------ | ------------------------- |
| `/api/images/remove-bg`    | POST   | Remove image background   |
| `/api/enhance`             | POST   | Enhance image quality     |
| `/api/graduation`          | POST   | Generate graduation photo |
| `/api/images/favorites`    | GET    | Get favorite images       |
| `/api/images/:id/favorite` | POST   | Toggle favorite status    |

## Project Structure

```
eternal-pic-generator/
├── client/                 # Frontend (Next.js)
│   ├── app/
│   │   ├── dashboard/      # Dashboard pages
│   │   │   ├── create-scene/
│   │   │   ├── edit-image/
│   │   │   ├── gallery/
│   │   │   └── ...
│   │   ├── auth/           # Authentication pages
│   │   ├── pricing/        # Pricing page
│   │   └── components/     # React components
│   ├── lib/
│   │   └── api.ts          # API client
│   └── package.json
│
├── server/                 # Backend (Express)
│   ├── config/             # Configuration files
│   │   ├── db.js           # MongoDB connection
│   │   ├── firebase.js     # Firebase setup
│   │   └── passport.js     # Passport OAuth config
│   ├── controllers/        # Route controllers
│   │   ├── imageController.js
│   │   ├── authController.js
│   │   └── ...
│   ├── models/             # MongoDB models
│   │   ├── User.js
│   │   ├── Scene.js
│   │   └── ...
│   ├── routes/             # API routes
│   ├── middleware/         # Custom middleware
│   ├── utils/              # Utility functions
│   └── index.js            # Entry point
│
└── README.md
```

## Authentication Flow

1. User registers/logs in → Server creates JWT token
2. Token stored in localStorage (client-side)
3. Each API request includes token in header: `Authorization: Bearer <token>`
4. Server verifies token and authenticates user
5. Protected routes check authentication middleware

## Pricing Plans

### Free Plan

- Generate normal images
- Basic image editing
- Gallery and favorites
- Limited generation per day

### Pro Plan

- All Free features
- Generate 360° panoramic images
- Priority processing
- Higher generation limits
- Better support

### Max Plan

- All Pro features
- Unlimited generation
- API access
- Highest priority support
- Advanced features

## Development

### Build from Source

```bash
git clone https://github.com/Son1BeYew/eternal-pic-generator.git
cd eternal-pic-generator

# Install dependencies
cd client && npm install
cd ../server && npm install

# Start development servers
cd ../server && npm run dev
cd ../client && npm run dev
```

### Debug

**Backend:**

```bash
cd server
npm run dev
# Server runs with nodemon for auto-reload
```

**Frontend:**

```bash
cd client
npm run dev
# Next.js dev server with hot reload
```

## Troubleshooting

**"Database is not connected"**

- Check MongoDB is running: `mongod` or verify MongoDB Atlas connection
- Verify `MONGO_URI` in `.env` is correct
- Check MongoDB connection logs in server console

**"Firebase Storage not initialized"**

- Verify Firebase credentials in `.env` or `firebase-service-account.json`
- Check `FIREBASE_STORAGE_BUCKET` is set correctly
- Ensure Firebase Storage is enabled in Firebase Console

**"GEMINI_API_KEY is not configured"**

- Get API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
- Add to `server/.env` as `GEMINI_API_KEY=your_key`

**"Failed to generate image"**

- Check Gemini API quota/limits
- Verify API key is valid
- Check server logs for detailed error messages

**"CORS error"**

- Ensure `CLIENT_URL` in backend `.env` matches frontend URL
- Check `NEXT_PUBLIC_API_URL` in frontend `.env.local` matches backend URL
- Verify CORS middleware is configured correctly

**"Image upload failed"**

- Verify Firebase Storage bucket permissions
- Check Firebase service account has Storage Admin role
- Ensure file size is within limits (default: 50MB)

**"Authentication failed"**

- Verify JWT_SECRET is set in backend `.env`
- Check token expiration (default: 7 days)
- Clear localStorage and login again

## Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on how to contribute to this project.

## Security

We take security seriously. Please see [SECURITY.md](SECURITY.md) for information on reporting security vulnerabilities and security best practices.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Related

- [Google Gemini AI](https://ai.google.dev/)
- [Next.js Documentation](https://nextjs.org/docs)
- [MongoDB Documentation](https://docs.mongodb.com/)
- [Firebase Documentation](https://firebase.google.com/docs)

## Authors

- **Son1BeYew** - [GitHub](https://github.com/Son1BeYew)

## Acknowledgments

- Google Gemini AI for image generation capabilities
- Firebase for reliable cloud storage
- MongoDB for flexible database solution
- Next.js and React communities for excellent frameworks

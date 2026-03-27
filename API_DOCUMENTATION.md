# VideoStream API Documentation

## Overview

VideoStream is a comprehensive video streaming platform built with Node.js and Express.js. It provides multi-resolution video support, user authentication, subscription management, and advanced video processing capabilities.

## Features

- **Authentication & Authorization**: JWT-based authentication with role-based access control
- **Multi-Resolution Support**: Automatic transcoding to multiple resolutions (360p, 480p, 720p, 1080p)
- **User Management**: Complete user CRUD operations with profile management
- **Subscription Management**: Flexible subscription plans (Free, Premium, Enterprise)
- **Video Management**: Upload, process, and stream videos with HLS support
- **Security**: Comprehensive security headers, rate limiting, and input validation
- **API Documentation**: Swagger UI and Postman collection included

## Quick Start

### Installation

```bash
# Clone repository
git clone https://github.com/heayem/videoStream.git
cd videoStream

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Start server
npm start
```

### Environment Variables

```env
PORT=3000
NODE_ENV=development
JWT_SECRET=your_super_secret_jwt_key_change_in_production_12345
JWT_EXPIRE=7d
BCRYPT_ROUNDS=10
UPLOADS_DIR=./uploads
OUTPUT_DIR=./output
PUBLIC_DIR=./public
MAX_FILE_SIZE=500000000
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX_REQUESTS=100
```

## API Endpoints

### Authentication

#### Register
- **POST** `/api/auth/register`
- **Body**: `{ email, password, name }`
- **Response**: User profile with JWT token

#### Login
- **POST** `/api/auth/login`
- **Body**: `{ email, password }`
- **Response**: User profile with JWT token

#### Logout
- **POST** `/api/auth/logout`
- **Headers**: `Authorization: Bearer {token}`
- **Response**: Success message

#### Get Current User
- **GET** `/api/auth/me`
- **Headers**: `Authorization: Bearer {token}`
- **Response**: Current user profile

#### Change Password
- **POST** `/api/auth/change-password`
- **Headers**: `Authorization: Bearer {token}`
- **Body**: `{ oldPassword, newPassword }`
- **Response**: Updated user profile

#### Refresh Token
- **POST** `/api/auth/refresh`
- **Headers**: `Authorization: Bearer {token}`
- **Response**: New JWT token

### Videos

#### List Videos
- **GET** `/api/videos?page=1&limit=10`
- **Query**: `page`, `limit`, `status`
- **Response**: Array of videos with pagination

#### Get Video
- **GET** `/api/videos/:id`
- **Response**: Video details

#### Upload Video
- **POST** `/api/videos`
- **Headers**: `Authorization: Bearer {token}`
- **Body**: FormData with file, title, description, isPublic
- **Response**: Video record with processing status

#### Update Video
- **PATCH** `/api/videos/:id`
- **Headers**: `Authorization: Bearer {token}`
- **Body**: `{ title, description, isPublic }`
- **Response**: Updated video

#### Delete Video
- **DELETE** `/api/videos/:id`
- **Headers**: `Authorization: Bearer {token}`
- **Response**: Success message

#### Get Video Stream
- **GET** `/api/videos/:id/stream`
- **Response**: Stream information with HLS URL

#### Get Video Resolutions
- **GET** `/api/videos/:id/resolutions`
- **Response**: Available and recommended resolutions

#### Get Available Resolutions
- **GET** `/api/videos/resolutions/available`
- **Response**: All supported resolutions

#### Get User Videos
- **GET** `/api/videos/user/me`
- **Headers**: `Authorization: Bearer {token}`
- **Response**: User's videos

### Users

#### Get All Users (Admin)
- **GET** `/api/users`
- **Headers**: `Authorization: Bearer {token}` (Admin required)
- **Response**: Array of all users

#### Get User
- **GET** `/api/users/:id`
- **Headers**: `Authorization: Bearer {token}`
- **Response**: User profile

#### Update User
- **PATCH** `/api/users/:id`
- **Headers**: `Authorization: Bearer {token}`
- **Body**: `{ name, email }`
- **Response**: Updated user profile

#### Delete User (Admin)
- **DELETE** `/api/users/:id`
- **Headers**: `Authorization: Bearer {token}` (Admin required)
- **Response**: Success message

#### Get User Statistics
- **GET** `/api/users/:id/stats`
- **Headers**: `Authorization: Bearer {token}`
- **Response**: User statistics (videos, storage, etc.)

#### Deactivate User
- **POST** `/api/users/:id/deactivate`
- **Headers**: `Authorization: Bearer {token}`
- **Response**: Success message

#### Activate User (Admin)
- **POST** `/api/users/:id/activate`
- **Headers**: `Authorization: Bearer {token}` (Admin required)
- **Response**: User profile

### Subscriptions

#### Get Subscription Plans
- **GET** `/api/subscriptions/plans`
- **Response**: Available subscription plans with features

#### Get My Subscription
- **GET** `/api/subscriptions/me`
- **Headers**: `Authorization: Bearer {token}`
- **Response**: Current subscription details

#### Get Subscription Usage
- **GET** `/api/subscriptions/usage`
- **Headers**: `Authorization: Bearer {token}`
- **Response**: Usage statistics and limits

#### Upgrade Subscription
- **POST** `/api/subscriptions/upgrade`
- **Headers**: `Authorization: Bearer {token}`
- **Body**: `{ plan }`
- **Response**: Updated subscription

#### Downgrade Subscription
- **POST** `/api/subscriptions/downgrade`
- **Headers**: `Authorization: Bearer {token}`
- **Response**: Updated subscription

#### Cancel Subscription
- **POST** `/api/subscriptions/cancel`
- **Headers**: `Authorization: Bearer {token}`
- **Response**: Success message

#### Renew Subscription
- **POST** `/api/subscriptions/renew`
- **Headers**: `Authorization: Bearer {token}`
- **Response**: Updated subscription

#### Get All Subscriptions (Admin)
- **GET** `/api/subscriptions`
- **Headers**: `Authorization: Bearer {token}` (Admin required)
- **Response**: All user subscriptions

## Authentication

All protected endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Tokens expire after 7 days. Use the refresh endpoint to get a new token.

## Error Handling

All error responses follow this format:

```json
{
  "success": false,
  "message": "Error description",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}
```

## Rate Limiting

The API implements rate limiting to prevent abuse:

- **General endpoints**: 100 requests per 15 minutes
- **Authentication endpoints**: 5 requests per 15 minutes
- **Upload endpoints**: 10 uploads per hour

Rate limit information is included in response headers:
- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Requests remaining
- `X-RateLimit-Reset`: Reset timestamp

## Best Practices

### Security

1. **Store JWT tokens securely**: Use httpOnly cookies or secure storage
2. **Never expose sensitive data**: Don't log passwords or tokens
3. **Validate all inputs**: Use provided validation middleware
4. **Use HTTPS in production**: Enable strict transport security
5. **Rotate JWT secret regularly**: Update `JWT_SECRET` in production
6. **Implement CORS carefully**: Configure allowed origins

### Performance

1. **Implement pagination**: Always use page and limit parameters
2. **Cache responses**: Use appropriate cache headers
3. **Compress responses**: Enable gzip compression
4. **Optimize video uploads**: Validate file size before upload
5. **Use CDN for streaming**: Serve HLS streams from CDN in production

### API Usage

1. **Check subscription limits**: Verify user subscription before operations
2. **Handle async operations**: Video processing is asynchronous
3. **Implement retry logic**: Handle temporary failures gracefully
4. **Monitor rate limits**: Implement backoff strategies
5. **Use webhooks**: Implement webhooks for async events

### Database

1. **Use transactions**: Wrap related operations in transactions
2. **Index frequently queried fields**: Optimize database queries
3. **Archive old data**: Implement data retention policies
4. **Regular backups**: Schedule automated backups
5. **Monitor performance**: Track slow queries

## Video Processing

### Supported Resolutions

- **360p**: 640x360 @ 800kbps
- **480p**: 854x480 @ 1200kbps
- **720p**: 1280x720 @ 2500kbps
- **1080p**: 1920x1080 @ 5000kbps

### Processing Flow

1. Video uploaded to `/api/videos`
2. Server validates file and creates video record
3. Asynchronous processing begins:
   - Extract video metadata
   - Generate thumbnail
   - Transcode to multiple resolutions
   - Generate HLS master playlist
4. Video status updated to "ready"
5. Client notified via polling or webhooks

### Recommended Resolutions

The system automatically recommends resolutions based on source video height:
- Source ≥ 360p: Recommend 360p
- Source ≥ 480p: Recommend 480p
- Source ≥ 720p: Recommend 720p
- Source ≥ 1080p: Recommend 1080p

## Subscription Plans

### Free Plan
- Max 5 videos
- 1 GB storage
- 1 resolution
- 100 MB upload limit
- Community support

### Premium Plan
- Max 100 videos
- 100 GB storage
- 3 resolutions
- 2 GB upload limit
- Email support

### Enterprise Plan
- Unlimited videos
- Unlimited storage
- Unlimited resolutions
- Unlimited upload
- Priority support

## API Documentation

### Swagger UI
Access interactive API documentation at:
```
http://localhost:3000/api-docs
```

### Postman Collection
Import the Postman collection:
```
GET /api/postman-collection
```

## Testing

### Unit Tests
```bash
npm test
```

### Integration Tests
```bash
npm run test:integration
```

### Load Testing
```bash
npm run test:load
```

## Deployment

### Production Checklist

- [ ] Update `JWT_SECRET` with strong random value
- [ ] Set `NODE_ENV=production`
- [ ] Enable HTTPS/SSL
- [ ] Configure CORS origins
- [ ] Set up database (MongoDB/PostgreSQL)
- [ ] Configure CDN for video streaming
- [ ] Enable monitoring and logging
- [ ] Set up automated backups
- [ ] Configure email notifications
- [ ] Implement payment processing

### Docker Deployment

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

## Troubleshooting

### Video Processing Fails
- Check FFmpeg installation: `ffmpeg -version`
- Verify file permissions on upload directory
- Check available disk space
- Review error logs for details

### Authentication Issues
- Verify JWT_SECRET is set correctly
- Check token expiration
- Ensure Authorization header format is correct

### Rate Limiting Issues
- Check current rate limit status in response headers
- Implement exponential backoff
- Contact support for rate limit increase

## Support

For issues and questions:
- GitHub Issues: https://github.com/heayem/videoStream/issues
- Email: support@videostream.com
- Documentation: https://docs.videostream.com

## License

ISC

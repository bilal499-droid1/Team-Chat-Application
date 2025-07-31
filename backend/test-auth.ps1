# Test Authentication Endpoints

# Health check
curl http://localhost:5000/health

# Register a new user
curl -X POST http://localhost:5000/api/auth/register \
-H "Content-Type: application/json" \
-d '{
  "username": "testuser",
  "email": "test@example.com",
  "password": "Test123",
  "fullName": "Test User"
}'

# Login
curl -X POST http://localhost:5000/api/auth/login \
-H "Content-Type: application/json" \
-d '{
  "identifier": "test@example.com",
  "password": "Test123"
}'

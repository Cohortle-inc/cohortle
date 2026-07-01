#!/bin/bash

# Lesson Type Feature - API Test Script
# This script tests the lesson type endpoints after deployment

# Configuration
API_BASE_URL="https://api.cohortle.com"
TOKEN="YOUR_AUTH_TOKEN_HERE"
MODULE_ID="1"  # Change to a valid module ID

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "=========================================="
echo "Lesson Type Feature - API Test Script"
echo "=========================================="
echo ""

# Test 1: Create lesson with type "text"
echo -e "${YELLOW}Test 1: Create lesson with type 'text'${NC}"
RESPONSE=$(curl -s -X POST "${API_BASE_URL}/v1/api/modules/${MODULE_ID}/lessons" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Text Lesson",
    "type": "text",
    "description": "This is a text lesson",
    "order_number": 999
  }')

if echo "$RESPONSE" | grep -q '"error":false'; then
  echo -e "${GREEN}✓ PASS${NC} - Text lesson created"
  LESSON_ID=$(echo "$RESPONSE" | grep -o '"lesson_id":[0-9]*' | grep -o '[0-9]*')
  echo "  Lesson ID: $LESSON_ID"
else
  echo -e "${RED}✗ FAIL${NC} - Failed to create text lesson"
  echo "  Response: $RESPONSE"
fi
echo ""

# Test 2: Create lesson with type "quiz" and JSON description
echo -e "${YELLOW}Test 2: Create lesson with type 'quiz' and JSON description${NC}"
RESPONSE=$(curl -s -X POST "${API_BASE_URL}/v1/api/modules/${MODULE_ID}/lessons" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Quiz",
    "type": "quiz",
    "description": "{\"questions\":[{\"id\":\"q1\",\"question\":\"What is 2+2?\",\"options\":[{\"text\":\"3\",\"isCorrect\":false},{\"text\":\"4\",\"isCorrect\":true}]}]}",
    "order_number": 1000
  }')

if echo "$RESPONSE" | grep -q '"error":false'; then
  echo -e "${GREEN}✓ PASS${NC} - Quiz lesson created with JSON"
  QUIZ_ID=$(echo "$RESPONSE" | grep -o '"lesson_id":[0-9]*' | grep -o '[0-9]*')
  echo "  Quiz ID: $QUIZ_ID"
else
  echo -e "${RED}✗ FAIL${NC} - Failed to create quiz lesson"
  echo "  Response: $RESPONSE"
fi
echo ""

# Test 3: Create lesson without type (should default to "video")
echo -e "${YELLOW}Test 3: Create lesson without type (should default to 'video')${NC}"
RESPONSE=$(curl -s -X POST "${API_BASE_URL}/v1/api/modules/${MODULE_ID}/lessons" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Default Type",
    "description": "No type specified",
    "order_number": 1001
  }')

if echo "$RESPONSE" | grep -q '"error":false'; then
  echo -e "${GREEN}✓ PASS${NC} - Lesson created without type"
  DEFAULT_ID=$(echo "$RESPONSE" | grep -o '"lesson_id":[0-9]*' | grep -o '[0-9]*')
  echo "  Lesson ID: $DEFAULT_ID"
else
  echo -e "${RED}✗ FAIL${NC} - Failed to create lesson without type"
  echo "  Response: $RESPONSE"
fi
echo ""

# Test 4: Get lessons and verify type field is present
echo -e "${YELLOW}Test 4: Get lessons and verify type field is present${NC}"
RESPONSE=$(curl -s -X GET "${API_BASE_URL}/v1/api/modules/${MODULE_ID}/lessons" \
  -H "Authorization: Bearer ${TOKEN}")

if echo "$RESPONSE" | grep -q '"type"'; then
  echo -e "${GREEN}✓ PASS${NC} - Type field is present in response"
  
  # Check if default lesson has type "video"
  if [ ! -z "$DEFAULT_ID" ]; then
    LESSON_TYPE=$(echo "$RESPONSE" | grep -A 10 "\"id\":$DEFAULT_ID" | grep -o '"type":"[^"]*"' | head -1 | cut -d'"' -f4)
    if [ "$LESSON_TYPE" = "video" ]; then
      echo -e "${GREEN}✓ PASS${NC} - Default lesson has type 'video'"
    else
      echo -e "${RED}✗ FAIL${NC} - Default lesson has type '$LESSON_TYPE' (expected 'video')"
    fi
  fi
else
  echo -e "${RED}✗ FAIL${NC} - Type field is missing from response"
  echo "  Response: $RESPONSE"
fi
echo ""

# Test 5: Update lesson type
if [ ! -z "$LESSON_ID" ]; then
  echo -e "${YELLOW}Test 5: Update lesson type${NC}"
  RESPONSE=$(curl -s -X PUT "${API_BASE_URL}/v1/api/lessons/${LESSON_ID}" \
    -H "Authorization: Bearer ${TOKEN}" \
    -H "Content-Type: application/json" \
    -d '{
      "type": "pdf"
    }')

  if echo "$RESPONSE" | grep -q '"error":false'; then
    echo -e "${GREEN}✓ PASS${NC} - Lesson type updated"
  else
    echo -e "${RED}✗ FAIL${NC} - Failed to update lesson type"
    echo "  Response: $RESPONSE"
  fi
  echo ""
fi

# Test 6: Create video lesson with YouTube URL
echo -e "${YELLOW}Test 6: Create video lesson with YouTube URL${NC}"
RESPONSE=$(curl -s -X POST "${API_BASE_URL}/v1/api/modules/${MODULE_ID}/lessons" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "YouTube Video Test",
    "type": "video",
    "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    "order_number": 1002
  }')

if echo "$RESPONSE" | grep -q '"error":false'; then
  echo -e "${GREEN}✓ PASS${NC} - YouTube video lesson created"
  YOUTUBE_ID=$(echo "$RESPONSE" | grep -o '"lesson_id":[0-9]*' | grep -o '[0-9]*')
  echo "  Lesson ID: $YOUTUBE_ID"
else
  echo -e "${RED}✗ FAIL${NC} - Failed to create YouTube video lesson"
  echo "  Response: $RESPONSE"
fi
echo ""

# Cleanup: Delete test lessons
echo -e "${YELLOW}Cleanup: Deleting test lessons${NC}"
for ID in $LESSON_ID $QUIZ_ID $DEFAULT_ID $YOUTUBE_ID; do
  if [ ! -z "$ID" ]; then
    curl -s -X DELETE "${API_BASE_URL}/v1/api/lessons/${ID}" \
      -H "Authorization: Bearer ${TOKEN}" > /dev/null
    echo "  Deleted lesson ID: $ID"
  fi
done
echo ""

echo "=========================================="
echo "Test Complete"
echo "=========================================="
echo ""
echo "If all tests passed, the backend is ready!"
echo "If any tests failed, check the error messages above."
echo ""

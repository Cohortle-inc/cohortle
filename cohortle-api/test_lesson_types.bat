@echo off
REM Lesson Type Feature - API Test Script (Windows)
REM This script tests the lesson type endpoints after deployment

REM Configuration
set API_BASE_URL=https://api.cohortle.com
set TOKEN=YOUR_AUTH_TOKEN_HERE
set MODULE_ID=1

echo ==========================================
echo Lesson Type Feature - API Test Script
echo ==========================================
echo.

REM Test 1: Create lesson with type "text"
echo Test 1: Create lesson with type 'text'
curl -X POST "%API_BASE_URL%/v1/api/modules/%MODULE_ID%/lessons" ^
  -H "Authorization: Bearer %TOKEN%" ^
  -H "Content-Type: application/json" ^
  -d "{\"name\":\"Test Text Lesson\",\"type\":\"text\",\"description\":\"This is a text lesson\",\"order_number\":999}"
echo.
echo.

REM Test 2: Create lesson with type "quiz"
echo Test 2: Create lesson with type 'quiz' and JSON description
curl -X POST "%API_BASE_URL%/v1/api/modules/%MODULE_ID%/lessons" ^
  -H "Authorization: Bearer %TOKEN%" ^
  -H "Content-Type: application/json" ^
  -d "{\"name\":\"Test Quiz\",\"type\":\"quiz\",\"description\":\"{\\\"questions\\\":[{\\\"id\\\":\\\"q1\\\",\\\"question\\\":\\\"What is 2+2?\\\",\\\"options\\\":[{\\\"text\\\":\\\"4\\\",\\\"isCorrect\\\":true}]}]}\",\"order_number\":1000}"
echo.
echo.

REM Test 3: Create lesson without type
echo Test 3: Create lesson without type (should default to 'video')
curl -X POST "%API_BASE_URL%/v1/api/modules/%MODULE_ID%/lessons" ^
  -H "Authorization: Bearer %TOKEN%" ^
  -H "Content-Type: application/json" ^
  -d "{\"name\":\"Test Default Type\",\"description\":\"No type specified\",\"order_number\":1001}"
echo.
echo.

REM Test 4: Get lessons
echo Test 4: Get lessons and verify type field is present
curl -X GET "%API_BASE_URL%/v1/api/modules/%MODULE_ID%/lessons" ^
  -H "Authorization: Bearer %TOKEN%"
echo.
echo.

REM Test 5: Create video lesson with YouTube URL
echo Test 5: Create video lesson with YouTube URL
curl -X POST "%API_BASE_URL%/v1/api/modules/%MODULE_ID%/lessons" ^
  -H "Authorization: Bearer %TOKEN%" ^
  -H "Content-Type: application/json" ^
  -d "{\"name\":\"YouTube Video Test\",\"type\":\"video\",\"url\":\"https://www.youtube.com/watch?v=dQw4w9WgXcQ\",\"order_number\":1002}"
echo.
echo.

echo ==========================================
echo Test Complete
echo ==========================================
echo.
echo Review the responses above to verify all tests passed.
echo.
pause

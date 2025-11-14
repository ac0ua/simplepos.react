#!/bin/bash

# Test script for admin settings functionality
# This script tests the admin settings API endpoints

echo "Testing Admin Settings API..."
echo

# Test 1: Get current settings
echo "Test 1: Getting current admin settings"
curl -s -X GET http://localhost:5000/api/admin/settings | python3 -m json.tool
echo
echo

# Test 2: Update max instances setting
echo "Test 2: Updating max instances per email to 5"
curl -s -X POST http://localhost:5000/api/admin/settings \
  -H "Content-Type: application/json" \
  -d '{
    "setting_key": "max_instances_per_email",
    "setting_value": "5",
    "description": "Maximum number of store instances allowed per email address"
  }' | python3 -m json.tool
echo
echo

# Test 3: Get updated settings
echo "Test 3: Getting updated admin settings"
curl -s -X GET http://localhost:5000/api/admin/settings | python3 -m json.tool
echo
echo

# Test 4: Get admin statistics
echo "Test 4: Getting admin statistics"
curl -s -X GET http://localhost:5000/api/admin/stats | python3 -m json.tool
echo
echo

echo "All tests completed!"

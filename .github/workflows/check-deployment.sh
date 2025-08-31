#!/bin/bash

# Script to check if deployment is ready
URL=$1
MAX_ATTEMPTS=10
ATTEMPT=1

echo "Checking if $URL is ready..."

while [ $ATTEMPT -le $MAX_ATTEMPTS ]; do
    echo "Attempt $ATTEMPT of $MAX_ATTEMPTS..."
    
    if curl -f -s --max-time 10 "$URL" > /dev/null; then
        echo "✅ Deployment is ready!"
        exit 0
    else
        echo "⏳ Deployment not ready yet, waiting 15 seconds..."
        sleep 15
        ATTEMPT=$((ATTEMPT + 1))
    fi
done

echo "❌ Deployment check timed out after $MAX_ATTEMPTS attempts"
echo "Proceeding anyway - tests might fail if deployment isn't ready"
exit 0
#!/bin/bash

echo "================================"
echo "INSTANT NAVIGATION - DEPLOYMENT"
echo "================================"
echo ""
echo "This script will sync the instant navigation optimizations"
echo "to your Capacitor Android and iOS projects."
echo ""
read -p "Press Enter to continue..."

echo ""
echo "[1/3] Syncing Capacitor projects..."
npx cap sync
if [ $? -ne 0 ]; then
    echo "ERROR: Capacitor sync failed"
    exit 1
fi

echo ""
echo "[2/3] Copying web assets..."
npx cap copy
if [ $? -ne 0 ]; then
    echo "ERROR: Asset copy failed"
    exit 1
fi

echo ""
echo "[3/3] Opening projects for testing..."
echo ""
echo "Choose platform to test:"
echo "[1] Android"
echo "[2] iOS"
echo "[3] Both"
echo "[4] Skip"
echo ""
read -p "Enter choice (1-4): " choice

case $choice in
    1)
        echo "Opening Android Studio..."
        npx cap open android
        ;;
    2)
        echo "Opening Xcode..."
        npx cap open ios
        ;;
    3)
        echo "Opening Android Studio..."
        npx cap open android &
        sleep 3
        echo "Opening Xcode..."
        npx cap open ios
        ;;
    *)
        echo "Skipping project opening..."
        ;;
esac

echo ""
echo "================================"
echo "DEPLOYMENT COMPLETE!"
echo "================================"
echo ""
echo "Next steps:"
echo "1. Test the instant navigation in the app"
echo "2. Navigate: Home -> Any Page -> Back to Home"
echo "3. Verify < 16ms instant response (no delay)"
echo ""
echo "For detailed testing instructions, see:"
echo "TEST_INSTANT_NAVIGATION.md"
echo ""

#!/bin/sh

# Handle closing application on signal interrupt (ctrl + c)
trap 'kill $CONTINUOUS_INSTALL_PID $SERVER_PID 2>/dev/null; exit' INT TERM

mkdir -p logs
# Reset log file content for new application boot
echo "*** Logs for continuous installer ***" > ./logs/installer.log
echo "*** Logs for 'npm run start' ***" > ./logs/runner.log

# Print that the application is starting in watch mode
echo "starting application in watch mode..."

# Start the continious build listener process
echo "starting continuous installer..."
if [ ! -d node_modules ]; then
    npm install | tee ./logs/installer.log
fi

( file_hash() {
    cksum "$1" 2>/dev/null || echo "missing $1"
}

package_hash=$(file_hash package.json)
package_lock_hash=$(file_hash package-lock.json)
while sleep 1
do
    new_package_hash=$(file_hash package.json)
    new_package_lock_hash=$(file_hash package-lock.json)
    
    if [ "$package_hash" != "$new_package_hash" ] || [ "$package_lock_hash" != "$new_package_lock_hash" ]
    then
        echo "running npm install..."
        npm install | tee ./logs/installer.log
        new_package_hash=$(file_hash package.json)
        new_package_lock_hash=$(file_hash package-lock.json)
    fi

    package_hash=$new_package_hash
    package_lock_hash=$new_package_lock_hash

done )  & CONTINUOUS_INSTALL_PID=$!

# Start server process once initial build finishes  
( npm run start | tee ./logs/runner.log ) & SERVER_PID=$!

# Handle application background process exiting
wait $CONTINUOUS_INSTALL_PID $SERVER_PID
EXIT_CODE=$?
echo "application exited with exit code $EXIT_CODE..."

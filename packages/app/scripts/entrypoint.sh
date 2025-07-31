#!/bin/sh
set -e

# Path for the config file within the container
CONFIG_FILE_PATH="/usr/src/app/packages/app/dist/config.js"

# Check if dynamic config generation is enabled
if [ "$USE_DYNAMIC_CONFIG" = "true" ]; then
  echo "USE_DYNAMIC_CONFIG is true. Generating config.js from environment variables."
  cat <<EOF > "$CONFIG_FILE_PATH"
window["##runtimeConfig"] = {
  appEnvironment: "${APP_ENVIRONMENT:-hyperchain}",
  environmentConfig: {
    networks: [
      {
        apiUrl: "${API_URL}",
        bridgeUrl: "${BRIDGE_URL}",
        hostnames: ["${HOSTNAMES}"],
        icon: "${ICON}",
        l2ChainId: ${L2_CHAIN_ID},
        prividium: ${PRIVIDIUM},
        l2NetworkName: "${L2_NETWORK_NAME}",
        maintenance: ${MAINTENANCE},
        name: "${NETWORK_NAME}",
        published: ${PUBLISHED},
        rpcUrl: "${RPC_URL}",
        baseTokenAddress: "${BASE_TOKEN_ADDRESS}",
        verificationApiUrl: "${VERIFICATION_API_URL}",
      },
    ],
  },
};
EOF
  echo "config.js generated successfully at $CONFIG_FILE_PATH"
else
  echo "USE_DYNAMIC_CONFIG is not 'true' or not set. Assuming config.js is provided via volume mount or already exists."
fi

echo "Executing command: $@"
exec "$@"

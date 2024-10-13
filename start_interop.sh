#!/bin/bash

DATABASE_NAME=test_node_1 DATABASE_PASSWORD=notsecurepassword npm run db:drop
DATABASE_NAME=test_node_2 DATABASE_PASSWORD=notsecurepassword npm run db:drop


DATABASE_NAME=test_node_1 DATABASE_PASSWORD=notsecurepassword npm run db:create
DATABASE_NAME=test_node_2 DATABASE_PASSWORD=notsecurepassword npm run db:create


data_fetcher1() {
    cd packages/data-fetcher
    PORT=13040 DATABASE_URL=postgres://postgres:notsecurepassword@localhost:5432/test_node_1  DATABASE_NAME=test_node_1 BLOCKCHAIN_RPC_URL=http://localhost:8011 DATABASE_PASSWORD=notsecurepassword  npm run dev
}


worker1() {
    cd packages/worker
    PORT=13041 DATA_FETCHER_URL=http://localhost:13040 DATABASE_URL=postgres://postgres:notsecurepassword@localhost:5432/test_node_1  DATABASE_NAME=test_node_1 BLOCKCHAIN_RPC_URL=http://localhost:8011 DATABASE_PASSWORD=notsecurepassword  npm run dev
}


api1() {
    cd packages/api
    PORT=13042 METRICS_PORT=13050 DATABASE_URL=postgres://postgres:notsecurepassword@localhost:5432/test_node_1  DATABASE_URL=postgres://postgres:notsecurepassword@localhost:5432/test_node_1  DATABASE_NAME=test_node_1 BLOCKCHAIN_RPC_URL=http://localhost:8011 DATABASE_PASSWORD=notsecurepassword  npm run dev

}

data_fetcher2() {
    cd packages/data-fetcher
    PORT=14040 DATABASE_URL=postgres://postgres:notsecurepassword@localhost:5432/test_node_2  DATABASE_NAME=test_node_2 BLOCKCHAIN_RPC_URL=http://localhost:8012 DATABASE_PASSWORD=notsecurepassword  npm run dev
}


worker2() {
    cd packages/worker
    PORT=14041 DATA_FETCHER_URL=http://localhost:14040 DATABASE_URL=postgres://postgres:notsecurepassword@localhost:5432/test_node_2  DATABASE_NAME=test_node_2 BLOCKCHAIN_RPC_URL=http://localhost:8012 DATABASE_PASSWORD=notsecurepassword  npm run dev
}


api2() {
    cd packages/api
    PORT=14042 METRICS_PORT=14050 DATABASE_URL=postgres://postgres:notsecurepassword@localhost:5432/test_node_2  DATABASE_URL=postgres://postgres:notsecurepassword@localhost:5432/test_node_2  DATABASE_NAME=test_node_2 BLOCKCHAIN_RPC_URL=http://localhost:8012 DATABASE_PASSWORD=notsecurepassword  npm run dev

}

app() {
    cd packages/app
    npm run dev
}

trap 'echo "Caught SIGINT, killing all jobs..."; kill $(jobs -p); wait' SIGINT

data_fetcher1 &
worker1 &
api1 &


data_fetcher2 &
worker2 &
api2 &


app &

wait

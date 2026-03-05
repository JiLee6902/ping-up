#!/bin/bash
# Register Debezium PostgreSQL connector with Outbox Event Router
# Run this ONCE after kafka-connect container is healthy:
#   docker compose up -d
#   # Wait for kafka-connect to be healthy
#   bash scripts/debezium/register-connector.sh

CONNECT_HOST="${CONNECT_HOST:-localhost}"
CONNECT_PORT="${CONNECT_PORT:-8083}"
DB_HOST="${DB_HOST:-postgres}"
DB_PORT="${DB_PORT:-5432}"
DB_USER="${DB_USER:-postgres}"
DB_PASSWORD="${DB_PASSWORD:-postgres}"
DB_NAME="${DB_NAME:-pingup}"

echo "Waiting for Kafka Connect to be ready..."
until curl -s "http://${CONNECT_HOST}:${CONNECT_PORT}/connectors" > /dev/null 2>&1; do
  echo "  Kafka Connect not ready yet, retrying in 5s..."
  sleep 5
done
echo "Kafka Connect is ready!"

echo "Registering outbox connector..."
curl -X POST "http://${CONNECT_HOST}:${CONNECT_PORT}/connectors" \
  -H "Content-Type: application/json" \
  -d "{
  \"name\": \"pingup-outbox-connector\",
  \"config\": {
    \"connector.class\": \"io.debezium.connector.postgresql.PostgresConnector\",
    \"database.hostname\": \"${DB_HOST}\",
    \"database.port\": \"${DB_PORT}\",
    \"database.user\": \"${DB_USER}\",
    \"database.password\": \"${DB_PASSWORD}\",
    \"database.dbname\": \"${DB_NAME}\",
    \"topic.prefix\": \"pingup\",
    \"table.include.list\": \"public.outbox_events\",
    \"plugin.name\": \"pgoutput\",
    \"slot.name\": \"pingup_outbox_slot\",
    \"transforms\": \"outbox\",
    \"transforms.outbox.type\": \"io.debezium.transforms.outbox.EventRouter\",
    \"transforms.outbox.table.fields.additional.placement\": \"event_type:header:eventType\",
    \"transforms.outbox.table.field.event.id\": \"id\",
    \"transforms.outbox.table.field.event.key\": \"aggregate_id\",
    \"transforms.outbox.table.field.event.payload\": \"payload\",
    \"transforms.outbox.table.field.event.timestamp\": \"created_at\",
    \"transforms.outbox.route.by.field\": \"aggregate_type\",
    \"transforms.outbox.route.topic.replacement\": \"outbox.event.\${routedByValue}\",
    \"tombstones.on.delete\": \"false\",
    \"key.converter\": \"org.apache.kafka.connect.json.JsonConverter\",
    \"key.converter.schemas.enable\": false,
    \"value.converter\": \"org.apache.kafka.connect.json.JsonConverter\",
    \"value.converter.schemas.enable\": false
  }
}"

echo ""
echo "Connector registration complete."
echo "Verifying connector status..."
curl -s "http://${CONNECT_HOST}:${CONNECT_PORT}/connectors/pingup-outbox-connector/status" | python3 -m json.tool 2>/dev/null || \
  curl -s "http://${CONNECT_HOST}:${CONNECT_PORT}/connectors/pingup-outbox-connector/status"
echo ""

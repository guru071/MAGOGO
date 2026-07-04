#!/bin/bash

# MAGHGO - Azure Container Apps Deployment Script
# Requirements:
# 1. Azure CLI (az) installed and logged in (`az login`)
# 2. Docker installed and running
# 3. Environment variables loaded from .env

set -e

echo "🚀 Starting MAGHGO Azure Deployment..."

# 1. Configuration
RESOURCE_GROUP="maghgo-rg"
LOCATION="eastus"
ACR_NAME="maghgoacr${RANDOM}"
ENV_NAME="maghgo-env"
AI_APP_NAME="maghgo-ai-service"
WEB_APP_NAME="maghgo-web-app"

echo "========================================="
echo "Resource Group: $RESOURCE_GROUP"
echo "Location: $LOCATION"
echo "ACR Name: $ACR_NAME"
echo "Container App Env: $ENV_NAME"
echo "========================================="

read -p "Press enter to continue or Ctrl+C to abort..."

# Ensure we are logged in
echo "Checking Azure CLI login..."
az account show > /dev/null || az login

# 2. Create Resource Group
echo "📦 Creating Resource Group ($RESOURCE_GROUP)..."
az group create --name $RESOURCE_GROUP --location $LOCATION

# 3. Create Azure Container Registry (ACR)
echo "📦 Creating Azure Container Registry ($ACR_NAME)..."
az acr create --resource-group $RESOURCE_GROUP --name $ACR_NAME --sku Basic --admin-enabled true

# Login to ACR
echo "🔑 Logging into ACR..."
az acr login --name $ACR_NAME

# 4. Build and Push AI Service Image
echo "🐳 Building AI Service Docker image..."
docker build -t $ACR_NAME.azurecr.io/$AI_APP_NAME:latest -f src/ai/Dockerfile src/ai/
echo "⬆️ Pushing AI Service image..."
docker push $ACR_NAME.azurecr.io/$AI_APP_NAME:latest

# 5. Build and Push Web App Image
echo "🐳 Building Web App Docker image..."
docker build -t $ACR_NAME.azurecr.io/$WEB_APP_NAME:latest -f Dockerfile .
echo "⬆️ Pushing Web App image..."
docker push $ACR_NAME.azurecr.io/$WEB_APP_NAME:latest

# 6. Create Azure Container Apps Environment
echo "☁️ Creating Container Apps Environment..."
az containerapp env create \
  --name $ENV_NAME \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION

# Get ACR credentials
ACR_USERNAME=$(az acr credential show -n $ACR_NAME --query "username" -o tsv)
ACR_PASSWORD=$(az acr credential show -n $ACR_NAME --query "passwords[0].value" -o tsv)

# 7. Deploy AI Service (Internal API)
echo "🚀 Deploying AI Service Container App..."
az containerapp create \
  --name $AI_APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --environment $ENV_NAME \
  --image $ACR_NAME.azurecr.io/$AI_APP_NAME:latest \
  --target-port 8000 \
  --ingress internal \
  --registry-server $ACR_NAME.azurecr.io \
  --registry-username $ACR_USERNAME \
  --registry-password $ACR_PASSWORD \
  --query properties.configuration.ingress.fqdn

# Get internal AI URL to pass to Web App
AI_FQDN=$(az containerapp show --name $AI_APP_NAME --resource-group $RESOURCE_GROUP --query properties.configuration.ingress.fqdn -o tsv)
echo "✅ AI Service Internal URL: http://$AI_FQDN"

# Load env variables to pass to Web App
set -a
[ -f .env ] && source .env
set +a

# 8. Deploy Web App (External)
echo "🚀 Deploying Web App Container App..."
az containerapp create \
  --name $WEB_APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --environment $ENV_NAME \
  --image $ACR_NAME.azurecr.io/$WEB_APP_NAME:latest \
  --target-port 3000 \
  --ingress external \
  --registry-server $ACR_NAME.azurecr.io \
  --registry-username $ACR_USERNAME \
  --registry-password $ACR_PASSWORD \
  --env-vars \
    DATABASE_URL=$DATABASE_URL \
    DIRECT_URL=$DIRECT_URL \
    NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL \
    NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY \
    SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_ROLE_KEY \
    AI_SERVICE_URL="http://$AI_FQDN"

echo "🎉 Deployment Complete!"
WEB_FQDN=$(az containerapp show --name $WEB_APP_NAME --resource-group $RESOURCE_GROUP --query properties.configuration.ingress.fqdn -o tsv)
echo "🌐 Your MAGHGO App is live at: https://$WEB_FQDN"

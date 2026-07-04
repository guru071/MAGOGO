#!/bin/bash

# MAGHGO - Azure Virtual Machine Deployment Script
# Requirements: Azure CLI (az) installed and logged in (`az login`)

set -e

echo "🚀 Starting MAGHGO Azure VM Provisioning..."

RESOURCE_GROUP="maghgo-vm-rg"
LOCATION="eastus"
VM_NAME="maghgo-vm"
ADMIN_USER="azureuser"

echo "========================================="
echo "Resource Group: $RESOURCE_GROUP"
echo "Location: $LOCATION"
echo "VM Name: $VM_NAME (Size: Standard_B2s)"
echo "========================================="


# Ensure we are logged in
az account show > /dev/null || az login

# 1. Create Resource Group
echo "📦 Creating Resource Group ($RESOURCE_GROUP)..."
az group create --name $RESOURCE_GROUP --location $LOCATION

# 2. Create VM (B2s is ~4GB RAM, perfect for Next.js + Python on a budget)
echo "💻 Creating Ubuntu Virtual Machine..."
az vm create \
  --resource-group $RESOURCE_GROUP \
  --name $VM_NAME \
  --image Ubuntu2204 \
  --admin-username $ADMIN_USER \
  --generate-ssh-keys \
  --size Standard_B2s \
  --public-ip-sku Standard

# 3. Open Ports for HTTP (80) and AI Service (8000)
echo "🔓 Opening network ports 80 and 8000..."
az vm open-port --resource-group $RESOURCE_GROUP --name $VM_NAME --port 80 --priority 100
az vm open-port --resource-group $RESOURCE_GROUP --name $VM_NAME --port 8000 --priority 110

# 4. Get Public IP
IP_ADDRESS=$(az vm show -d -g $RESOURCE_GROUP -n $VM_NAME --query publicIps -o tsv)

echo "🎉 VM Provisioning Complete!"
echo "Your VM Public IP is: $IP_ADDRESS"
echo ""
echo "Next Steps:"
echo "1. Connect to your VM: ssh $ADMIN_USER@$IP_ADDRESS"
echo "2. Install Docker on the VM:"
echo "   sudo apt-get update && sudo apt-get install docker.io docker-compose -y"
echo "3. Copy your project files (including docker-compose.yml and .env) to the VM."
echo "4. Run this command inside the VM project folder:"
echo "   sudo docker-compose up --build -d"
echo ""
echo "Your website will be live at: http://$IP_ADDRESS"

# Deployment Guide: Event Participant Data Collection

Follow these steps to deploy to Azure Static Web Apps.

## Prerequisites

- [Azure account](https://azure.microsoft.com/free/)
- [GitHub account](https://github.com)
- [Azure CLI](https://docs.microsoft.com/cli/azure/install-azure-cli) (optional, for CLI deployment)

---

## Deployment Path: GitHub + Azure Portal (Recommended)

### Step 1: Create a GitHub Repository

1. Go to [GitHub](https://github.com/new)
2. Create a new repository (e.g. `event-participant-data-collection`)
3. **Do not** initialize with README (we already have files)
4. Note the repository URL

### Step 2: Push This Project to GitHub

From your terminal, run these commands in the **Event-Participant-Data-Collection** folder:

```bash
cd /Volumes/Zike\ 4TB\ 001/Users/paulshadwell/Development/aquis-capital/Event-Participant-Data-Collection

# Initialize git (if this folder isn't already a repo)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit: Event participant registration"

# Add your GitHub repo as remote (replace with your repo URL)
git remote add origin https://github.com/YOUR_ORG/event-participant-data-collection.git

# Push to main
git branch -M main
git push -u origin main
```

### Step 3: Create Azure Resources

#### 3a. Create Static Web App

1. Go to [Azure Portal](https://portal.azure.com) → **Create a resource** → search for **Static Web App**
2. Create with these settings:
   - **Subscription:** Your subscription
   - **Resource group:** Create new (e.g. `rg-event-registration`)
   - **Name:** `aquis-event-registration` (or your choice)
   - **Plan type:** Free
   - **Deployment details:** GitHub
   - **Sign in to GitHub** and authorize Azure
   - **Organization:** Your GitHub org
   - **Repository:** `event-participant-data-collection`
   - **Branch:** `main`
   - **Build Presets:** Custom
   - **App location:** `/`
   - **Output location:** *(leave empty)*
   - **API location:** `api`

3. Click **Review + create** → **Create**

4. Wait for the first deployment to complete (triggered automatically)

#### 3b. Create Storage Account (for CSV)

1. In Azure Portal → **Create a resource** → **Storage account**
2. Settings:
   - **Resource group:** Same as above
   - **Storage account name:** e.g. `aquiseventstorage` (must be globally unique)
   - **Region:** Same as your Static Web App
   - **Performance:** Standard
   - **Redundancy:** LRS
3. Create, then go to **Access keys** → copy **Connection string** (key1)

#### 3c. Set Up SendGrid

1. Go to [SendGrid](https://sendgrid.com) → Sign up or log in
2. **Settings** → **API Keys** → **Create API Key**
   - Name: `aquis-event-registration`
   - Permissions: **Restricted** → **Mail Send** → Full Access
3. Copy the API key (you won't see it again)
4. **Settings** → **Sender Authentication** → verify your domain or single sender email

### Step 4: Configure Application Settings

1. In Azure Portal → your **Static Web App** → **Configuration**
2. Under **Application settings** → **Add**
3. Add these settings:

| Name | Value |
|------|-------|
| `AZURE_STORAGE_CONNECTION_STRING` | Paste your storage connection string |
| `SENDGRID_API_KEY` | Paste your SendGrid API key |
| `SENDGRID_FROM_EMAIL` | Your verified sender (e.g. `noreply@aquis-capital.com`) |

4. Click **Save**

### Step 5: Add Custom Domain (Optional)

1. Static Web App → **Custom domains** → **Add**
2. Enter `events.aquis-capital.com`
3. Add the DNS record shown (CNAME or A record) at your domain registrar

---

## Alternative: Deploy via Azure CLI

If you have Azure CLI installed and logged in:

```bash
# Login (opens browser)
az login

# Create resource group
az group create --name rg-event-registration --location switzerlandnorth

# Create Static Web App (will prompt for GitHub connection)
az staticwebapp create \
  --name aquis-event-registration \
  --resource-group rg-event-registration \
  --location switzerlandnorth \
  --source https://github.com/YOUR_ORG/event-participant-data-collection \
  --branch main \
  --app-location "/" \
  --api-location "api" \
  --output-location ""

# Get deployment token (add to GitHub Secrets as AZURE_STATIC_WEB_APPS_API_TOKEN)
az staticwebapp secrets list --name aquis-event-registration --resource-group rg-event-registration
```

---

## Verify Deployment

1. **Get your app URL:** Static Web App → **Overview** → copy the URL (e.g. `https://nice-desert-XXXX.azurestaticapps.net`)
2. **Test the form:** Visit the URL and submit a test registration
3. **Check CSV:** Azure Storage → your account → **Containers** → `event-participants` → `participants.csv`
4. **Check email:** Inbox at events@aquis-capital.com

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| API returns 500 | Check Application settings are configured; review Function logs in Azure Portal |
| Deployment fails | Ensure `api_location: "api"` in workflow; run `npm install` in api folder before commit |
| CORS errors | Static Web Apps serves app and API from same origin – CORS should not be needed |
| Logo not loading | Ensure aquis-capital.com is accessible; consider hosting logo locally if needed |

---

## Next Steps

- Set up the custom domain `events.aquis-capital.com`
- Print the QR code from `/qr-print.html` for your event
- Monitor registrations in the CSV blob or via email

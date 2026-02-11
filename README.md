# Event Participant Data Collection

A single-page website for collecting event participant registration data (full name, email, phone) with Aquis Capital branding. Data is saved to a CSV file in Azure Blob Storage and emailed to events@aquis-capital.com.

**URL:** https://events.aquis-capital.com

## Features

- **Registration form** with full name, email (validated), and phone number
- **Aquis Capital branding** – logo and color palette matching aquis-capital.com
- **CSV storage** – participants appended to a CSV file in Azure Blob Storage
- **Email notification** – each registration emailed to events@aquis-capital.com
- **Printable QR code** – page with QR code and Aquis logo for event use

## Project Structure

```
Event-Participant-Data-Collection/
├── index.html          # Main registration form
├── qr-print.html       # Printable QR code page
├── styles.css          # Shared styles
├── script.js           # Form validation and submission
├── api/                # Azure Functions API
│   ├── src/
│   │   ├── index.js
│   │   └── functions/
│   │       └── submit.js
│   ├── package.json
│   └── host.json
├── staticwebapp.config.json
└── .github/workflows/
    └── azure-static-web-apps.yml
```

## Azure Setup

### 1. Create Azure Static Web App

1. In [Azure Portal](https://portal.azure.com), create a **Static Web App**
2. Connect your GitHub repository
3. Set:
   - **App location:** `/`
   - **Output location:** (leave empty)
   - **API location:** `api`
4. The deployment token is automatically added to GitHub as `AZURE_STATIC_WEB_APPS_API_TOKEN`

### 2. Configure Custom Domain

1. In the Static Web App, go to **Custom domains**
2. Add `events.aquis-capital.com`
3. Configure DNS as instructed (CNAME or A record)

### 3. Create Azure Storage Account

1. Create a **Storage Account**
2. Create a container named `event-participants` (or the API will create it on first run)
3. Copy the **Connection string** (under Access keys)

### 4. SendGrid Setup

1. Create a [SendGrid](https://sendgrid.com) account
2. Create an API key with Mail Send permission
3. Verify sender identity (the `from` email domain)

### 5. Application Settings

In the Static Web App, go to **Configuration** → **Application settings** and add:

| Name | Value |
|------|--------|
| `AZURE_STORAGE_CONNECTION_STRING` | Your storage account connection string |
| `SENDGRID_API_KEY` | Your SendGrid API key |
| `SENDGRID_FROM_EMAIL` | Verified sender email (e.g. noreply@aquis-capital.com) |

## Local Development

### Prerequisites

- Node.js 18+
- [Azure Functions Core Tools](https://docs.microsoft.com/azure/azure-functions/functions-run-local)
- [Azure Static Web Apps CLI](https://www.npmjs.com/package/@azure/static-web-apps-cli) (optional)

### Run locally

1. **Install API dependencies:**
   ```bash
   cd api && npm install
   ```

2. **Configure local settings:**
   - Copy `api/local.settings.json.example` to `api/local.settings.json`
   - Fill in your Azure Storage and SendGrid values

3. **Start the app:**
   ```bash
   npx swa start . --api-location api
   ```
   Or open `index.html` in a browser and run the API separately with `func start` in the api folder.

### Test form without API

You can open `index.html` directly in a browser. Form validation will work, but submission will fail until the API is running.

## QR Code

- Open **qr-print.html** to view and print the QR code
- The QR code encodes: https://events.aquis-capital.com
- The Aquis Capital logo is overlaid in the center
- Use **Print QR Code** or Ctrl/Cmd+P to print for the event

## Color Palette

Matches Aquis Capital branding:

- Navy: `#0d1b2a`
- Gold: `#c9a227`
- Light gray: `#f8f9fa`
- Text: `#2c3e50`

## Troubleshooting

### CSV saves but no email received

1. **Check the form error message** – After the next failed submission, the form will show SendGrid’s error (e.g. sender not verified).

2. **Verify sender in SendGrid**
   - [SendGrid Dashboard](https://app.sendgrid.com) → Settings → Sender Authentication
   - Either verify a Single Sender (email) or authenticate your domain
   - The `SENDGRID_FROM_EMAIL` in Azure must match a verified sender

3. **Verify Application settings**
   - Azure Portal → Static Web App → Configuration → Application settings
   - Confirm `SENDGRID_API_KEY` and `SENDGRID_FROM_EMAIL` are set correctly

4. **Check SendGrid Activity**
   - SendGrid → Activity → view recent deliveries
   - Shows accepted, delivered, bounced, or blocked emails

5. **Check Azure Function logs**
   - Azure Portal → Static Web App → Functions → select your function → Monitor → Log stream
   - Or: Deployment Center → Logs → view build/runtime logs

6. **Check spam** – Look in the spam folder for events@aquis-capital.com

## License

Proprietary – Aquis Capital AG

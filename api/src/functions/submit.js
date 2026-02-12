const { app } = require('@azure/functions');
const { BlobServiceClient } = require('@azure/storage-blob');
const sgMail = require('@sendgrid/mail');

const CSV_CONTAINER = 'event-participants';
const CSV_BLOB = 'participants.csv';
const EMAIL_TO = 'events@aquis-capital.com';

function escapeCsvField(value) {
  if (value == null || value === '') return '""';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return '"' + str + '"';
}

async function appendToCsv(participant) {
  const connStr = process.env.AZURE_STORAGE_CONNECTION_STRING;
  if (!connStr) {
    throw new Error('AZURE_STORAGE_CONNECTION_STRING is not configured');
  }

  const blobServiceClient = BlobServiceClient.fromConnectionString(connStr);
  const containerClient = blobServiceClient.getContainerClient(CSV_CONTAINER);

  await containerClient.createIfNotExists();

  let csvContent = '';
  const blockBlobClient = containerClient.getBlockBlobClient(CSV_BLOB);

  try {
    const downloadResponse = await blockBlobClient.download();
    csvContent = await streamToString(downloadResponse.readableStreamBody);
  } catch (err) {
    if (err.statusCode === 404 || err.code === 'BlobNotFound') {
      csvContent = 'Timestamp,Full Name,Email,Phone,Company\n';
    } else {
      throw err;
    }
  }

  const timestamp = new Date().toISOString();
  const row = `${escapeCsvField(timestamp)},${escapeCsvField(participant.fullName)},${escapeCsvField(participant.email)},${escapeCsvField(participant.phone)},${escapeCsvField(participant.company)}\n`;
  csvContent += row;

  const buffer = Buffer.from(csvContent, 'utf8');
  await blockBlobClient.uploadData(buffer, { overwrite: true });
}

async function streamToString(readableStream) {
  const chunks = [];
  for await (const chunk of readableStream) {
    chunks.push(typeof chunk === 'string' ? chunk : chunk.toString());
  }
  return chunks.join('');
}

async function sendEmail(participant) {
  const apiKey = process.env.SENDGRID_API_KEY;
  if (!apiKey) {
    throw new Error('SENDGRID_API_KEY is not configured');
  }

  sgMail.setApiKey(apiKey);

  const msg = {
    to: EMAIL_TO,
    from: process.env.SENDGRID_FROM_EMAIL || 'noreply@aquis-capital.com',
    subject: `Event Registration: ${participant.fullName}`,
    text: `New event registration received:\n\nFull Name: ${participant.fullName}\nEmail: ${participant.email}\nPhone: ${participant.phone}\nCompany: ${participant.company}\n\nTimestamp: ${new Date().toISOString()}`,
    html: `
      <h2>New Event Registration</h2>
      <p><strong>Full Name:</strong> ${participant.fullName}</p>
      <p><strong>Email:</strong> ${participant.email}</p>
      <p><strong>Phone:</strong> ${participant.phone || 'Not provided'}</p>
      <p><strong>Company:</strong> ${participant.company}</p>
      <p><em>Received: ${new Date().toISOString()}</em></p>
    `,
  };

  await sgMail.send(msg);
}

app.http('submit', {
  methods: ['POST'],
  authLevel: 'anonymous',
  handler: async (request, context) => {
    context.log('Submit function triggered');

    if (request.method !== 'POST') {
      return {
        status: 405,
        jsonBody: { error: 'Method not allowed' },
      };
    }

    let participant;
    try {
      participant = await request.json();
    } catch {
      return {
        status: 400,
        jsonBody: { error: 'Invalid JSON body' },
      };
    }

    const { fullName, email, phone, company } = participant;
    if (!fullName || !email || !phone || !company) {
      return {
        status: 400,
        jsonBody: { error: 'Full name, email, phone number, and company are required' },
      };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return {
        status: 400,
        jsonBody: { error: 'Invalid email address' },
      };
    }

    const data = {
      fullName: String(fullName).trim(),
      email: String(email).trim(),
      phone: String(phone).trim(),
      company: String(company).trim(),
    };

    try {
      await appendToCsv(data);
      context.log('Appended to CSV successfully');
    } catch (err) {
      context.log.error('CSV write error:', err);
      return {
        status: 500,
        jsonBody: {
          error: 'Failed to save registration data',
          detail: err.message || String(err),
        },
      };
    }

    try {
      await sendEmail(data);
      context.log('Email sent successfully');
    } catch (err) {
      const sendGridDetail = err.response?.body
        ? JSON.stringify(err.response.body)
        : err.message || String(err);
      context.log.error('Email send error:', err);
      context.log.error('SendGrid response:', sendGridDetail);
      return {
        status: 500,
        jsonBody: {
          error: 'Registration saved but email notification failed',
          detail: sendGridDetail,
        },
      };
    }

    return {
      status: 200,
      jsonBody: { success: true, message: 'Registration submitted successfully' },
    };
  },
});

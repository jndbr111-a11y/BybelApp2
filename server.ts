import express from 'express';
import { createServer as createViteServer } from 'vite';
import { google } from 'googleapis';
import 'dotenv/config';

const app = express();
const PORT = 3000;

app.use(express.json());

// API Routes
app.get('/api/auth/google/url', (req, res) => {
  const origin = req.query.origin as string;
  
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return res.status(500).json({ error: 'Google credentials not configured' });
  }

  const redirectUri = `${origin}/auth/callback`;
  
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    redirectUri
  );

  const scopes = [
    'https://www.googleapis.com/auth/documents',
    'https://www.googleapis.com/auth/drive.file'
  ];

  // Encode origin in state to retrieve it in callback
  const state = Buffer.from(origin).toString('base64');

  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    state: state,
    prompt: 'consent' // Force consent to ensure we get a refresh token if needed
  });

  res.json({ url });
});

app.get('/auth/callback', async (req, res) => {
  const { code, state } = req.query;

  if (!code || !state) {
    return res.status(400).send('Missing code or state');
  }

  try {
    const origin = Buffer.from(state as string, 'base64').toString('ascii');
    const redirectUri = `${origin}/auth/callback`;

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      redirectUri
    );

    const { tokens } = await oauth2Client.getToken(code as string);

    // Send tokens back to opener
    res.send(`
      <html>
        <body>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'GOOGLE_AUTH_SUCCESS', tokens: ${JSON.stringify(tokens)} }, '*');
              window.close();
            } else {
              document.body.innerHTML = 'Authentication successful. You can close this window.';
            }
          </script>
          <p>Authentication successful. Closing...</p>
        </body>
      </html>
    `);
  } catch (error) {
    console.error('Error exchanging token:', error);
    res.status(500).send('Authentication failed');
  }
});

app.post('/api/save-doc', async (req, res) => {
  const { content, tokens, title } = req.body;

  if (!tokens) {
    return res.status(401).json({ error: 'No tokens provided' });
  }

  try {
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials(tokens);

    const docs = google.docs({ version: 'v1', auth: oauth2Client });

    // 1. Create a new document
    const createResponse = await docs.documents.create({
      requestBody: {
        title: title || 'Bybelstudie Ontleding'
      }
    });

    const documentId = createResponse.data.documentId;

    if (!documentId) {
      throw new Error('Failed to create document');
    }

    // 2. Insert content
    // We need to handle markdown stripping or basic formatting. 
    // For simplicity, we'll just insert the raw text for now, 
    // but ideally we'd convert markdown to Google Docs structure.
    // Let's just insert the plain text.
    
    await docs.documents.batchUpdate({
      documentId,
      requestBody: {
        requests: [
          {
            insertText: {
              location: {
                index: 1,
              },
              text: content
            }
          }
        ]
      }
    });

    res.json({ 
      success: true, 
      documentId, 
      url: `https://docs.google.com/document/d/${documentId}/edit` 
    });

  } catch (error) {
    console.error('Error saving doc:', error);
    res.status(500).json({ error: 'Failed to save document' });
  }
});

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // In production, serve static files from dist
    app.use(express.static('dist'));
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

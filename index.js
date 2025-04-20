const express = require('express');
const crypto = require('crypto');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

const CHANNEL_SECRET = process.env.LINE_CHANNEL_SECRET;
const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL;

app.use(bodyParser.json({
  verify: (req, res, buf) => {
    const signature = req.headers['x-line-signature'];
    const hash = crypto.createHmac('sha256', CHANNEL_SECRET)
                       .update(buf)
                       .digest('base64');
    if (hash !== signature) {
      throw new Error('Invalid LINE Signature');
    }
  }
}));

app.post('/webhook', async (req, res) => {
  try {
    const events = req.body.events || [];
    for (const event of events) {
      const userId = event.source?.userId;
      const messageText = event.message?.text || null;

      if (userId && N8N_WEBHOOK_URL) {
        await fetch(N8N_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, messageText })
        });
      }
    }
    res.status(200).send('OK');
  } catch (err) {
    console.error('Webhook error:', err.message);
    res.status(500).send('Server error');
  }
});

app.listen(PORT, () => {
  console.log(`LINE webhook server running at http://localhost:${PORT}`);
});

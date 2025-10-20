const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const port = process.env.PORT || 4000;

app.use(bodyParser.json());

// Simple faucet stub - DO NOT use in production
app.post('/api/faucet', (req, res) => {
  const { wallet, amount } = req.body || {};
  if (!wallet) {
    return res.status(400).json({ error: 'wallet required' });
  }
  // Return a fake tx signature for frontend testing
  const fakeSig = `FAKE_TX_${Date.now()}`;
  console.log(`Faucet requested for ${wallet}, amount=${amount}`);
  return res.json({ tx: fakeSig });
});

app.listen(port, () => {
  console.log(`Faucet stub listening on http://localhost:${port}`);
});

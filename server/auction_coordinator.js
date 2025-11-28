const express = require('express');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

let auctions = {}; // { intentId: [bids...] }

app.post('/submit_bid', (req, res) => {
    const bid = req.body; // { intentId, solver, price, route }
    auctions[bid.intentId] = auctions[bid.intentId] || [];
    auctions[bid.intentId].push(bid);
    res.send({ ok: true });
});

// admin endpoint to pick winner (for demo)
app.post('/select_winner', (req, res) => {
    const { intentId } = req.body;
    const bids = auctions[intentId] || [];
    if (!bids.length) return res.status(400).send({ error: 'no bids' });
    bids.sort((a, b) => a.price - b.price);
    const winner = bids[0];
    // For demo: return winner to relayer
    res.send({ winner });
});

app.listen(4100, () => console.log('Auction coordinator on 4100'));

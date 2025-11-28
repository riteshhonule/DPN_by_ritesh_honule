import React, { useState } from "react";
import { signIntentMeta, sendToRelayer } from "../utils/contractLoader";

export default function IntentForm() {
  const [amount, setAmount] = useState("1");
  const [loading, setLoading] = useState(false);

  const handleGaslessSubmit = async () => {
    try {
      setLoading(true);

      const signed = await signIntentMeta(amount);

      const payload = {
        user: signed.user,
        fromToken: signed.fromToken,
        toToken: signed.toToken,
        amount: signed.amount,
        chainTo: signed.chainTo,
        expiry: signed.expiry,
        nonce: signed.nonce,
        signature: signed.signature,
        fee: signed.fee     // 🔥 REQUIRED
      };

      const resp = await sendToRelayer(payload);

      alert(`🚀 Gasless Intent Submitted!\nTX: ${resp.txHash}`);
    } catch (e) {
      alert("❌ Error: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h3>Submit Intent (Gasless)</h3>

      <input
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="Amount (ETH)"
      />

      <button onClick={handleGaslessSubmit} disabled={loading}>
        {loading ? "Submitting..." : "Sign & Send Gasless"}
      </button>
    </div>
  );
}

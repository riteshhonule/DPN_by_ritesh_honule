import React from "react";
import "./styles/main.css";
import IntentForm from "./components/IntentForm";
import IntentTable from "./components/IntentTable";
import TreasuryDisplay from "./components/TreasuryDisplay";

export default function App() {
  return (
    <div className="app-container">
      <h2>DPN Cross-chain Demo</h2>

      <section>
        <IntentForm />
      </section>

      <section>
        <IntentTable />
      </section>

      <section>
        <TreasuryDisplay />
      </section>
    </div>
  );
}

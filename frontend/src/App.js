// // src/App.js
// import React, { useState } from "react";
// import "./styles/main.css";

// import IntentForm from "./components/IntentForm";
// import IntentTable from "./components/IntentTable";
// import TreasuryDisplay from "./components/TreasuryDisplay";
// import ValidatorDashboard from "./components/ValidatorDashboard";

// export default function App() {
//     const [page, setPage] = useState("dpn");

//     return (
//         <div className="app-container">
//             <h1>DPN Cross-chain Demo</h1>

//             {/* Simple Navigation */}
//             <nav style={{ marginBottom: "20px" }}>
//                 <button onClick={() => setPage("dpn")} style={{ marginRight: "10px" }}>
//                     🟦 DPN Cross-chain
//                 </button>

//                 <button onClick={() => setPage("validators")}>
//                     🟩 Validator Dashboard
//                 </button>
//             </nav>

//             {/* Page Rendering */}
//             {page === "dpn" && (
//                 <>
//                     <section>
//                         <IntentForm />
//                     </section>

//                     <section>
//                         <IntentTable />
//                     </section>

//                     <section>
//                         <TreasuryDisplay />
//                     </section>
//                 </>
//             )}

//             {page === "validators" && (
//                 <section>
//                     <ValidatorDashboard />
//                 </section>
//             )}
//         </div>
//     );
// }














// src/App.js
import React, { useState } from "react";
import "./styles/main.css";

import IntentForm from "./components/IntentForm";
import IntentTable from "./components/IntentTable";
import TreasuryDisplay from "./components/TreasuryDisplay";
import ValidatorDashboard from "./components/ValidatorDashboard";
import TreasuryDashboard from "./components/TreasuryDashboard";

export default function App() {
    const [page, setPage] = useState("dpn");

    return (
        <div className="app-container">
            <h1>DPN Cross-chain Demo</h1>

            {/* Navigation */}
            <nav style={{ marginBottom: "20px" }}>
                <button
                    onClick={() => setPage("dpn")}
                    style={{ marginRight: "10px" }}
                >
                    🟦 DPN Cross-chain
                </button>

                <button
                    onClick={() => setPage("validators")}
                    style={{ marginRight: "10px" }}
                >
                    🟩 Validator Dashboard
                </button>

                <button
                    onClick={() => setPage("treasury")}
                    style={{ marginRight: "10px" }}
                >
                    🟧 Treasury Dashboard
                </button>
            </nav>

            {/* Page Rendering */}
            {page === "dpn" && (
                <>
                    <section>
                        <IntentForm />
                    </section>

                    <section>
                        <IntentTable />
                    </section>

                    <section>
                        <TreasuryDisplay />
                    </section>
                </>
            )}

            {page === "validators" && (
                <section>
                    <ValidatorDashboard />
                </section>
            )}

            {page === "treasury" && (
                <section>
                    <TreasuryDashboard />
                </section>
            )}
        </div>
    );
}


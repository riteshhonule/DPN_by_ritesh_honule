import React, { useEffect, useState } from "react";

export default function TreasuryDashboard() {
    const [total, setTotal] = useState("0");
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(false);

    const S = {
        container: { maxWidth: 900, margin: "20px auto", fontFamily: "Arial" },
        card: { padding: 16, border: "1px solid #ccc", borderRadius: 8, marginBottom: 20 },
        header: { fontSize: 22, fontWeight: "bold", marginBottom: 12 },
        table: { width: "100%", borderCollapse: "collapse" },
        th: { padding: 8, borderBottom: "1px solid #ccc", textAlign: "left" },
        td: { padding: 8, borderBottom: "1px solid #eee" },
        small: { fontSize: 12, color: "#444" }
    };

    // -------------------------------
    // Load total fees
    // -------------------------------
    async function loadTotal() {
        try {
            const res = await fetch("http://127.0.0.1:4200/treasury_total");
            const data = await res.json();
            setTotal(data.total || "0");
        } catch (err) {
            console.warn("treasury_total error:", err.message);
        }
    }

    // -------------------------------
    // Load deposit/slash events
    // -------------------------------
    async function loadEvents() {
        setLoading(true);
        try {
            const res = await fetch("http://127.0.0.1:4200/treasury");
            const data = await res.json();
            setEvents(data || []);
        } catch (err) {
            console.warn("treasury events error:", err.message);
            setEvents([]);
        }
        setLoading(false);
    }

    // Initial load
    useEffect(() => {
        loadTotal();
        loadEvents();
    }, []);

    // Refresh every 6 seconds
    useEffect(() => {
        const t = setInterval(() => {
            loadTotal();
            loadEvents();
        }, 6000);
        return () => clearInterval(t);
    }, []);

    return (
        <div style={S.container}>

            {/* TOTAL FEES CARD */}
            <div style={S.card}>
                <div style={S.header}>Treasury Overview</div>
                <div style={{ fontSize: 18 }}>
                    <b>Total Fees:</b>{" "}
                    {Number(total) / 1e18} ETH
                </div>
                <div style={S.small}>Auto-refresh every 6 seconds</div>
            </div>

            {/* EVENTS TABLE */}
            <div style={S.card}>
                <div style={S.header}>Treasury Events</div>

                {loading ? (
                    <div>Loading...</div>
                ) : events.length === 0 ? (
                    <div style={S.small}>No treasury events yet.</div>
                ) : (
                    <table style={S.table}>
                        <thead>
                            <tr>
                                <th style={S.th}>Sender</th>
                                <th style={S.th}>Amount (ETH)</th>
                                <th style={S.th}>Time</th>
                            </tr>
                        </thead>
                        <tbody>
                            {events.map((e, i) => (
                                <tr key={i}>
                                    <td style={S.td}>{e.who}</td>
                                    <td style={S.td}>{Number(e.amount) / 1e18}</td>
                                    <td style={S.td}>{e.recorded_at}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

        </div>
    );
}

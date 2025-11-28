import React, { useEffect, useState } from "react";
import { loadIntents } from "../utils/contractLoader";
import { ethers } from "ethers";

export default function IntentTable() {
    const [intents, setIntents] = useState([]);

    useEffect(() => {
        async function fetchData() {
            const list = await loadIntents();
            setIntents(list);
        }
        fetchData();
    }, []);

    return (
        <div>
            <h3>All Intents</h3>
            <table border="1" cellPadding="6">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>User</th>
                        <th>Amount (ETH)</th>
                        <th>Settled</th>
                    </tr>
                </thead>
                <tbody>
                    {intents.map((i) => (
                        <tr key={i.id}>
                            <td>{i.id}</td>
                            <td>{i.user}</td>
                            <td>{ethers.utils.formatEther(i.amount)}</td>
                            <td>{i.settled ? "Yes" : "No"}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

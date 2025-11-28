import React, { useEffect, useState } from "react";
import { getTreasuryBalance } from "../utils/contractLoader";
import { ethers } from "ethers";

export default function TreasuryDisplay() {
    const [balance, setBalance] = useState("0");

    useEffect(() => {
        async function fetchBalance() {
            const value = await getTreasuryBalance();
            setBalance(value);
        }
        fetchBalance();
    }, []);

    return (
        <div>
            <h3>Treasury Fees Collected</h3>
            <p>
                {ethers.utils.formatEther(balance)} ETH
            </p>
        </div>
    );
}

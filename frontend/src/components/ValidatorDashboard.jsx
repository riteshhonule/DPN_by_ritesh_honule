


import React, { useEffect, useState, useRef } from "react";
import { ethers } from "ethers";
import addresses from "../abi/addresses.json";
import ValidatorRegistryABI from "../abi/ValidatorRegistry.json";

// Clean Validator Dashboard
export default function ValidatorDashboard() {
    const [provider, setProvider] = useState(null);
    const [signer, setSigner] = useState(null);
    const [account, setAccount] = useState(null);
    const [contract, setContract] = useState(null);

    const [validators, setValidators] = useState([]);
    const [stakeAmount, setStakeAmount] = useState("0.1");
    const [topUpAmount, setTopUpAmount] = useState("0.05");

    const [slashes, setSlashes] = useState([]);
    const [loading, setLoading] = useState(false);

    const mounted = useRef(true);

    const S = {
        container: { maxWidth: 900, margin: "20px auto", fontFamily: "Arial" },
        card: { padding: 16, border: "1px solid #ccc", borderRadius: 8, marginBottom: 20 },
        header: { fontSize: 22, fontWeight: "bold", marginBottom: 12 },
        row: { display: "flex", alignItems: "center", gap: 8, marginBottom: 8 },
        input: { padding: 6, borderRadius: 4, border: "1px solid #bbb", width: 120 },
        button: { padding: "8px 12px", borderRadius: 4, cursor: "pointer", border: "none" },
        table: { width: "100%", borderCollapse: "collapse" },
        th: { padding: 8, borderBottom: "1px solid #ccc", textAlign: "left" },
        td: { padding: 8, borderBottom: "1px solid #eee" },
        small: { fontSize: 12, color: "#444" }
    };

    // -------------------------------------------------------
    // Init Provider and Contract
    // -------------------------------------------------------
    useEffect(() => {
        mounted.current = true;

        async function init() {
            try {
                let _provider;
                if (window.ethereum) {
                    _provider = new ethers.providers.Web3Provider(window.ethereum);
                    await _provider.send("eth_requestAccounts", []);
                    const _signer = _provider.getSigner();
                    const _acc = (await _signer.getAddress()).toLowerCase();

                    setProvider(_provider);
                    setSigner(_signer);
                    setAccount(_acc);

                    const c = new ethers.Contract(addresses.validatorRegistry, ValidatorRegistryABI.abi, _signer);
                    setContract(c);
                    console.log('Validator contract initialized with signer:', c.address);
                } else {
                    _provider = new ethers.providers.JsonRpcProvider("http://127.0.0.1:8545");
                    setProvider(_provider);

                    const c = new ethers.Contract(addresses.validatorRegistry, ValidatorRegistryABI.abi, _provider);
                    setContract(c);
                    console.log('Validator contract initialized with provider:', c.address);
                }
            } catch (err) {
                console.error("Init error:", err);
            }
        }

        init();
        return () => (mounted.current = false);
    }, []);

    // -------------------------------------------------------
    // Load validators & watch events
    // -------------------------------------------------------
    useEffect(() => {
        if (!contract) return;
        loadValidators();
        fetchSlashHistory();

        try {
            contract.on("ValidatorRegistered", loadValidators);
            contract.on("ValidatorSlashed", loadValidators);
            contract.on("ValidatorDeactivated", loadValidators);
            contract.on("ValidatorActivated", loadValidators);
        } catch {}

        return () => {
            try {
                contract.removeAllListeners();
            } catch {}
        };
    }, [contract]);

    // -------------------------------------------------------
    // LOAD VALIDATORS LIST
    // -------------------------------------------------------
    async function loadValidators() {
        setLoading(true);
        try {
            let list = [];

            try {
                list = await contract.listValidators();
            } catch {
                const filter = contract.filters.ValidatorRegistered();
                const logs = await contract.provider.getLogs({
                    fromBlock: 0,
                    toBlock: "latest",
                    address: contract.address,
                    topics: filter.topics
                });

                const iface = new ethers.utils.Interface(ValidatorRegistryABI.abi);
                const addrSet = new Set();
                logs.forEach(log => {
                    const ev = iface.parseLog(log);
                    addrSet.add(ev.args.who.toLowerCase());
                });

                list = Array.from(addrSet);
            }

            const output = [];
            for (const addr of list) {
                const v = await contract.getValidator(addr);
                output.push({
                    address: addr.toLowerCase(),
                    stake: ethers.utils.formatEther(v.stake.toString()),
                    active: v.active,
                    withdrawAt: Number(v.withdrawAvailableAt.toString())
                });
            }

            if (mounted.current) setValidators(output);
        } catch (err) {
            console.error("loadValidators error:", err);
        }
        setLoading(false);
    }

    // -------------------------------------------------------
    // COUNTDOWN 
    // -------------------------------------------------------
    function countdown(ts) {
        if (!ts) return "-";
        const now = Math.floor(Date.now() / 1000);
        const diff = ts - now;
        if (diff <= 0) return "now";
        return `${diff}s`;
    }

    // -------------------------------------------------------
    // FETCH SLASH HISTORY FROM INDEXER
    // -------------------------------------------------------
    async function fetchSlashHistory() {
        try {
            const res = await fetch("http://127.0.0.1:4200/slashes");
            if (!res.ok) throw new Error("API error");

            const data = await res.json();
            // ensure array and sort newest first
            const arr = Array.isArray(data) ? data : [];
            arr.sort((a, b) => {
                // try to parse slashed_at as date
                const ta = new Date(a.slashed_at).getTime() || 0;
                const tb = new Date(b.slashed_at).getTime() || 0;
                return tb - ta;
            });
            setSlashes(arr);
        } catch (err) {
            console.warn("Slash API error:", err && err.message ? err.message : err);
            setSlashes([]);
        }
    }

    // -------------------------------------------------------
    // ACTIONS
    // -------------------------------------------------------
    async function register() {
        try {
            if (!signer) return alert('Please connect your wallet');
            const contractWithSigner = contract.connect(signer);
            const tx = await contractWithSigner.register({ value: ethers.utils.parseEther(stakeAmount) });
            await tx.wait();
            alert("Registered");
            loadValidators();
        } catch (err) {
            alert(err.message);
        }
    }

    async function topUp() {
        try {
            if (!signer) return alert('Please connect your wallet');
            const contractWithSigner = contract.connect(signer);
            const tx = await contractWithSigner.topUp({ value: ethers.utils.parseEther(topUpAmount) });
            await tx.wait();
            alert("Top-up complete");
            loadValidators();
        } catch (err) {
            alert(err.message);
        }
    }

    async function deactivate() {
        try {
            if (!signer) return alert('Please connect your wallet');
            const contractWithSigner = contract.connect(signer);
            const tx = await contractWithSigner.requestDeactivate();
            await tx.wait();
            alert("Deactivation requested");
            loadValidators();
        } catch (err) {
            alert(err.message);
        }
    }

    async function withdraw() {
        try {
            if (!signer) return alert('Please connect your wallet');

            // Find current validator entry
            const me = account && validators.find(v => v.address.toLowerCase() === account.toLowerCase());
            if (!me) return alert('You are not a registered validator');
            if (me.active) return alert("Can't withdraw before Deactivate");
            const now = Math.floor(Date.now() / 1000);
            if (me.withdrawAt && Number(me.withdrawAt) > now) return alert(`Can't withdraw before unlock (${countdown(me.withdrawAt)})`);

            // Ask user for amount (leave empty to withdraw all)
            const ans = prompt("Enter amount to withdraw in ETH (leave empty to withdraw all):");
            const contractWithSigner = contract.connect(signer);

            // Debug logging: list available callable functions (helps diagnose ABI/signature issues)
            try {
                console.log('Validator contract address:', contractWithSigner.address);
                console.log('Available functions:', Object.keys(contractWithSigner.functions || {}));
                console.log('Interface methods:\n', contractWithSigner.interface.format('full').join('\n'));
            } catch (dbgErr) {
                console.warn('Failed to log contract interface:', dbgErr);
            }

            // Robust withdraw: prefer friendly calls, fall back to fully-qualified signatures if needed
            let tx;
            if (!ans || ans.trim() === "") {
                // full withdraw
                if (typeof contractWithSigner.withdraw === 'function') {
                    tx = await contractWithSigner.withdraw();
                } else if (contractWithSigner['withdraw()']) {
                    tx = await contractWithSigner['withdraw()']();
                } else {
                    throw new Error('withdraw() method not found on contract');
                }
            } else {
                // partial withdraw
                const amt = ethers.utils.parseEther(ans.trim());
                if (typeof contractWithSigner.withdraw === 'function') {
                    tx = await contractWithSigner.withdraw(amt);
                } else if (contractWithSigner['withdraw(uint256)']) {
                    tx = await contractWithSigner['withdraw(uint256)'](amt);
                } else {
                    throw new Error('withdraw(uint256) method not found on contract');
                }
            }
            await tx.wait();
            alert("Withdrawn");
            loadValidators();
        } catch (err) {
            alert(err && err.message ? err.message : err);
        }
    }

    function slashPrompt(addr) {
        const amt = prompt("Enter slash amount (this only records the request):");
        if (!amt) return;
        alert("Demo: run slash_interactive.js to actually slash on-chain.");
    }

    // refresh withdraw timers
    useEffect(() => {
        const t = setInterval(() => setValidators((v) => [...v]), 1000);
        return () => clearInterval(t);
    }, []);

    // Poll slash history every 8 seconds so UI stays fresh
    useEffect(() => {
        fetchSlashHistory();
        const id = setInterval(fetchSlashHistory, 8000);
        return () => clearInterval(id);
    }, [contract]);

    // -------------------------------------------------------
    // UI
    // -------------------------------------------------------
    return (
        <div style={S.container}>
            {/* CONTROLS */}
            <div style={S.card}>
                <div style={S.header}>Validator Dashboard</div>
                <div style={S.small}>Connected: {account || "Not connected"}</div>

                <div style={S.row}>
                    <input style={S.input} value={stakeAmount} onChange={(e) => setStakeAmount(e.target.value)} />
                    <button style={{ ...S.button, background: "#16a34a", color: "white" }} onClick={register}>Stake & Register</button>

                    <button style={{ ...S.button, background: "#f59e0b", color: "white" }} onClick={deactivate}>Deactivate</button>

                    <button style={{ ...S.button, background: "#0ea5e9", color: "white" }} onClick={withdraw}>Withdraw</button>
                </div>

                <div style={S.small}>Withdraw unlock = 10 seconds after deactivation.</div>
            </div>

            {/* VALIDATOR TABLE */}
            <div style={S.card}>
                <div style={S.header}>Validators ({validators.length})</div>

                {loading ? (
                    <div>Loading...</div>
                ) : (
                    <table style={S.table}>
                        <thead>
                            <tr>
                                <th style={S.th}>Address</th>
                                <th style={S.th}>Stake</th>
                                <th style={S.th}>Active</th>
                                <th style={S.th}>Withdraw</th>
                                <th style={S.th}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {validators.map(v => {
                                const now = Math.floor(Date.now() / 1000);
                                const msg = v.withdrawAt <= now ? "Available" : countdown(v.withdrawAt);

                                return (
                                    <tr key={v.address}>
                                        <td style={S.td}>{v.address}</td>
                                        <td style={S.td}>{v.stake}</td>
                                        <td style={S.td}>{v.active ? "Yes" : "No"}</td>
                                        <td style={S.td}>{v.withdrawAt ? msg : "-"}</td>
                                        <td style={S.td}>
                                            <input style={{ ...S.input, width: 80 }} value={topUpAmount} onChange={(e) => setTopUpAmount(e.target.value)} />

                                            <button style={{ ...S.button, background: "#6366f1", color: "white", marginLeft: 6 }} onClick={topUp}>Top-up</button>

                                            <button style={{ ...S.button, background: "#dc2626", color: "white", marginLeft: 6 }} onClick={() => slashPrompt(v.address)}>Slash</button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>

            {/* SLASH HISTORY */}
            <div style={S.card}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={S.header}>Slash History</div>
                    <button style={{ ...S.button, background: '#64748b', color: 'white' }} onClick={fetchSlashHistory}>Refresh</button>
                </div>

                {slashes.length === 0 ? (
                    <div style={S.small}>No slashes yet.</div>
                ) : (
                    <table style={S.table}>
                        <thead>
                            <tr>
                                <th style={S.th}>Validator</th>
                                <th style={S.th}>Amount</th>
                                <th style={S.th}>Time</th>
                            </tr>
                        </thead>
                        <tbody>
                            {slashes.map((s, i) => {
                                let amt = s.amount;
                                try { amt = ethers.utils.formatEther(amt.toString()); } catch { amt = s.amount; }
                                const t = s.slashed_at ? new Date(s.slashed_at).toLocaleString() : "-";
                                return (
                                    <tr key={i}>
                                        <td style={S.td}>{s.who}</td>
                                        <td style={S.td}>{amt}</td>
                                        <td style={S.td}>{t}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}

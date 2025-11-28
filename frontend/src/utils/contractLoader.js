// import { ethers } from "ethers";
// import addresses from "../abi/addresses.json";
// import IntentRegistryABI from "../abi/IntentRegistry.json";
// import TreasuryABI from "../abi/Treasury.json";

// // -------------------------------------------------
// // PROVIDER + SIGNER
// // -------------------------------------------------
// let provider;
// let signer;

// if (window.ethereum) {
//     provider = new ethers.providers.Web3Provider(window.ethereum);
//     signer = provider.getSigner();
// } else {
//     provider = new ethers.providers.JsonRpcProvider("http://127.0.0.1:8545");
//     signer = provider.getSigner(0);
// }

// // -------------------------------------------------
// // CONTRACT INSTANCES
// // -------------------------------------------------
// export const intentContract = new ethers.Contract(
//     addresses.intent,
//     IntentRegistryABI.abi,
//     provider
// );

// export const treasuryContract = new ethers.Contract(
//     addresses.treasury,
//     TreasuryABI.abi,
//     provider
// );

// // -------------------------------------------------
// // 1️⃣ FIXED SIGNING (CORRECT EIP-712 FORMAT)
// // -------------------------------------------------
// export async function signIntentMeta(amountEth) {
//     await provider.send("eth_requestAccounts", []);

//     const user = (await signer.getAddress()).toLowerCase();
//     const nonce = Number(await intentContract.nonces(user));
//     const { chainId } = await provider.getNetwork();

//     console.log("🟦 FRONTEND SIGNING INFO:");
//     console.log("User:", user);
//     console.log("Nonce:", nonce);
//     console.log("ChainId:", chainId);
//     console.log("Verifier:", addresses.intent);

//     // MUST match Solidity EIP712 domain
//     const domain = {
//         name: "IntentRegistry",
//         version: "1",
//         chainId,
//         verifyingContract: addresses.intent
//     };

//     const types = {
//         Intent: [
//             { name: "user", type: "address" },
//             { name: "fromToken", type: "address" },
//             { name: "toToken", type: "address" },
//             { name: "amount", type: "uint256" },
//             { name: "chainTo", type: "uint256" },
//             { name: "expiry", type: "uint256" },
//             { name: "nonce", type: "uint256" }
//         ]
//     };

//     const amountWei = ethers.utils.parseEther(String(amountEth));
//     const expiry = Math.floor(Date.now() / 1000) + 3600;

//     const value = {
//         user,
//         fromToken: ethers.constants.AddressZero,
//         toToken: ethers.constants.AddressZero,
//         amount: amountWei.toString(),
//         chainTo: 1,
//         expiry,
//         nonce
//     };

//     console.log("🟦 SIGNING VALUE:", value);

//     const signature = await signer._signTypedData(domain, types, value);

//     console.log("🟦 SIGNATURE:", signature);

//     return { ...value, signature };
// }

// // -------------------------------------------------
// // 2️⃣ RELAYER CALL  (CORS-SAFE)
// // -------------------------------------------------
// export async function sendToRelayer(payload) {
//     const RELAYER_URL = "http://127.0.0.1:4000/relay_submit";

//     console.log("🟧 Sending to relayer:", RELAYER_URL);
//     console.log("🟧 Payload:", payload);

//     const res = await fetch(RELAYER_URL, {
//         method: "POST",
//         mode: "cors",                      // important fix
//         headers: {
//             "Content-Type": "application/json",
//         },
//         body: JSON.stringify(payload)
//     });

//     let json;
//     try {
//         json = await res.json();
//     } catch (e) {
//         console.error("❌ Failed to parse JSON:", e);
//         throw new Error("Invalid relayer JSON response");
//     }

//     if (!res.ok) {
//         console.error("❌ Relayer Error Response:", json);
//         throw new Error(json.error || "Relayer failed");
//     }

//     console.log("✅ Relayer OK:", json);
//     return json; // → { txHash }
// }

// // -------------------------------------------------
// // 3️⃣ LOAD INTENTS
// // -------------------------------------------------
// export async function loadIntents() {
//     try {
//         const last = Number(await intentContract.nextId());
//         const list = [];

//         for (let i = 0; i < last; i++) {
//             const it = await intentContract.intents(i);
//             if (it.user === ethers.constants.AddressZero) continue;

//             list.push({
//                 id: i,
//                 user: it.user,
//                 amount: it.amount.toString(),
//                 settled: it.settled
//             });
//         }
//         return list;

//     } catch (err) {
//         console.error("loadIntents error:", err);
//         return [];
//     }
// }

// // -------------------------------------------------
// // 4️⃣ TREASURY
// // -------------------------------------------------
// export async function getTreasuryBalance() {
//     try {
//         const bal = await treasuryContract.totalFees();
//         return bal.toString();
//     } catch (err) {
//         console.error("Treasury read error:", err);
//         return "0";
//     }
// }




import { ethers } from "ethers";
import addresses from "../abi/addresses.json";
import IntentRegistryABI from "../abi/IntentRegistry.json";
import TreasuryABI from "../abi/Treasury.json";

// PROVIDER + SIGNER
let provider, signer;

if (window.ethereum) {
    provider = new ethers.providers.Web3Provider(window.ethereum);
    signer = provider.getSigner();
} else {
    provider = new ethers.providers.JsonRpcProvider("http://127.0.0.1:8545");
    signer = provider.getSigner(0);
}

// CONTRACTS
export const intentContract = new ethers.Contract(
    addresses.intent,
    IntentRegistryABI.abi,
    provider
);

export const treasuryContract = new ethers.Contract(
    addresses.treasury,
    TreasuryABI.abi,
    provider
);

// -------------------------------------------------------
// 1️⃣ SIGN INTENT (EIP-712 FIXED)
// -------------------------------------------------------
export async function signIntentMeta(amountEth) {
    await provider.send("eth_requestAccounts", []);

    const user = (await signer.getAddress()).toLowerCase();
    const nonce = Number(await intentContract.nonces(user));
    const { chainId } = await provider.getNetwork();

    const domain = {
        name: "IntentRegistry",
        version: "1",
        chainId,
        verifyingContract: addresses.intent
    };

    const types = {
        Intent: [
            { name: "user", type: "address" },
            { name: "fromToken", type: "address" },
            { name: "toToken", type: "address" },
            { name: "amount", type: "uint256" },
            { name: "chainTo", type: "uint256" },
            { name: "expiry", type: "uint256" },
            { name: "nonce", type: "uint256" }
        ]
    };

    const amountWei = ethers.utils.parseEther(String(amountEth));
    const expiry = Math.floor(Date.now() / 1000) + 3600; // 1 hour

    const value = {
        user,
        fromToken: ethers.constants.AddressZero,
        toToken: ethers.constants.AddressZero,
        amount: amountWei.toString(),
        chainTo: 1,
        expiry,
        nonce
    };

    const signature = await signer._signTypedData(domain, types, value);

    return {
        ...value,
        signature,
        fee: ethers.utils.parseEther("0.001").toString()
    };
}

// -------------------------------------------------------
// 2️⃣ RELAYER CALL
// -------------------------------------------------------
export async function sendToRelayer(payload) {
    const RELAYER_URL = "http://127.0.0.1:4000/relay_submit";

    const res = await fetch(RELAYER_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    });

    const json = await res.json();

    if (!res.ok) throw new Error(json.error);

    return json; // txHash
}

// -------------------------------------------------------
export async function loadIntents() {
    try {
        const total = Number(await intentContract.nextId());
        const arr = [];

        for (let i = 0; i < total; i++) {
            const it = await intentContract.intents(i);
            if (it.user !== ethers.constants.AddressZero) {
                arr.push({ id: i, ...it });
            }
        }

        return arr;
    } catch (e) {
        console.error("loadIntents error:", e);
        return [];
    }
}

export async function getTreasuryBalance() {
    try {
        const bal = await treasuryContract.totalFees();
        return bal.toString();
    } catch (e) {
        return "0";
    }
}

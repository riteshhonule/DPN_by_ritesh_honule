// frontend/src/utils/validatorLoader.js

import { ethers } from "ethers";
import addresses from "../abi/addresses.json";
import ValidatorRegistryABI from "../abi/ValidatorRegistry.json";
import StakingManagerABI from "../abi/StakingManager.json";
import SlashControllerABI from "../abi/SlashController.json";

// ------------------------------------------------------------------
// 🔌 WALLET + PROVIDER
// ------------------------------------------------------------------
let provider;
let signer;

if (window.ethereum) {
  provider = new ethers.providers.Web3Provider(window.ethereum);
  signer = provider.getSigner();
} else {
  provider = new ethers.providers.JsonRpcProvider("http://127.0.0.1:8545");
  signer = provider.getSigner(0);
}

// ------------------------------------------------------------------
// 📄 CONTRACT INSTANCES
// ------------------------------------------------------------------
export const validatorContract = new ethers.Contract(
  addresses.validatorRegistry,
  ValidatorRegistryABI.abi,
  provider
);

export const stakingManager = new ethers.Contract(
  addresses.stakingManager,
  StakingManagerABI.abi,
  provider
);

export const slashController = new ethers.Contract(
  addresses.slashController,
  SlashControllerABI.abi,
  provider
);

// ------------------------------------------------------------------
// 🟩 1. REGISTER VALIDATOR (STAKE)
// ------------------------------------------------------------------
export async function registerValidator(amountEth) {
  await provider.send("eth_requestAccounts", []);

  const contractWithSigner = validatorContract.connect(signer);

  const tx = await contractWithSigner.register({
    value: ethers.utils.parseEther(amountEth),
    gasLimit: 300000,
  });

  const receipt = await tx.wait();
  return receipt.transactionHash;
}

// ------------------------------------------------------------------
// 🟩 2. TOP-UP STAKE
// ------------------------------------------------------------------
export async function topUpStake(amountEth) {
  await provider.send("eth_requestAccounts", []);

  const contractWithSigner = validatorContract.connect(signer);

  const tx = await contractWithSigner.topUp({
    value: ethers.utils.parseEther(amountEth),
    gasLimit: 300000,
  });

  const receipt = await tx.wait();
  return receipt.transactionHash;
}

// ------------------------------------------------------------------
// 🟩 3. REQUEST DEACTIVATE (start withdraw timer)
// ------------------------------------------------------------------
export async function deactivateValidator() {
  await provider.send("eth_requestAccounts", []);
  const contractWithSigner = validatorContract.connect(signer);

  const tx = await contractWithSigner.requestDeactivate({
    gasLimit: 200000,
  });

  const receipt = await tx.wait();
  return receipt.transactionHash;
}

// ------------------------------------------------------------------
// 🟩 4. WITHDRAW AFTER DEACTIVATION DELAY
// ------------------------------------------------------------------
export async function withdrawStake(amountEth = null) {
  await provider.send("eth_requestAccounts", []);
  const contractWithSigner = validatorContract.connect(signer);

  let tx;
  if (!amountEth) {
    tx = await contractWithSigner.withdraw({ gasLimit: 200000 });
  } else {
    tx = await contractWithSigner.withdraw(ethers.utils.parseEther(amountEth), { gasLimit: 200000 });
  }

  const receipt = await tx.wait();
  return receipt.transactionHash;
}

// ------------------------------------------------------------------
// 🟥 5. ADMIN-ONLY: SLASH VALIDATOR
// ------------------------------------------------------------------
export async function slashValidator(who, amountEth) {
  await provider.send("eth_requestAccounts", []);
  const controller = slashController.connect(signer);

  const tx = await controller.slash(
    who,
    ethers.utils.parseEther(amountEth),
    {
      gasLimit: 500000,
    }
  );

  const receipt = await tx.wait();
  return receipt.transactionHash;
}

// ------------------------------------------------------------------
// 📍 6. VIEW: LOAD ALL VALIDATORS
// ------------------------------------------------------------------
export async function loadValidators() {
  try {
    const validators = await validatorContract.listValidators();
    const result = [];

    for (let addr of validators) {
      const v = await validatorContract.getValidator(addr);

      result.push({
        address: addr,
        owner: v.owner,
        stake: v.stake.toString(),
        active: v.active,
        withdrawAvailableAt: v.withdrawAvailableAt.toString(),
      });
    }

    return result;
  } catch (err) {
    console.error("loadValidators error:", err);
    return [];
  }
}

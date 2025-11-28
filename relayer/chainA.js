module.exports = {
  executeOnChainA: (intentId) => {
    console.log(`(Chain A) Executed settlement for intent ${intentId}`);
    return true;
  }
};

module.exports = {
  executeOnChainB: (intentId) => {
    console.log(`(Chain B) Funds delivered for intent ${intentId}`);
    return true;
  }
};

const dex = require("../pricing/dexPrice");
const bridge = require("../pricing/bridgePrice");

module.exports = {
  findBestRoute: (intent) => {
    const dexPrice = dex.getDexPrice(
      intent.fromToken,
      intent.toToken,
      intent.amount
    );

    const bridgeFee = bridge.getBridgeFee(1, intent.chainTo);

    return {
      totalOutput: dexPrice.output - bridgeFee,
      route: dexPrice.route,
      fees: bridgeFee,
    };
  },
};

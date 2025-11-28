module.exports = {
  getDexPrice: (tokenIn, tokenOut, amount) => {
    // mock price for demo
    return {
      route: "UniswapV2",
      output: amount * 0.98, // 2% slippage simulation
    };
  },
};

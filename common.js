var coins = new Array(N_COINS);
var swap;
var swap_token;
var ERC20Contract;
var balances = new Array(N_COINS);
var wallet_balances = new Array(N_COINS);

const trade_timeout = 600;
const max_allowance = 1e9 * 1e18;


/**************************************************/
// Convenient way to promisify web3
// See https://ethereum.stackexchange.com/a/24238
const promisify = (inner) =>
  new Promise((resolve, reject) =>
    inner((err, res) => {
      if (err) { reject(err) }

      resolve(res);
    })
  );

const proxiedWeb3Handler = {
  // override getter
  get: (target, name) => {
    const inner = target[name];
    if (inner instanceof Function) {
      // Return a function with the callback already set.
      return (...args) => promisify(cb => inner(...args, cb));
    } else if (typeof inner === 'object') {
      // wrap inner web3 stuff
      return new Proxy(inner, proxiedWeb3Handler);
    } else {
      return inner;
    }
  },
};

const w3 = new Proxy(web3, proxiedWeb3Handler);
/**************************************************/

async function ensure_allowance() {
    // Coins to trade
    for (let i = 0; i < N_COINS; i++)
        if ((await coins[i].allowance(web3.eth.defaultAccount, swap_address)).toNumber() < wallet_balances[i])
            await coins[i].approve(swap_address, max_allowance);

    // Coin which represents a share in liquidity pool
    if ((await swap_token.allowance(web3.eth.defaultAccount, swap_address)).toNumber() == 0)
        await swap_token.approve(swap_address, max_allowance);
}

async function init_contracts() {
    var SwapContract = web3.eth.contract(swap_abi);
    ERC20Contract = web3.eth.contract(ERC20_abi);

    swap = new Proxy(SwapContract.at(swap_address), proxiedWeb3Handler);
    swap_token = new Proxy(ERC20Contract.at(token_address), proxiedWeb3Handler);

    for (let i = 0; i < N_COINS; i++) {
        var addr = await swap.coins(i);
        coins[i] = new Proxy(ERC20Contract.at(addr), proxiedWeb3Handler);
    }
}

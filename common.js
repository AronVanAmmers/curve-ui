var coins = new Array(N_COINS);
var underlying_coins = new Array(N_COINS);
var swap;
var swap_token;
var ERC20Contract;
var balances = new Array(N_COINS);
var wallet_balances = new Array(N_COINS);
var c_rates = new Array(N_COINS);
var fee;
var admin_fee;

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

function waitForReceipt(hash, cb) {
    web3.eth.getTransactionReceipt(hash, function (err, receipt) {
        if (err)
            throw(err);

        if (receipt !== null)
        {
            if (cb)
                cb(null, receipt);
        }
        else
        {
            setTimeout(function () {waitForReceipt(hash, cb)}, 1000);
        }
  });
}

var w3;
/**************************************************/

async function ensure_allowance() {
    for (let i = 0; i < N_COINS; i++)
        if ((await coins[i].allowance(web3.eth.defaultAccount, swap_address)).toNumber() < wallet_balances[i])
            await coins[i].approve(swap_address, max_allowance);
    // TODO: ensure the amounts we actually need, not max
}

async function ensure_token_allowance() {
    if ((await swap_token.allowance(web3.eth.defaultAccount, swap_address)).toNumber() == 0)
        await swap_token.approve(swap_address, max_allowance);
}


async function init_contracts() {
    web3.eth.waitForReceipt = waitForReceipt;
    w3 = new Proxy(web3, proxiedWeb3Handler);

    var SwapContract = web3.eth.contract(swap_abi);
    ERC20Contract = web3.eth.contract(ERC20_abi);
    cERC20Contract = web3.eth.contract(cERC20_abi);

    swap = new Proxy(SwapContract.at(swap_address), proxiedWeb3Handler);
    swap_token = new Proxy(ERC20Contract.at(token_address), proxiedWeb3Handler);

    for (let i = 0; i < N_COINS; i++) {
        var addr = await swap.coins(i);
        coins[i] = new Proxy(cERC20Contract.at(addr), proxiedWeb3Handler);
        underlying_coins[i] = new Proxy(ERC20Contract.at(underlying_addrs[i]), proxiedWeb3Handler);
    }
}

function init_menu() {
    $("div.top-menu-bar a").toArray().forEach(function(el) {
        if (el.href == window.location.href)
            el.classList.add('selected')
    })
}

async function update_rates() {
    for (let i = 0; i < N_COINS; i++)
        c_rates[i] = (await coins[i].exchangeRateStored()).toNumber() / 1e18 / coin_precisions[i];
}

async function update_fee_info() {
    var bal_info = $('#balances-info li span');
    await update_rates();
    for (let i = 0; i < N_COINS; i++) {
        balances[i] = (await swap.balances(i)).toNumber();
        $(bal_info[i]).text((balances[i] * c_rates[i]).toFixed(2));
    }
    fee = (await swap.fee()).toNumber() / 1e10;
    admin_fee = (await swap.admin_fee()).toNumber() / 1e10;
    $('#fee-info').text((fee * 100).toFixed(3));
    $('#admin-fee-info').text((admin_fee * 100).toFixed(3));
}

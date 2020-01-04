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

const trade_timeout = 1800;
const max_allowance = 1e9 * 1e18;


/**************************************************/
// Convenient way to promisify web3
// See https://ethereum.stackexchange.com/a/24238
/*
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
*/
/**************************************************/

async function ensure_allowance() {
    var default_account = (await web3.eth.getAccounts())[0];
    for (let i = 0; i < N_COINS; i++)
        if (parseInt(await coins[i].methods.allowance(default_account, swap_address).call()) < wallet_balances[i])
            coins[i].methods.approve(swap_address, BigInt(max_allowance).toString()).send({'from': default_account});
    // TODO: ensure the amounts we actually need, not max
}

async function ensure_underlying_allowance(i, _amount) {
    var default_account = (await web3.eth.getAccounts())[0];
    if (_amount == 0)
        var amount = max_allowance
    else
        var amount = _amount;
    if (parseInt(await underlying_coins[i].methods.allowance(default_account, swap_address).call()) < amount)
        await underlying_coins[i].methods.approve(swap_address, BigInt(amount).toString()).send({'from': default_account});
}

async function ensure_token_allowance() {
    var default_account = (await web3.eth.getAccounts())[0];
    if (parseInt(await swap_token.methods.allowance(default_account, swap_address).call()) == 0)
        await swap_token.methods.approve(swap_address, BigInt(max_allowance).toString()).send({'from': default_account});
    // TODO: ensure the amounts we actually need, not max
}


async function init_contracts() {
    swap = new web3.eth.Contract(swap_abi, swap_address);
    swap_token = new web3.eth.Contract(ERC20_abi, token_address);

    for (let i = 0; i < N_COINS; i++) {
        var addr = await swap.methods.coins(i).call();
        coins[i] = new web3.eth.Contract(cERC20_abi, addr);
        var underlying_addr = await swap.methods.underlying_coins(i).call();
        underlying_coins[i] = new web3.eth.Contract(ERC20_abi, underlying_addr);
    }
}

function init_menu() {
    $("div.top-menu-bar a").toArray().forEach(function(el) {
        if (el.href == window.location.href)
            el.classList.add('selected')
    })
}

async function update_rates() {
    for (let i = 0; i < N_COINS; i++) {
        /*
        rate: uint256 = cERC20(self.coins[i]).exchangeRateStored()
        supply_rate: uint256 = cERC20(self.coins[i]).supplyRatePerBlock()
        old_block: uint256 = cERC20(self.coins[i]).accrualBlockNumber()
        rate += rate * supply_rate * (block.number - old_block) / 10 ** 18
        */
        var rate = parseInt(await coins[i].methods.exchangeRateStored().call()) / 1e18 / coin_precisions[i];
        var supply_rate = parseInt(await coins[i].methods.supplyRatePerBlock().call());
        var old_block = parseInt(await coins[i].methods.accrualBlockNumber().call());
        var block = await web3.eth.getBlockNumber();
        c_rates[i] = rate * (1 + supply_rate * (block - old_block) / 1e18);
    }
}

async function update_fee_info() {
    var bal_info = $('#balances-info li span');
    await update_rates();
    for (let i = 0; i < N_COINS; i++) {
        balances[i] = parseInt(await swap.methods.balances(i).call());
        $(bal_info[i]).text((balances[i] * c_rates[i]).toFixed(2));
    }
    fee = parseInt(await swap.methods.fee().call()) / 1e10;
    admin_fee = parseInt(await swap.methods.admin_fee().call()) / 1e10;
    $('#fee-info').text((fee * 100).toFixed(3));
    $('#admin-fee-info').text((admin_fee * 100).toFixed(3));
}

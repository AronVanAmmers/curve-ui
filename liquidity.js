var swap;
var swap_token;
var ERC20Contract;
var sync_balances;
var balances = new Array(N_COINS);
var wallet_balances = new Array(N_COINS);
const trade_timeout = 600;
const max_allowance = 1e9 * 1e18;


// XXXXXXXXXXXXXXXXXXXXX
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
// XXXXXXXXXXXXXXXXXXXXX

async function ensure_allowance() {
    // Coins to trade
    for (let i = 0; i < N_COINS; i++)
        if ((await coins[i].allowance(web3.eth.defaultAccount, swap_address)).toNumber() == 0)
            await coins[i].approve(swap_address, max_allowance);

    // Coin which represents a share in liquidity pool
    if ((await swap_token.allowance(web3.eth.defaultAccount, swap_address)).toNumber() == 0)
        await swap_token.approve(swap_address, max_allowance);
}

async function handle_add_liquidity() {
    var amounts = $("[id^=currency_]").toArray().map(x => $(x).val());
    amounts = amounts.map(x => x * 1e18);
    var deadline = Math.floor((new Date()).getTime() / 1000) + trade_timeout;
    await ensure_allowance();
    await swap.add_liquidity(amounts, deadline);
}

async function handle_remove_liquidity() {
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

    $("#add-liquidity").click(handle_add_liquidity);
    $("#remove-liquidity").click(handle_remove_liquidity);
}

async function handle_sync_balances() {
    sync_balances = $('#sync-balances').prop('checked');
    var max_balances = $('#max-balances').prop('checked');

    for (let i = 0; i < N_COINS; i++)
        wallet_balances[i] = (await coins[i].balanceOf(web3.eth.defaultAccount)).toNumber();

    if (max_balances) {
        $(".currencies input").prop('disabled', true);
        for (let i = 0; i < N_COINS; i++) {
            var val = (wallet_balances[i] / 1e18).toFixed(2);
            $('#currency_' + i).val(val);
        }
    } else {
        $(".currencies input").prop('disabled', false);
    }

    for (let i = 0; i < N_COINS; i++)
        balances[i] = (await swap.balances(i)).toNumber();
}

function init_ui() {
    for (let i = 0; i < N_COINS; i++) {
        $('#currency_' + i).on('input', function() {
            var el = $('#currency_' + i);
            if (this.value * 1e18 > wallet_balances[i])
                el.css('background-color', 'red')
            else
                el.css('background-color', 'blue');

            if (sync_balances) {
                for (let j = 0; j < N_COINS; j++)
                    if (j != i) {
                        if (balances[i] > 1e18) {
                                var newval = this.value * balances[j] / balances[i];
                                newval = newval.toFixed(10);
                                $('#currency_' + j).val(newval);

                        } else {
                            $('#currency_' + j).val(this.value);
                        }

                        el = $('#currency_' + j);
                        if (newval * 1e18 > wallet_balances[j])
                            el.css('background-color', 'red')
                        else
                            el.css('background-color', 'blue');
                    }
            }
        });
    }

    $('#sync-balances').change(handle_sync_balances);
    $('#max-balances').change(handle_sync_balances);
}

window.addEventListener('load', async () => {
    if (window.ethereum) {
        window.web3 = new Web3(ethereum);
        await ethereum.enable();
        await init_contracts();
        init_ui();
        await handle_sync_balances();
    }
});

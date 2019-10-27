var swap;
var swap_token;
var ERC20Contract;
var sync_balances;
var balances = new Array(N_COINS);


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


function set_amount(i, el_id) {
    coins[i].balanceOf(web3.eth.accounts[0], (err, value) => {
        var out = (value / 1e18).toFixed(18);
        $(el_id).val(out);
    });
}

function handle_add_liquidity() {
}

function handle_remove_liquidity() {
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

function handle_sync_balances() {
    sync_balances = $('#sync-balances').prop('checked');
    var max_balances = $('#max-balances').prop('checked');

    if (max_balances) {
        $(".currencies input").prop('disabled', true);
        for (let i = 0; i < N_COINS; i++) {
            coins[i].balanceOf(web3.eth.accounts[0], (err, val) => {
                var out = (val / 1e18).toFixed(2);
                $('#currency_' + i).val(out);
            })
        }
    } else {
        $(".currencies input").prop('disabled', false);
    }

    for (let i = 0; i < N_COINS; i++) {
        swap.balances(i, (err, val) => {
            balances[i] = val.c[0];  // WHY not just val?? Idk
        })
    }
}

function init_ui() {
    for (i = 0; i < N_COINS; i++) {
        $('#currency_' + i).on('input', function() {
            if (sync_balances) {
                for (j = 0; j < N_COINS; j++) {
                    if (balances[i] > 1e18) {
                        if (j != i) {
                            console.log(j, this.value, balances[j]);
                        }
                    } else {
                        $('#currency_' + j).val(this.value);
                    }
                }
            }
        });
    }

    $('#sync-balances').change(handle_sync_balances);
    $('#max-balances').change(handle_sync_balances);
    handle_sync_balances();
}

window.addEventListener('load', async () => {
    if (window.ethereum) {
        window.web3 = new Web3(ethereum);
        try {
            await ethereum.enable();
            init_contracts();
            init_ui();
            handle_sync_balances();
        } catch (error) {
            // Well shit
        }
    }
});

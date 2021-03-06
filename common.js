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
const max_allowance = BigInt(2) ** BigInt(256) - BigInt(1);

async function ensure_allowance() {
    var default_account = (await web3.eth.getAccounts())[0];
    var promises = new Array(N_COINS);
    for (let i=0; i < N_COINS; i++)
        if (parseInt(await coins[i].methods.allowance(default_account, swap_address).call()) < wallet_balances[i])
            promises[i] = new Promise(resolve => {
                coins[i].methods.approve(swap_address, max_allowance.toString())
                .send({'from': default_account})
                .once('transactionHash', function(hash) {resolve(true);});
            });
    for (let i=0; i < N_COINS; i++)
        await promises[i];
}

async function ensure_underlying_allowance(i, _amount) {
    var default_account = (await web3.eth.getAccounts())[0];
    var amount = BigInt(_amount);
    var current_allowance = BigInt(await underlying_coins[i].methods.allowance(default_account, swap_address).call());

    if (current_allowance == amount)
        return false;

    if ((_amount == max_allowance) & (current_allowance > max_allowance / BigInt(2)))
        return false;  // It does get spent slowly, but that's ok

    if (current_allowance != 0)
        await new Promise(resolve => {
            underlying_coins[i].methods.approve(swap_address, 0)
            .send({'from': default_account})
            .once('transactionHash', function(hash) {resolve(true);});
        });

    return new Promise(resolve => {
        underlying_coins[i].methods.approve(swap_address, amount.toString())
        .send({'from': default_account})
        .once('transactionHash', function(hash) {resolve(true);});
    })
}

// XXX not needed anymore
// Keeping for old withdraw, to be removed whenever the chance is
async function ensure_token_allowance() {
    var default_account = (await web3.eth.getAccounts())[0];
    if (parseInt(await swap_token.methods.allowance(default_account, swap_address).call()) == 0)
        return new Promise(resolve => {
            swap_token.methods.approve(swap_address, BigInt(max_allowance).toString())
            .send({'from': default_account})
            .once('transactionHash', function(hash) {resolve(true);});
        })
    else
        return false;
}


async function init_contracts() {
    web3.eth.net.getId((err, result) => {
        if (result == 1) {
            if (web3.currentProvider.constructor.name == 's') {
                $('#error-window').text('Error: please use Metamask to do transactions');
                $('#error-window').show();
            }
            else
                $('#error-window').hide();
        }
        else
        {
            $('#error-window').text('Error: wrong network type. Please switch to mainnet');
            $('#error-window').show();
        }
    });

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
    var total = 0;
    for (let i = 0; i < N_COINS; i++) {
        balances[i] = parseInt(await swap.methods.balances(i).call());
        $(bal_info[i]).text((balances[i] * c_rates[i]).toFixed(2));
        total += balances[i] * c_rates[i];
    }
    $(bal_info[N_COINS]).text(total.toFixed(2));
    fee = parseInt(await swap.methods.fee().call()) / 1e10;
    admin_fee = parseInt(await swap.methods.admin_fee().call()) / 1e10;
    $('#fee-info').text((fee * 100).toFixed(3));
    $('#admin-fee-info').text((admin_fee * 100).toFixed(3));

    var default_account = (await web3.eth.getAccounts())[0];
    if (default_account) {
        var token_balance = parseInt(await swap_token.methods.balanceOf(default_account).call());
        if (token_balance > 0) {
            var token_supply = parseInt(await swap_token.methods.totalSupply().call());
            var l_info = $('#lp-info li span');
            total = 0;
            for (let i=0; i < N_COINS; i++) {
                var val = balances[i] * c_rates[i] * token_balance / token_supply;
                total += val;
                $(l_info[i]).text(val.toFixed(2));
            }
            $(l_info[N_COINS]).text(total.toFixed(2));
            $('#lp-info-container').show();
        }
    }
}

var token_balance;
var token_supply;

async function update_balances() {
    for (let i = 0; i < N_COINS; i++)
        wallet_balances[i] = (await coins[i].balanceOf(web3.eth.defaultAccount)).toNumber();
    for (let i = 0; i < N_COINS; i++)
        balances[i] = (await swap.balances(i)).toNumber();
    token_balance = (await swap_token.balanceOf(web3.eth.defaultAccount)).toNumber();
    token_supply = (await swap_token.totalSupply()).toNumber();
}

function handle_change_amounts(i) {
    return function() {
        for (let j = 0; j < N_COINS; j++) {
            var cur = $('#currency_' + j);
            if ((this.value * 1e18 > wallet_balances[i]) & (j == i))
                cur.css('background-color', 'red')
            else
                cur.css('background-color', 'blue');
            cur.css('color', 'aqua');
        }
        var share = $('#liquidity-share');
        share.val('---');
        share.css('background-color', '#707070');
        share.css('color', '#d0d0d0');
    }
}

function handle_change_share() {
    var share = $('#liquidity-share');
    var val = share.val();

    share.css('background-color', 'blue');
    share.css('color', 'aqua');
    if (val == '---') {
        share.val('0.0');
        val = 0;
    }
    else if ((val > 100) | (val < 0))
        share.css('background-color', 'red');

    for (let i = 0; i < N_COINS; i++) {
        var cur = $('#currency_' + i);
        if ((val >=0) & (val <= 100))
            cur.val((val / 100 * balances[i] * token_balance / token_supply / 1e18).toFixed(2))
        else
            cur.val('0.00');
        cur.css('background-color', '#707070');
        cur.css('color', '#d0d0d0');
    }
}

async function handle_remove_liquidity() {
    var share = $('#liquidity-share');
    var share_val = share.val();
    var deadline = Math.floor((new Date()).getTime() / 1000) + trade_timeout;
    var amounts = $("[id^=currency_]").toArray().map(x => $(x).val() * 1e18);
    var min_amounts = amounts.map(x => (0.97 * x).toFixed());
    var txhash;
    ensure_token_allowance();
    if (share_val == '---') {
        txhash = await swap.remove_liquidity_imbalance(amounts, deadline);
    }
    else {
        var amount = (share_val / 100 * token_balance).toFixed();
        txhash = await swap.remove_liquidity(amount, deadline, min_amounts);
    }
    await w3.eth.waitForReceipt(txhash);

    await update_balances();
    update_fee_info();
}

function init_ui() {
    for (let i = 0; i < N_COINS; i++) {
        $('#currency_' + i).focus(handle_change_amounts(i));
        $('#currency_' + i).on('input', handle_change_amounts(i));
    }
    $('#liquidity-share').focus(handle_change_share);
    $('#liquidity-share').on('input', handle_change_share);

    handle_change_share();
    update_fee_info();

    $("#remove-liquidity").click(handle_remove_liquidity);
}

window.addEventListener('load', async () => {
    init_menu();

    if (window.ethereum) {
        window.web3 = new Web3(ethereum);
        await ethereum.enable();
        await init_contracts();
        await update_balances();
        init_ui();
    }
});

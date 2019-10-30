async function handle_remove_liquidity() {
}

async function update_balances() {
    for (let i = 0; i < N_COINS; i++)
        wallet_balances[i] = (await coins[i].balanceOf(web3.eth.defaultAccount)).toNumber();
    for (let i = 0; i < N_COINS; i++)
        balances[i] = (await swap.balances(i)).toNumber();
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
        share.css('background-color', 'gray');
        share.css('color', '#505050');
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
        cur.val('0.0');
        cur.css('background-color', 'gray');
        cur.css('color', '#505050');
    }
}

function init_ui() {
    for (let i = 0; i < N_COINS; i++) {
        $('#currency_' + i).focus(handle_change_amounts(i));
        $('#currency_' + i).on('input', handle_change_amounts(i));
    }
    $('#liquidity-share').focus(handle_change_share);
    $('#liquidity-share').on('input', handle_change_share);

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

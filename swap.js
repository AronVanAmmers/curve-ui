var from_currency;
var to_currency;

async function set_from_amount(i) {
    var el = $('#from_currency');
    if (el.val() == '')
        $('#from_currency').val(
            Math.floor(
                100 * (await underlying_coins[i].balanceOf(web3.eth.defaultAccount)).toNumber() / coin_precisions[i]
            ) / 100
        );
}

async function highlight_input() {
    var el = $('#from_currency');
    var balance = (await underlying_coins[from_currency].balanceOf(web3.eth.defaultAccount)).toNumber() / coin_precisions[from_currency];
    if (el.val() > balance)
        el.css('background-color', 'red')
    else
        el.css('background-color', 'blue');
}

async function set_to_amount() {
    var i = from_currency;
    var j = to_currency;
    var b = (await swap.balances(i)).toNumber() * c_rates[i];
    if (b >= 0.001) {
        // In c-units
        var dx = Math.floor($('#from_currency').val() * coin_precisions[i]);
        var dy = ((await swap.get_dy_underlying(i, j, dx)).toNumber() / coin_precisions[j]).toFixed(2);
        $('#to_currency').val(dy);
    }
    else
        $('#from_currency').prop('disabled', true);
    highlight_input();
}

async function from_cur_handler() {
    from_currency = $('input[type=radio][name=from_cur]:checked').val();
    to_currency = $('input[type=radio][name=to_cur]:checked').val();
    await set_from_amount(from_currency);
    if (to_currency == from_currency) {
        if (from_currency == 0) {
            to_currency = 1;
        } else {
            to_currency = 0;
        }
        $("#to_cur_" + to_currency).prop('checked', true);
    }
    await set_to_amount();
}

async function to_cur_handler() {
    from_currency = $('input[type=radio][name=from_cur]:checked').val();
    to_currency = $('input[type=radio][name=to_cur]:checked').val();
    if (to_currency == from_currency) {
        if (to_currency == 0) {
            from_currency = 1;
        } else {
            from_currency = 0;
        }
        $("#from_cur_" + from_currency).prop('checked', true);
        await set_from_amount(from_currency);
    }
    await set_to_amount();
}

async function handle_trade() {
    var i = from_currency;
    var j = to_currency;
    var b = (await swap.balances(i)).toNumber() / c_rates[i];
    if (b >= 0.001) {
        var dx = Math.floor($('#from_currency').val() * coin_precisions[i]);
        var min_dy = Math.floor($('#to_currency').val() * 0.95 * coin_precisions[j]);
        var deadline = Math.floor((new Date()).getTime() / 1000) + trade_timeout;
        await ensure_underlying_allowance(i, dx);
        var txhash = await swap.exchange_underlying(i, j, dx, min_dy, deadline);
        await w3.eth.waitForReceipt(txhash);
        await update_fee_info();
        from_cur_handler();
    }
}

async function init_ui() {
    $('input[type=radio][name=from_cur]').change(from_cur_handler);
    $('input[type=radio][name=to_cur]').change(to_cur_handler);

    $("#from_cur_0").attr('checked', true);
    $("#to_cur_1").attr('checked', true);

    $('#from_currency').on('input', set_to_amount);
    $('#from_currency').click(function() {this.select()});

    $("#trade").click(handle_trade);

    await update_fee_info();
    from_cur_handler();
    $("#from_currency").on("input", highlight_input);
}

window.addEventListener('load', async () => {
    init_menu();

    if (window.ethereum) {
        window.web3 = new Web3(ethereum);
        await ethereum.enable();
        await init_contracts();
        await init_ui();
    }
});

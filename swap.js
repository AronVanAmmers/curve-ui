var from_currency;
var to_currency;

async function set_from_amount(i) {
    var el = $('#from_currency');
    if (el.val() == '')
        $('#from_currency').val(
            ((await coins[i].balanceOf(web3.eth.defaultAccount)).toNumber() / 1e18
            ).toFixed(18)
        );
}

async function set_to_amount() {
    var i = from_currency;
    var j = to_currency;
    var b = (await swap.balances(i)).toNumber();
    if (b >= 1e8) {
        var dx = $('#from_currency').val() * 1e18;
        var dy = ((await swap.get_dy(i, j, dx)).toNumber() / 1e18).toFixed(18);
        $('#to_currency').val(dy);
    }
    else
        $('#from_currency').prop('disabled', true);
}

async function from_cur_handler() {
    from_currency = $('input[type=radio][name=from_cur]:checked').val();
    to_currency = $('input[type=radio][name=to_cur]:checked').val();
    set_from_amount(from_currency);
    if (to_currency == from_currency) {
        if (from_currency == 0) {
            to_currency = 1;
        } else {
            to_currency = 0;
        }
        $("#to_cur_" + to_currency).prop('checked', true);
    }
    set_to_amount();
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
        set_from_amount(from_currency);
    }
    set_to_amount();
}

async function handle_trade() {
    var i = from_currency;
    var j = to_currency;
    var b = (await swap.balances(i)).toNumber();
    if (b >= 1e8) {
        var dx = Math.floor($('#from_currency').val() * 1e18);
        var min_dy = Math.floor($('#to_currency').val() * 0.95e18);
        var deadline = Math.floor((new Date()).getTime() / 1000) + trade_timeout;

        await swap.exchange(i, j, dx, min_dy, deadline);
    }
    update_fee_info();
}

async function init_ui() {
    $('input[type=radio][name=from_cur]').change(from_cur_handler);
    $('input[type=radio][name=to_cur]').change(to_cur_handler);

    $("#from_cur_0").attr('checked', true);
    $("#to_cur_1").attr('checked', true);

    $('#from_currency').on('input', set_to_amount);
    $('#from_currency').click(function() {this.select()});

    $("#trade").click(handle_trade);

    from_cur_handler();
    update_fee_info();
}

window.addEventListener('load', async () => {
    init_menu();
    init_chart();

    if (window.ethereum) {
        window.web3 = new Web3(ethereum);
        await ethereum.enable();
        await init_contracts();
        await init_ui();
    }
});

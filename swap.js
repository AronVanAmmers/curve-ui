var from_currency;
var to_currency;

async function set_amount(css_id, i) {
    $(css_id).val(((await coins[i].balanceOf(web3.eth.defaultAccount)).toNumber() / 1e18).toFixed(2));
}

async function from_cur_handler() {
    from_currency = $('input[type=radio][name=from_cur]:checked').val();
    to_currency = $('input[type=radio][name=to_cur]:checked').val();
    set_amount('#from_currency', from_currency);
    if (to_currency == from_currency) {
        if (from_currency == 0) {
            to_currency = 1;
        } else {
            to_currency = 0;
        }
        $("#to_cur_" + to_currency).prop('checked', true);
    }
    set_amount('#to_currency', to_currency);
}

async function to_cur_handler() {
    from_currency = $('input[type=radio][name=from_cur]:checked').val();
    to_currency = $('input[type=radio][name=to_cur]:checked').val();
    set_amount('#to_currency', to_currency);
    if (to_currency == from_currency) {
        if (to_currency == 0) {
            from_currency = 1;
        } else {
            from_currency = 0;
        }
        $("#from_cur_" + from_currency).prop('checked', true);
    }
    set_amount('#from_currency', from_currency);
}

async function init_ui() {
    $('input[type=radio][name=from_cur]').change(from_cur_handler);
    $('input[type=radio][name=to_cur]').change(to_cur_handler);

    $("#from_cur_0").attr('checked', true);
    $("#to_cur_1").attr('checked', true);

    await from_cur_handler();
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

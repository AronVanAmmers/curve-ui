var swap;
var swap_token;
var ERC20Contract;
var from_currency;
var to_currency

function set_amount(i, el_id) {
    coins[i].balanceOf(web3.eth.accounts[0], (err, value) => {
        var out = (value / 1e18).toFixed(18);
        $(el_id).val(out);
    });
}

function init_contracts() {
    var SwapContract = web3.eth.contract(swap_abi);
    ERC20Contract = web3.eth.contract(ERC20_abi);

    swap = SwapContract.at(swap_address);
    swap_token = ERC20Contract.at(token_address);

    for (let i = 0; i < N_COINS; i++) {
        swap.coins(i, (err, addr) => {
            coins[i] = ERC20Contract.at(addr);
            if (i == 0) {
                from_currency = 0;
                set_amount(0, "#from_currency");
            }
            if (i == 1) {
                to_currency = 1;
                set_amount(1, "#to_currency");
            }
        });
    }
}

function init_ui() {
    $('input[type=radio][name=from_cur]').change(function() {
        from_currency = this.value;
        set_amount(this.value, "#from_currency");
        if (to_currency == from_currency) {
            if (from_currency == 0) {
                to_currency = 1;
            } else {
                to_currency = 0;
            }
            $("#to_cur_" + to_currency).prop('checked', true);
            set_amount(to_currency, "#to_currency");
        }
    });
    $('input[type=radio][name=to_cur]').change(function() {
        to_currency = this.value;
        set_amount(this.value, "#to_currency");
        if (to_currency == from_currency) {
            if (to_currency == 0) {
                from_currency = 1;
            } else {
                from_currency = 0;
            }
            $("#from_cur_" + from_currency).prop('checked', true);
            set_amount(from_currency, "#from_currency");
        }
    });

    $("#from_cur_0").attr('checked', true);
    $("#to_cur_1").attr('checked', true);
}

window.addEventListener('load', async () => {
    init_menu();

    if (window.ethereum) {
        window.web3 = new Web3(ethereum);
        await ethereum.enable();
        await init_contracts();
        init_ui();
    }
});

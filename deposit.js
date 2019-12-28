var sync_balances;

async function handle_sync_balances() {
    sync_balances = $('#sync-balances').prop('checked');
    var max_balances = $('#max-balances').prop('checked');

    await update_rates();

    for (let i = 0; i < N_COINS; i++)
        wallet_balances[i] = (await coins[i].balanceOf(web3.eth.defaultAccount)).toNumber();

    if (max_balances) {
        $(".currencies input").prop('disabled', true);
        for (let i = 0; i < N_COINS; i++) {
            var val = (wallet_balances[i] * c_rates[i]).toFixed(2);
            $('#currency_' + i).val(val);
        }
    } else {
        $(".currencies input").prop('disabled', false);
    }

    for (let i = 0; i < N_COINS; i++)
        balances[i] = (await swap.balances(i)).toNumber();
}

async function handle_add_liquidity() {
    var amounts = $("[id^=currency_]").toArray().map(x => $(x).val());
    for (let i = 0; i < N_COINS; i++)
        amounts[i] = Math.floor(amounts[i] / c_rates[i]); // -> c-tokens
    await ensure_allowance();
    var deadline = Math.floor((new Date()).getTime() / 1000) + trade_timeout;
    var txhash = await swap.add_liquidity(amounts, deadline);
    await w3.eth.waitForReceipt(txhash);
    await handle_sync_balances();
    update_fee_info();
}

function init_ui() {
    for (let i = 0; i < N_COINS; i++) {
        $('#currency_' + i).on('input', function() {
            var el = $('#currency_' + i);
            if (this.value > wallet_balances[i] * c_rates[i])
                el.css('background-color', 'red')
            else
                el.css('background-color', 'blue');

            if (sync_balances) {
                for (let j = 0; j < N_COINS; j++)
                    if (j != i) {
                        var el_j = $('#currency_' + j);

                        if (balances[i] * c_rates[i] > 1) {
                            // proportional
                            var newval = this.value / c_rates[i] * balances[j] / balances[i];
                            newval = (newval * c_rates[j]).toFixed(2);
                            el_j.val(newval);

                        } else {
                            // same value as we type
                            var newval = this.value;
                            el_j.val(newval);
                        }

                        // Balance not enough highlight
                        if (newval > wallet_balances[j] * c_rates[j])
                            el_j.css('background-color', 'red')
                        else
                            el_j.css('background-color', 'blue');
                    }
            }
        });
    }

    $('#sync-balances').change(handle_sync_balances);
    $('#max-balances').change(handle_sync_balances);
    $("#add-liquidity").click(handle_add_liquidity);
}

window.addEventListener('load', async () => {
    init_menu();

    if (window.ethereum) {
        window.web3 = new Web3(ethereum);
        await ethereum.enable();
        await init_contracts();
        init_ui();
        update_fee_info();
        await handle_sync_balances();
    }
});

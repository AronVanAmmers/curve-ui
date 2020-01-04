var sync_balances;

async function handle_sync_balances() {
    sync_balances = $('#sync-balances').prop('checked');
    var max_balances = $('#max-balances').prop('checked');
    var default_account = (await web3.eth.getAccounts())[0];

    await update_rates();

    for (let i = 0; i < N_COINS; i++)
        wallet_balances[i] = parseInt(await coins[i].methods.balanceOf(default_account).call());

    if (max_balances) {
        $(".currencies input").prop('disabled', true);
        for (let i = 0; i < N_COINS; i++) {
            var val = Math.floor(wallet_balances[i] * c_rates[i] * 100) / 100;
            $('#currency_' + i).val(val);
        }
    } else {
        $(".currencies input").prop('disabled', false);
    }

    for (let i = 0; i < N_COINS; i++)
        balances[i] = parseInt(await swap.methods.balances(i).call());
}

async function handle_add_liquidity() {
    var default_account = (await web3.eth.getAccounts())[0];
    var amounts = $("[id^=currency_]").toArray().map(x => $(x).val());
    for (let i = 0; i < N_COINS; i++)
        amounts[i] = BigInt(Math.floor(amounts[i] / c_rates[i])).toString(); // -> c-tokens
    await ensure_allowance();
    var deadline = Math.floor((new Date()).getTime() / 1000) + trade_timeout;
    await swap.methods.add_liquidity(amounts, deadline).send({'from': default_account});
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
                            newval = Math.floor(newval * c_rates[j] * 100) / 100;
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

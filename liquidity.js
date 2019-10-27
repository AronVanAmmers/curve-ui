var sync_balances;

async function handle_add_liquidity() {
    var amounts = $("[id^=currency_]").toArray().map(x => $(x).val());
    amounts = amounts.map(x => x * 1e18);
    var deadline = Math.floor((new Date()).getTime() / 1000) + trade_timeout;
    await ensure_allowance();
    await swap.add_liquidity(amounts, deadline);
}

async function handle_remove_liquidity() {
}

async function handle_sync_balances() {
    sync_balances = $('#sync-balances').prop('checked');
    var max_balances = $('#max-balances').prop('checked');

    for (let i = 0; i < N_COINS; i++)
        wallet_balances[i] = (await coins[i].balanceOf(web3.eth.defaultAccount)).toNumber();

    if (max_balances) {
        $(".currencies input").prop('disabled', true);
        for (let i = 0; i < N_COINS; i++) {
            var val = (wallet_balances[i] / 1e18).toFixed(2);
            $('#currency_' + i).val(val);
        }
    } else {
        $(".currencies input").prop('disabled', false);
    }

    for (let i = 0; i < N_COINS; i++)
        balances[i] = (await swap.balances(i)).toNumber();
}

function init_ui() {
    init_menu();

    for (let i = 0; i < N_COINS; i++) {
        $('#currency_' + i).on('input', function() {
            var el = $('#currency_' + i);
            if (this.value * 1e18 > wallet_balances[i])
                el.css('background-color', 'red')
            else
                el.css('background-color', 'blue');

            if (sync_balances) {
                for (let j = 0; j < N_COINS; j++)
                    if (j != i) {
                        if (balances[i] > 1e18) {
                                var newval = this.value * balances[j] / balances[i];
                                newval = newval.toFixed(10);
                                $('#currency_' + j).val(newval);

                        } else {
                            $('#currency_' + j).val(this.value);
                        }

                        el = $('#currency_' + j);
                        if (newval * 1e18 > wallet_balances[j])
                            el.css('background-color', 'red')
                        else
                            el.css('background-color', 'blue');
                    }
            }
        });
    }

    $('#sync-balances').change(handle_sync_balances);
    $('#max-balances').change(handle_sync_balances);
    $("#add-liquidity").click(handle_add_liquidity);
    $("#remove-liquidity").click(handle_remove_liquidity);
}

window.addEventListener('load', async () => {
    if (window.ethereum) {
        window.web3 = new Web3(ethereum);
        await ethereum.enable();
        await init_contracts();
        init_ui();
        await handle_sync_balances();
    }
});

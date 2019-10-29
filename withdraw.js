async function handle_remove_liquidity() {
}

async function update_balances() {
    for (let i = 0; i < N_COINS; i++)
        wallet_balances[i] = (await coins[i].balanceOf(web3.eth.defaultAccount)).toNumber();
    for (let i = 0; i < N_COINS; i++)
        balances[i] = (await swap.balances(i)).toNumber();
}

function init_ui() {
    for (let i = 0; i < N_COINS; i++)
        $('#currency_' + i).on('input', function() {
            var el = $('#currency_' + i);
            if (this.value * 1e18 > wallet_balances[i])
                el.css('background-color', 'red')
            else
                el.css('background-color', 'blue');
        });

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

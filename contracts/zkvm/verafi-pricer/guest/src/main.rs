#![no_main]

use risc0_zkvm::guest::env;

risc0_zkvm::guest::entry!(main);

fn compute_price(spot: u64, strike: u64, is_call: u8) -> u64 {
    if is_call == 1 {
        spot.saturating_sub(strike)
    } else {
        strike.saturating_sub(spot)
    }
}

fn compute_is_itm(spot: u64, strike: u64, is_call: u8) -> u8 {
    if is_call == 1 {
        (spot > strike) as u8
    } else {
        (spot < strike) as u8
    }
}

pub fn main() {
    let spot: u64 = env::read();
    let strike: u64 = env::read();
    let vol: u32 = env::read();
    let _risk_free_rate: u64 = env::read();
    let expiry: u64 = env::read();
    let is_call: u8 = env::read();

    let price = compute_price(spot, strike, is_call);
    let is_itm = compute_is_itm(spot, strike, is_call);

    env::commit(&spot);
    env::commit(&strike);
    env::commit(&vol);
    env::commit(&expiry);
    env::commit(&is_call);
    env::commit(&price);
    env::commit(&is_itm);
}

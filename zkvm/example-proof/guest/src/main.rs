use risc0_zkvm::guest::env;

// VeraFi Black-Scholes zkVM guest
//
// Journal layout (38 bytes, little-endian):
//   [0..8]  spot     u64  6-decimal fixed-point (e.g. 1_400_000 = $1.40)
//   [8..16] strike   u64  6-decimal fixed-point (e.g. 1_150_000 = $1.15)
//  [16..20] vol      u32  basis points           (e.g.    4_300 = 43%)
//  [20..28] expiry   u64  seconds                (e.g. 2_592_000 = 30 days)
//      [28] is_call  u8   1 = CALL, 0 = PUT
//  [29..37] price    u64  6-decimal fixed-point  (Black-Scholes output)
//      [37] is_itm   u8   1 = in the money, 0 = out of the money
fn main() {
    let spot: u64 = env::read();
    let strike: u64 = env::read();
    let vol: u32 = env::read();
    let rate: u64 = env::read();
    let expiry: u64 = env::read();
    let is_call: u8 = env::read();

    let s = spot as f64 / 1_000_000.0;
    let k = strike as f64 / 1_000_000.0;
    let sigma = vol as f64 / 10_000.0;
    let r = rate as f64 / 10_000.0;
    let t = expiry as f64 / 31_536_000.0; // seconds → years

    let price_f64 = black_scholes(s, k, r, sigma, t, is_call != 0);
    let price = (price_f64 * 1_000_000.0).round() as u64;

    let is_itm: u8 = if is_call != 0 {
        if s > k { 1 } else { 0 }
    } else {
        if k > s { 1 } else { 0 }
    };

    // Commit journal — 38 bytes total, order and types must match Wasm verifier
    env::commit_slice(&spot.to_le_bytes());
    env::commit_slice(&strike.to_le_bytes());
    env::commit_slice(&vol.to_le_bytes());
    env::commit_slice(&expiry.to_le_bytes());
    env::commit_slice(&[is_call]);
    env::commit_slice(&price.to_le_bytes());
    env::commit_slice(&[is_itm]);
}

fn black_scholes(s: f64, k: f64, r: f64, sigma: f64, t: f64, is_call: bool) -> f64 {
    if t <= 0.0 {
        return if is_call { (s - k).max(0.0) } else { (k - s).max(0.0) };
    }
    let sqrt_t = t.sqrt();
    let d1 = ((s / k).ln() + (r + 0.5 * sigma * sigma) * t) / (sigma * sqrt_t);
    let d2 = d1 - sigma * sqrt_t;
    if is_call {
        s * ncdf(d1) - k * (-r * t).exp() * ncdf(d2)
    } else {
        k * (-r * t).exp() * ncdf(-d2) - s * ncdf(-d1)
    }
}

// Standard normal CDF via complementary error function (Abramowitz & Stegun 7.1.26)
fn ncdf(x: f64) -> f64 {
    0.5 * erfc(-x * core::f64::consts::FRAC_1_SQRT_2)
}

fn erfc(x: f64) -> f64 {
    if x < 0.0 {
        return 2.0 - erfc(-x);
    }
    let t = 1.0 / (1.0 + 0.3275911 * x);
    let poly = t * (0.254829592
        + t * (-0.284496736
            + t * (1.421413741
                + t * (-1.453152027
                    + t * 1.061405429))));
    poly * (-x * x).exp()
}

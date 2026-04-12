use anyhow::Result;
use clap::Parser;
use risc0_verifier_xrpl_wasm::risc0::encode_seal;
use risc0_zkvm::{default_prover, ExecutorEnv, ProverOpts};
use serde_json::json;
use verafi_pricer_builder::{VERAFI_PRICER_ELF, VERAFI_PRICER_ID};

#[derive(Parser)]
#[command(about = "Run the VeraFi pricer guest and emit journal/seal memo payloads")]
struct Args {
    spot: u64,
    strike: u64,
    vol: u32,
    risk_free_rate: u64,
    expiry: u64,
    is_call: u8,
}

fn main() -> Result<()> {
    let args = Args::parse();

    println!("RISC0 Image ID: {}", hex::encode(bytemuck::cast_slice(&VERAFI_PRICER_ID)));

    let env = ExecutorEnv::builder()
        .write(&args.spot)?
        .write(&args.strike)?
        .write(&args.vol)?
        .write(&args.risk_free_rate)?
        .write(&args.expiry)?
        .write(&args.is_call)?
        .build()?;

    let receipt = default_prover()
        .prove_with_opts(env, VERAFI_PRICER_ELF, &ProverOpts::groth16())?
        .receipt;

    let journal = receipt.journal.bytes.as_slice().to_vec();
    let seal = encode_seal(&receipt)?;

    println!("journal: {}", hex::encode(&journal));
    println!("seal: {}", hex::encode(&seal));
    println!("memos:\n{}", json!([
      { "Memo": { "MemoData": hex::encode(&journal) } },
      { "Memo": { "MemoData": hex::encode(&seal) } }
    ]));

    Ok(())
}

use anyhow::{Context, Result};
use clap::Parser;
use example_proof_builder::{EXAMPLE_PROOF_ELF, EXAMPLE_PROOF_ID};
use risc0_verifier_xrpl_wasm::risc0::encode_seal;
use risc0_zkvm::{ExecutorEnv, ProverOpts, default_prover};
use serde_json::json;

#[derive(Parser)]
#[command(about = "Prove that two numbers are prime and commit their product")]
struct Args {
    /// First prime number
    a: u32,
    /// Second prime number
    b: u32,
}

fn main() -> Result<()> {
    let args = Args::parse();

    let env = ExecutorEnv::builder()
        .write(&args.a)?
        .write(&args.b)?
        .build()?;

    println!(
        "RISC0 Image ID: {}",
        hex::encode(bytemuck::cast_slice(&EXAMPLE_PROOF_ID))
    );

    println!("Proving {} * {} = {} ...", args.a, args.b, args.a * args.b);
    println!(
        "This may take a long time on the first run if it needs to retrieve a docker image for Groth16 compression"
    );

    let receipt = default_prover()
        .prove_with_opts(env, EXAMPLE_PROOF_ELF, &ProverOpts::groth16())
        .context("proving failed (are both inputs prime?)")?
        .receipt;

    let journal = receipt.journal.bytes.as_slice();
    let seal = encode_seal(&receipt)?;

    println!("journal: {}", hex::encode(journal));
    println!("seal:    {}", hex::encode(&seal));

    let memos = json!([
      {
        "Memo": {
          "MemoData": hex::encode(journal),
        }
      },
      {
        "Memo": {
          "MemoData": hex::encode(&seal),
        }
      },
    ]);

    println!("Memos to include in transaction:\n{}", memos);

    Ok(())
}

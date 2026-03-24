use std::time::Duration;

use anyhow::{Context, Result, anyhow};
use clap::Parser;
use example_proof_builder::{EXAMPLE_PROOF_ELF, EXAMPLE_PROOF_ID};
use risc0_verifier_xrpl_wasm::risc0::encode_seal;
use risc0_zkvm::{ExecutorEnv, ProverOpts, default_prover};
use serde_json::json;

#[derive(Clone, clap::ValueEnum)]
enum ProvingMethod {
    Local,
    Boundless,
}

#[derive(Parser)]
#[command(about = "Prove that two numbers are prime and commit their product")]
struct Args {
    /// First prime number
    a: u32,
    /// Second prime number
    b: u32,

    #[arg(long, env, default_value = "local")]
    proving: ProvingMethod,

    /// RPC URL of the XRPL node to use for Boundless Market proving
    #[arg(long, env, default_value = "")]
    rpc_url: Url,

    /// Private key to sign Boundless requests
    #[arg(long, env, default_value = "")]
    signer: PrivateKeySigner,

    /// Storage uploader configuration for Boundless proving
    /// This configures where the ELF and inputs are posted so provers can find them
    #[command(flatten)]
    storage_config: StorageUploaderConfig,
}

#[tokio::main]
async fn main() -> Result<()> {
    let args = Args::parse();

    println!(
        "RISC0 Image ID: {}",
        hex::encode(bytemuck::cast_slice(&EXAMPLE_PROOF_ID))
    );

    println!("Proving {} * {} = {} ...", args.a, args.b, args.a * args.b);

    let (journal, seal) = match args.proving {
        ProvingMethod::Local => prove_local(args)?,
        ProvingMethod::Boundless => prove_boundless(args).await?,
    };

    println!("journal: {}", hex::encode(&journal));
    println!("seal:    {}", hex::encode(&seal));

    let memos = json!([
      {
        "Memo": {
          "MemoData": hex::encode(&journal),
        }
      },
      {
        "Memo": {
          "MemoData": hex::encode(&seal),
        }
      },
    ]);

    println!("Memos to include in transaction:\n\n{}", memos);

    Ok(())
}

fn prove_local(args: Args) -> anyhow::Result<(Vec<u8>, Vec<u8>)> {
    println!("Proving locally");
    println!(
        "This may take a long time on the first run if it needs to retrieve a docker image for Groth16 compression"
    );

    let env = ExecutorEnv::builder()
        .write(&args.a)?
        .write(&args.b)?
        .build()?;

    let receipt = default_prover()
        .prove_with_opts(env, EXAMPLE_PROOF_ELF, &ProverOpts::groth16())
        .context("proving failed (are both inputs prime?)")?
        .receipt;

    let journal = receipt.journal.bytes.as_slice().to_vec();
    let seal = encode_seal(&receipt)?;
    Ok((journal, seal))
}

use alloy::signers::local::PrivateKeySigner;
use boundless_market::{Client, GuestEnv, StorageUploaderConfig};
use url::Url;

async fn prove_boundless(args: Args) -> anyhow::Result<(Vec<u8>, Vec<u8>)> {
    println!("Proving with Boundless Market");
    let client = Client::builder()
        .with_rpc_url(args.rpc_url)
        .with_private_key(args.signer)
        .with_uploader_config(&args.storage_config)
        .await?
        .build()
        .await?;

    let env = GuestEnv::builder()
        .write(&args.a)?
        .write(&args.b)?
        .build_env();

    // Build the request.
    let request = client
        .new_request()
        .with_program(EXAMPLE_PROOF_ELF.to_vec())
        .with_env(env)
        .with_groth16_proof();

    // Submit the request.
    let (request_id, expires_at) = client.submit(request).await?;

    println!(
        "Submitted request to Boundless http://explorer.boundless.network/orders/0x{}",
        hex::encode(&request_id.to_be_bytes::<32>()[8..])
    );
    println!("Waiting for fulfillment...");
    let fulfillment = client
        .wait_for_request_fulfillment(request_id, Duration::from_secs(10), expires_at)
        .await?;

    println!(
        "FulfillmentData: {:?}, Seal: {:?}",
        fulfillment.data()?,
        fulfillment.seal
    );
    let journal = fulfillment
        .data()?
        .journal()
        .ok_or(anyhow!("No journal in order"))?
        .to_vec();
    let seal = fulfillment.seal[4..].to_vec(); // trim the selector from the start of the seal, since our guest code doesn't expect it

    Ok((journal, seal))
}

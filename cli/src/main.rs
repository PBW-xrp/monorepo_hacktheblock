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
#[command(about = "VeraFi Black-Scholes zkVM prover — outputs journal + seal as hex for XRPL EscrowFinish Memos")]
struct Args {
    /// Spot price (6-decimal fixed-point, e.g. 1400000 = $1.40)
    spot: u64,
    /// Strike price (6-decimal fixed-point, e.g. 1150000 = $1.15)
    strike: u64,
    /// Volatility in basis points (e.g. 4300 = 43%)
    vol: u32,
    /// Risk-free rate in basis points (e.g. 0 = 0%)
    rate: u64,
    /// Time to expiry in seconds (e.g. 2592000 = 30 days)
    expiry: u64,
    /// Option type: 1 = CALL, 0 = PUT
    is_call: u8,

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

    println!(
        "Proving Black-Scholes: spot={} strike={} vol={}bps rate={}bps expiry={}s is_call={}",
        args.spot, args.strike, args.vol, args.rate, args.expiry, args.is_call
    );

    let (journal, seal) = match args.proving {
        ProvingMethod::Local => prove_local(args)?,
        ProvingMethod::Boundless => prove_boundless(args).await?,
    };

    // Decode and display journal fields for verification
    if journal.len() == 38 {
        let price = u64::from_le_bytes(journal[29..37].try_into().unwrap());
        let is_itm = journal[37];
        println!("--- Journal decoded ---");
        println!("  price (6-dec fixed-point): {price}  (= ${:.6})", price as f64 / 1_000_000.0);
        println!("  is_itm: {is_itm}");
    }

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

    println!("Memos to include in EscrowFinish transaction:\n\n{}", memos);

    Ok(())
}

fn prove_local(args: Args) -> anyhow::Result<(Vec<u8>, Vec<u8>)> {
    println!("Proving locally");
    println!(
        "This may take a long time on the first run if it needs to retrieve a docker image for Groth16 compression"
    );

    let env = ExecutorEnv::builder()
        .write(&args.spot)?
        .write(&args.strike)?
        .write(&args.vol)?
        .write(&args.rate)?
        .write(&args.expiry)?
        .write(&args.is_call)?
        .build()?;

    let receipt = default_prover()
        .prove_with_opts(env, EXAMPLE_PROOF_ELF, &ProverOpts::groth16())
        .context("proving failed")?
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
        .write(&args.spot)?
        .write(&args.strike)?
        .write(&args.vol)?
        .write(&args.rate)?
        .write(&args.expiry)?
        .write(&args.is_call)?
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
    let seal = fulfillment.seal[4..].to_vec(); // trim the selector from the start of the seal

    Ok((journal, seal))
}


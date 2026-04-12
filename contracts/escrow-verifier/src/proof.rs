use bytemuck::cast;
use risc0_verifier_xrpl_wasm::{risc0, Proof};
use verafi_pricer_builder::VERAFI_PRICER_ID;

pub const OPTIONS_PRICER_IMAGE_ID_WORDS: [u32; 8] = VERAFI_PRICER_ID;

pub fn options_pricer_image_id_bytes() -> [u8; 32] {
    cast(OPTIONS_PRICER_IMAGE_ID_WORDS)
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ProofError {
    EmptySeal,
    InvalidSeal,
    VerificationFailed,
}

pub fn verify_proof_against_image_id(
    journal_bytes: &[u8],
    seal_bytes: &[u8],
    image_id: &[u8; 32],
) -> Result<bool, ProofError> {
    if seal_bytes.is_empty() {
        return Err(ProofError::EmptySeal);
    }

    let proof = Proof::from_seal_bytes(seal_bytes).map_err(|_| ProofError::InvalidSeal)?;
    let journal_digest = risc0::hash_journal(journal_bytes);
    risc0::verify(&proof, image_id, &journal_digest).map_err(|_| ProofError::VerificationFailed)?;
    Ok(true)
}

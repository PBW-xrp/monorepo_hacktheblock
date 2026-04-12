use crate::layout::{parse_escrow_data_v1, parse_journal_v1, parse_journal_v1_real, release_condition_met};
use crate::proof::{options_pricer_image_id_bytes, verify_proof_against_image_id, ProofError};

pub struct VerificationInputs<'a> {
    pub journal_bytes: &'a [u8],
    pub seal_bytes: &'a [u8],
    pub escrow_data_bytes: &'a [u8],
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum VerificationError {
    InvalidJournal,
    InvalidEscrowData,
    Proof(ProofError),
    ReleaseConditionFailed,
}

pub fn verify_and_check_release(inputs: VerificationInputs<'_>) -> Result<bool, VerificationError> {
    let journal = parse_journal_v1(inputs.journal_bytes).ok_or(VerificationError::InvalidJournal)?;
    let escrow_data =
        parse_escrow_data_v1(inputs.escrow_data_bytes).ok_or(VerificationError::InvalidEscrowData)?;

    let image_id = options_pricer_image_id_bytes();

    verify_proof_against_image_id(
        inputs.journal_bytes,
        inputs.seal_bytes,
        &image_id,
    )
    .map_err(VerificationError::Proof)?;

    if !release_condition_met(&journal, &escrow_data) {
        return Err(VerificationError::ReleaseConditionFailed);
    }

    Ok(true)
}

pub fn verify_with_real_journal_and_placeholder_escrow(
    journal_bytes: &[u8],
    seal_bytes: &[u8],
) -> Result<bool, VerificationError> {
    let journal = parse_journal_v1_real(journal_bytes).ok_or(VerificationError::InvalidJournal)?;

    // Placeholder until on-chain escrow Data extraction is wired.
    let escrow_data_bytes = [
        0x30, 0x8c, 0x11, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x01,
        0x00, 0x8d, 0x27, 0x00, 0x00, 0x00, 0x00, 0x00,
    ];
    let escrow_data = parse_escrow_data_v1(&escrow_data_bytes).ok_or(VerificationError::InvalidEscrowData)?;

    let image_id = options_pricer_image_id_bytes();

    verify_proof_against_image_id(journal_bytes, seal_bytes, &image_id)
        .map_err(VerificationError::Proof)?;

    if !release_condition_met(&journal, &escrow_data) {
        return Err(VerificationError::ReleaseConditionFailed);
    }

    Ok(true)
}

#[cfg(test)]
mod tests {
    use super::*;

    fn journal_fixture() -> [u8; 38] {
        [
            0xc0, 0x5c, 0x15, 0x00, 0x00, 0x00, 0x00, 0x00,
            0x30, 0x8c, 0x11, 0x00, 0x00, 0x00, 0x00, 0x00,
            0xcc, 0x10, 0x00, 0x00,
            0x00, 0x8d, 0x27, 0x00, 0x00, 0x00, 0x00, 0x00,
            0x01,
            0x90, 0xd0, 0x03, 0x00, 0x00, 0x00, 0x00, 0x00,
            0x01,
        ]
    }

    fn escrow_fixture() -> [u8; 17] {
        [
            0x30, 0x8c, 0x11, 0x00, 0x00, 0x00, 0x00, 0x00,
            0x01,
            0x00, 0x8d, 0x27, 0x00, 0x00, 0x00, 0x00, 0x00,
        ]
    }

    #[test]
    fn empty_seal_is_rejected() {
        let result = verify_and_check_release(VerificationInputs {
            journal_bytes: &journal_fixture(),
            seal_bytes: &[],
            escrow_data_bytes: &escrow_fixture(),
        });
        assert!(matches!(result, Err(VerificationError::Proof(ProofError::EmptySeal))));
    }
}

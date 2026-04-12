pub const JOURNAL_V1_LEN: usize = 38;
pub const JOURNAL_V1_REAL_LEN: usize = 44;
pub const ESCROW_DATA_V1_LEN: usize = 17;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct JournalV1 {
    pub spot: u64,
    pub strike: u64,
    pub vol: u32,
    pub expiry: u64,
    pub is_call: u8,
    pub price: u64,
    pub is_itm: u8,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct EscrowDataV1 {
    pub strike: u64,
    pub is_call: u8,
    pub expiry: u64,
}

fn read_u64_le(bytes: &[u8]) -> u64 {
    let mut arr = [0u8; 8];
    arr.copy_from_slice(bytes);
    u64::from_le_bytes(arr)
}

fn read_u32_le(bytes: &[u8]) -> u32 {
    let mut arr = [0u8; 4];
    arr.copy_from_slice(bytes);
    u32::from_le_bytes(arr)
}

pub fn parse_journal_v1(bytes: &[u8]) -> Option<JournalV1> {
    if bytes.len() != JOURNAL_V1_LEN {
        return None;
    }

    Some(JournalV1 {
        spot: read_u64_le(&bytes[0..8]),
        strike: read_u64_le(&bytes[8..16]),
        vol: read_u32_le(&bytes[16..20]),
        expiry: read_u64_le(&bytes[20..28]),
        is_call: bytes[28],
        price: read_u64_le(&bytes[29..37]),
        is_itm: bytes[37],
    })
}

pub fn parse_journal_v1_real(bytes: &[u8]) -> Option<JournalV1> {
    if bytes.len() != JOURNAL_V1_REAL_LEN {
        return None;
    }

    let is_call_u32 = read_u32_le(&bytes[28..32]);
    let is_itm_u32 = read_u32_le(&bytes[40..44]);

    Some(JournalV1 {
        spot: read_u64_le(&bytes[0..8]),
        strike: read_u64_le(&bytes[8..16]),
        vol: read_u32_le(&bytes[16..20]),
        expiry: read_u64_le(&bytes[20..28]),
        is_call: is_call_u32 as u8,
        price: read_u64_le(&bytes[32..40]),
        is_itm: is_itm_u32 as u8,
    })
}

pub fn parse_escrow_data_v1(bytes: &[u8]) -> Option<EscrowDataV1> {
    if bytes.len() != ESCROW_DATA_V1_LEN {
        return None;
    }

    Some(EscrowDataV1 {
        strike: read_u64_le(&bytes[0..8]),
        is_call: bytes[8],
        expiry: read_u64_le(&bytes[9..17]),
    })
}

pub fn agreed_params_match(journal: &JournalV1, escrow_data: &EscrowDataV1) -> bool {
    journal.strike == escrow_data.strike
        && journal.is_call == escrow_data.is_call
        && journal.expiry == escrow_data.expiry
}

pub fn release_condition_met(journal: &JournalV1, escrow_data: &EscrowDataV1) -> bool {
    agreed_params_match(journal, escrow_data) && journal.is_itm == 1
}

#[cfg(test)]
mod tests {
    use super::*;

    fn journal_fixture() -> [u8; JOURNAL_V1_LEN] {
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

    fn journal_real_fixture() -> [u8; JOURNAL_V1_REAL_LEN] {
        [
            0xc0, 0x5c, 0x15, 0x00, 0x00, 0x00, 0x00, 0x00,
            0x30, 0x8c, 0x11, 0x00, 0x00, 0x00, 0x00, 0x00,
            0xcc, 0x10, 0x00, 0x00,
            0x00, 0x8d, 0x27, 0x00, 0x00, 0x00, 0x00, 0x00,
            0x01, 0x00, 0x00, 0x00,
            0x90, 0xd0, 0x03, 0x00, 0x00, 0x00, 0x00, 0x00,
            0x01, 0x00, 0x00, 0x00,
        ]
    }

    fn escrow_fixture() -> [u8; ESCROW_DATA_V1_LEN] {
        [
            0x30, 0x8c, 0x11, 0x00, 0x00, 0x00, 0x00, 0x00,
            0x01,
            0x00, 0x8d, 0x27, 0x00, 0x00, 0x00, 0x00, 0x00,
        ]
    }

    #[test]
    fn parses_journal_fixture() {
        let parsed = parse_journal_v1(&journal_fixture()).expect("journal should parse");
        assert_eq!(parsed.spot, 1_400_000);
        assert_eq!(parsed.strike, 1_150_000);
        assert_eq!(parsed.vol, 4_300);
        assert_eq!(parsed.expiry, 2_592_000);
        assert_eq!(parsed.is_call, 1);
        assert_eq!(parsed.price, 250_000);
        assert_eq!(parsed.is_itm, 1);
    }

    #[test]
    fn parses_real_runtime_journal_fixture() {
        let parsed = parse_journal_v1_real(&journal_real_fixture()).expect("real journal should parse");
        assert_eq!(parsed.spot, 1_400_000);
        assert_eq!(parsed.strike, 1_150_000);
        assert_eq!(parsed.vol, 4_300);
        assert_eq!(parsed.expiry, 2_592_000);
        assert_eq!(parsed.is_call, 1);
        assert_eq!(parsed.price, 250_000);
        assert_eq!(parsed.is_itm, 1);
    }

    #[test]
    fn parses_escrow_fixture() {
        let parsed = parse_escrow_data_v1(&escrow_fixture()).expect("escrow data should parse");
        assert_eq!(parsed.strike, 1_150_000);
        assert_eq!(parsed.is_call, 1);
        assert_eq!(parsed.expiry, 2_592_000);
    }

    #[test]
    fn agreed_params_match_for_fixture() {
        let journal = parse_journal_v1(&journal_fixture()).unwrap();
        let escrow = parse_escrow_data_v1(&escrow_fixture()).unwrap();
        assert!(agreed_params_match(&journal, &escrow));
    }

    #[test]
    fn real_runtime_journal_matches_escrow_fixture() {
        let journal = parse_journal_v1_real(&journal_real_fixture()).unwrap();
        let escrow = parse_escrow_data_v1(&escrow_fixture()).unwrap();
        assert!(agreed_params_match(&journal, &escrow));
        assert!(release_condition_met(&journal, &escrow));
    }

    #[test]
    fn mismatch_fails_cross_check() {
        let journal = parse_journal_v1(&journal_fixture()).unwrap();
        let mut escrow_bytes = escrow_fixture();
        escrow_bytes[8] = 0;
        let escrow = parse_escrow_data_v1(&escrow_bytes).unwrap();
        assert!(!agreed_params_match(&journal, &escrow));
        assert!(!release_condition_met(&journal, &escrow));
    }

    #[test]
    fn not_itm_prevents_release() {
        let mut journal_bytes = journal_fixture();
        journal_bytes[37] = 0;
        let journal = parse_journal_v1(&journal_bytes).unwrap();
        let escrow = parse_escrow_data_v1(&escrow_fixture()).unwrap();
        assert!(agreed_params_match(&journal, &escrow));
        assert!(!release_condition_met(&journal, &escrow));
    }
}

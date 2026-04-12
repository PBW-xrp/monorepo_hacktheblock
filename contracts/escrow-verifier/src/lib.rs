#![cfg_attr(target_arch = "wasm32", no_std)]

#[cfg(not(target_arch = "wasm32"))]
extern crate std;

use xrpl_wasm_stdlib::host::{Error, Result};
use xrpl_wasm_stdlib::{core::locator::Locator, host::get_tx_nested_field, sfield};

pub mod layout;
pub mod proof;
pub mod verifier;

#[unsafe(no_mangle)]
pub extern "C" fn finish() -> i32 {
    let journal = match get_memo::<44>(0) {
        Result::Ok(bytes) => bytes,
        Result::Err(_) => return 0,
    };

    let seal = match get_memo::<256>(1) {
        Result::Ok(bytes) => bytes,
        Result::Err(_) => return 0,
    };

    match verifier::verify_with_real_journal_and_placeholder_escrow(&journal, &seal) {
        core::result::Result::Ok(true) => 1,
        _ => 0,
    }
}

fn get_memo<const LEN: usize>(idx: i32) -> Result<[u8; LEN]> {
    let mut buffer = [0; LEN];
    let mut locator = Locator::new();
    locator.pack(sfield::Memos);
    locator.pack(idx);
    locator.pack(sfield::MemoData);
    let result_code = unsafe {
        get_tx_nested_field(
            locator.as_ptr(),
            locator.num_packed_bytes(),
            buffer.as_mut_ptr(),
            buffer.len(),
        )
    };

    match result_code {
        result_code if result_code > 0 => Result::Ok(buffer),
        0 => Result::Err(Error::InternalError),
        result_code => Result::Err(Error::from_code(result_code)),
    }
}

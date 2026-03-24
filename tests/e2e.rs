use serde_json::json;
use serial_test::serial;
use test_utils::RippledHandle;

use crate::helpers::{build_escrow, create_escrow, finish_escrow};

mod helpers;

#[test]
#[serial]
fn create_and_finish_escrow() -> anyhow::Result<()> {
    let path = build_escrow();

    let handle = RippledHandle::start("./tests/rippled.cfg").expect("Failed to start rippled");

    let (acc_1, secret_1) = handle.new_account()?;
    let (acc_2, secret_2) = handle.new_account()?;

    let id = create_escrow(&handle, &path, &acc_1, &secret_1, &acc_2)?;

    // Use a known good proof for the example
    finish_escrow(
        &handle,
        id,
        &acc_1,
        &acc_2,
        &secret_2,
        Some(json!([
        {
            "Memo": {
              "MemoData": "0000008f"
            }
        },
        {
            "Memo": {
              "MemoData": "1b08c182e2e460ec2fe1b68553966183534a77afe3a69404247c80c597a35dad0e5f8f69f7914e3d0edef32d46b891e6216ace5a57b0e3a181ae1e321bb1b99f241cd71b835aecf1d3ab43e07fc01b551b0941e1b7e13162dd70f0170461c32515b2b8532f799699058b1734b645852aa2b71de91f51c18efd9249ba16709e45114771829265dbf27049556446c42a06566fc53253e48b73d586915a026f11f219bb3c3dc65c21efc99d38f9a848badf43cd56926f16484d223ca0cecccf7fb00c1cc15c6138381f23bcc8ec7ed8a26dd125bef4b10b34ed118fbd7b59042408089058d11584b20078c1c83fd73299856b0d7f36e3bdcd7356811c043c68a846"
            }
        }
        ])),
    )?;

    Ok(())
}

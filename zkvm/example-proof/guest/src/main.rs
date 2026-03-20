// Copyright 2026 Boundless Network.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

use risc0_zkvm::guest::env;

/// This simple guest program can be used to prove that you know the prime factorization
/// of a number without revealing the factors themselves.
///
/// The program takes two numbers as input, checks that they are prime,
/// multiplies them together, and commits the product as the output.
///
/// The journal is the 4 byte big-endian encoding of the product
fn main() {
    let a: u32 = env::read();
    let b: u32 = env::read();

    assert!(is_prime(a), "first input is not prime");
    assert!(is_prime(b), "second input is not prime");

    let product = a.checked_mul(b).expect("multiplication overflow");

    env::commit_slice(&product.to_be_bytes()); // commit to journal
}

fn is_prime(n: u32) -> bool {
    match n {
        0 | 1 => false,
        2 | 3 => true,
        n if n % 2 == 0 || n % 3 == 0 => false,
        n => (5..)
            .step_by(6)
            .take_while(|&i| i <= n / i)
            .all(|i| n % i != 0 && n % (i + 2) != 0),
    }
}

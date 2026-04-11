# VeraFi zkVM — Troubleshooting

## 1. RISC Zero Rust toolchain not found

**Error:**
```
Risc Zero Rust toolchain not found. Try running `rzup install rust`
```

**Cause:** The RISC Zero custom Rust compiler (required to compile guest programs) is not installed.

**Fix:**
```bash
# If rzup is not installed yet:
curl -L https://risczero.com/install | bash
source ~/.bashrc

# Install the Rust toolchain:
rzup install rust
```

---

## 2. `r0vm` not found — slow ImageID / "No such file or directory"

**Error:**
```
Falling back to slow ImageID computation. Updating to the latest r0vm will speed this up.
error: No such file or directory (os error 2)
```

**Cause:** The `r0vm` binary (RISC Zero VM runner) is missing. Installing only `rzup install rust` is not enough.

**Fix:**
```bash
rzup install r0vm
```

Or install all components at once:
```bash
rzup install
```

If `r0vm` is installed but not found, add it to PATH:
```bash
export PATH="$HOME/.risc0/bin:$PATH"
# Add to ~/.bashrc to make permanent
```

---

## 3. `cargo run` — no bin target found

**Error:**
```
error: a bin target must be available for `cargo run`
```

**Cause:** Running `cargo run` from the workspace root instead of from the `cli` package.

**Fix:**
```bash
# Option A — cd into the package first:
cd cli && cargo run -- <args>

# Option B — specify the package from the root:
cargo run -p cli -- <args>
```

---

## 4. First build takes very long (870/888 stalled)

**Symptom:** Build appears stuck at `risc0-circuit-rv32im-sys` or `risc0-circuit-keccak-sys` for 10–20+ minutes.

**Cause:** These crates compile massive auto-generated C++ files into native libraries. This is a one-time cost — subsequent builds use the cached artifacts.

**Fix:** Leave it running. Do not cancel.

---

## Example run command

```bash
cd /mnt/c/Users/PC/Desktop/coding/verafi-zk/cli
cargo run -- 1400000 1150000 4300 0 2592000 1
# spot=$1.40  strike=$1.15  vol=43%  rate=0%  expiry=30d  type=CALL
```

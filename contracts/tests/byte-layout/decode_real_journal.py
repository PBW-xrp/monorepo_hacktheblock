journal_hex = "c05c150000000000308c110000000000cc100000008d2700000000000100000090d003000000000001000000"
raw = bytes.fromhex(journal_hex)
print("len", len(raw))
print("hex_groups")
for i in range(0, len(raw), 4):
    chunk = raw[i:i+4]
    print(i, chunk.hex())

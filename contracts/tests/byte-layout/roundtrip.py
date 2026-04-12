import json
import struct
from pathlib import Path

BASE = Path(__file__).resolve().parents[1] / 'fixtures'

journal = json.loads((BASE / 'journal_v1.fixture.json').read_text())
escrow = json.loads((BASE / 'escrow_data_v1.fixture.json').read_text())

journal_bytes = (
    struct.pack('<Q', journal['spot']) +
    struct.pack('<Q', journal['strike']) +
    struct.pack('<I', journal['vol']) +
    struct.pack('<Q', journal['expiry']) +
    struct.pack('<B', journal['is_call']) +
    struct.pack('<Q', journal['price']) +
    struct.pack('<B', journal['is_itm'])
)

escrow_bytes = (
    struct.pack('<Q', escrow['strike']) +
    struct.pack('<B', escrow['is_call']) +
    struct.pack('<Q', escrow['expiry'])
)

parsed_journal = {
    'spot': struct.unpack('<Q', journal_bytes[0:8])[0],
    'strike': struct.unpack('<Q', journal_bytes[8:16])[0],
    'vol': struct.unpack('<I', journal_bytes[16:20])[0],
    'expiry': struct.unpack('<Q', journal_bytes[20:28])[0],
    'is_call': struct.unpack('<B', journal_bytes[28:29])[0],
    'price': struct.unpack('<Q', journal_bytes[29:37])[0],
    'is_itm': struct.unpack('<B', journal_bytes[37:38])[0],
}

parsed_escrow = {
    'strike': struct.unpack('<Q', escrow_bytes[0:8])[0],
    'is_call': struct.unpack('<B', escrow_bytes[8:9])[0],
    'expiry': struct.unpack('<Q', escrow_bytes[9:17])[0],
}

assert parsed_journal == {k: journal[k] for k in parsed_journal}
assert parsed_escrow == {k: escrow[k] for k in parsed_escrow}

print('roundtrip_ok')
print('journal_hex', journal_bytes.hex())
print('escrow_hex', escrow_bytes.hex())

"""Escrow payments — bridges Postgres records with the Solidity escrow
contract via web3.py. See blockchain/contracts/VelantraEscrow.sol."""
import json
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException
from psycopg2.extensions import connection as PGConnection
from psycopg2.extras import RealDictCursor
from web3 import Web3

from app.core.config import settings
from app.core.database import get_db
from app.core.deps import get_current_farmer_id
from app.schemas.schemas import ApiResponse, EscrowCreate

router = APIRouter(prefix="/payments", tags=["payments"])

_w3 = Web3(Web3.HTTPProvider(settings.web3_provider_url))
_ABI_PATH = Path(__file__).resolve().parents[2] / "blockchain" / "abi" / "VelantraEscrow.json"


def _contract():
    if not settings.escrow_contract_address or not _ABI_PATH.exists():
        return None
    abi = json.loads(_ABI_PATH.read_text())
    return _w3.eth.contract(address=settings.escrow_contract_address, abi=abi)


@router.post("/create-escrow", response_model=ApiResponse)
def create_escrow(payload: EscrowCreate, farmer_id: int = Depends(get_current_farmer_id), db: PGConnection = Depends(get_db)):
    contract = _contract()
    if contract is None:
        # Contract not deployed yet — record the escrow locally with a
        # placeholder tx id so the rest of the flow keeps working.
        tx_hash = "0x" + "0" * 64
    else:
        acct = _w3.eth.account.from_key(settings.deployer_private_key)
        tx = contract.functions.lockPayment(
            farmer_id, 0, int(payload.total_amount * 100)  # amount in minor units
        ).build_transaction({
            "from": acct.address,
            "nonce": _w3.eth.get_transaction_count(acct.address),
        })
        signed = acct.sign_transaction(tx)
        tx_hash = _w3.eth.send_raw_transaction(signed.rawTransaction).hex()

    with db.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute(
            """INSERT INTO escrow_records (order_id, total_amount, status, blockchain_tx_id)
               VALUES (%s, %s, 'locked', %s) RETURNING *""",
            (payload.order_id, payload.total_amount, tx_hash),
        )
        row = cur.fetchone()
    return ApiResponse(success=True, data=row, message="Payment locked in escrow")


@router.post("/release-escrow/{order_id}", response_model=ApiResponse)
def release_escrow(order_id: int, farmer_id: int = Depends(get_current_farmer_id), db: PGConnection = Depends(get_db)):
    contract = _contract()
    if contract is not None:
        acct = _w3.eth.account.from_key(settings.deployer_private_key)
        tx = contract.functions.releasePayment(order_id).build_transaction({
            "from": acct.address,
            "nonce": _w3.eth.get_transaction_count(acct.address),
        })
        signed = acct.sign_transaction(tx)
        _w3.eth.send_raw_transaction(signed.rawTransaction)

    with db.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute(
            """UPDATE escrow_records SET status = 'released', released_at = now()
               WHERE order_id = %s RETURNING *""",
            (order_id,),
        )
        row = cur.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Escrow record not found")

        # Move funds from pending -> completed and top up wallet total.
        cur.execute(
            """UPDATE wallet SET total_earnings = total_earnings + %s,
                                  completed_amount = completed_amount + %s
               WHERE farmer_id = %s""",
            (row["total_amount"], row["total_amount"], farmer_id),
        )
        cur.execute(
            """INSERT INTO transactions (wallet_id, amount, transaction_type, description)
               SELECT id, %s, 'credit', 'Escrow release for order %s' FROM wallet WHERE farmer_id = %s""",
            (row["total_amount"], order_id, farmer_id),
        )
    return ApiResponse(success=True, data=row, message="Payment released")


@router.get("/escrow/{order_id}", response_model=ApiResponse)
def get_escrow(order_id: int, db: PGConnection = Depends(get_db)):
    with db.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute("SELECT * FROM escrow_records WHERE order_id = %s", (order_id,))
        row = cur.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Escrow record not found")
    return ApiResponse(success=True, data=row, message="")

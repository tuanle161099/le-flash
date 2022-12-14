use crate::constant::*;
use anchor_lang::{prelude::*, solana_program::keccak};

#[account]
pub struct Receipt {
    pub authority: Pubkey,
    pub distributor: Pubkey,
    pub recipient: Pubkey,
    pub started_at: i64,
    pub claimed_at: i64,
    pub salt: [u8; 32],
}

impl Receipt {
    pub const LEN: usize = DISCRIMINATOR_SIZE
        + PUBKEY_SIZE
        + PUBKEY_SIZE
        + PUBKEY_SIZE
        + I64_SIZE
        + I64_SIZE
        + U8_SIZE * 32;

    pub fn is_started(&self, current_time: i64) -> bool {
        if self.started_at == 0 {
            return true;
        }
        return self.started_at <= current_time;
    }

    pub fn hash(&self) -> [u8; 32] {
        keccak::hashv(&[
            &self.authority.to_bytes(),
            &self.recipient.to_bytes(),
            &self.started_at.to_le_bytes(),
            &self.salt,
        ])
        .0
    }
}

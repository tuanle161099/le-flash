use crate::constant::*;
use anchor_lang::prelude::*;

#[account]
pub struct Cheque {
    pub authority: Pubkey,
    pub pool: Pubkey,
    pub mint: Pubkey,
    pub locked_date: i64,
    pub unlocked_date: i64,
}

impl Cheque {
    pub const LEN: usize =
        DISCRIMINATOR_SIZE + PUBKEY_SIZE + PUBKEY_SIZE + PUBKEY_SIZE + I64_SIZE + I64_SIZE;
}

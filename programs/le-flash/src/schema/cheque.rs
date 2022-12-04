use crate::constant::*;
use anchor_lang::prelude::*;

#[account]
pub struct Cheque {
    pub authority: Pubkey,
    pub pool: Pubkey,
    pub mint: Pubkey,
    pub amount: u64,
}

impl Cheque {
    pub const LEN: usize = DISCRIMINATOR_SIZE + PUBKEY_SIZE + PUBKEY_SIZE + PUBKEY_SIZE + U64_SIZE;
}

use crate::constant::*;
use anchor_lang::prelude::*;

#[account]
pub struct Pool {
    pub authority: Pubkey,
    pub pool: Pubkey,
    pub mint: Pubkey,
    pub treasury: Pubkey,
    pub mint_lpt: Pubkey,
}

impl Pool {
    pub const LEN: usize =
        DISCRIMINATOR_SIZE + PUBKEY_SIZE + PUBKEY_SIZE + PUBKEY_SIZE + PUBKEY_SIZE + PUBKEY_SIZE;
}

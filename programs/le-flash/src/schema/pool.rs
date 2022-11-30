use crate::constant::*;
use crate::traits::Permission;
use anchor_lang::prelude::*;
use mpl_token_metadata::state::{Metadata, TokenMetadataAccount};

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

impl Permission for Pool {
    fn is_valid_mint_nft(&self, mint_nft: Pubkey, metadata: &AccountInfo) -> bool {
        let metadata: Metadata =
            TokenMetadataAccount::from_account_info(&metadata.to_account_info()).unwrap();
        if self.mint == metadata.collection.unwrap().key && mint_nft == metadata.mint {
            return true;
        }
        return false;
    }
}

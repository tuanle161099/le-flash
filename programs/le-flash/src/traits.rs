use anchor_lang::prelude::*;

///
/// Permission for dao
///
pub trait Permission {
    fn is_valid_mint_nft(&self, mint_nft: Pubkey, metadata: &AccountInfo) -> bool;
}

use anchor_lang::prelude::*;

pub mod constant;
pub mod errors;
pub mod instructions;
pub mod schema;
pub mod traits;
pub mod utils;

pub use constant::*;
pub use errors::*;
pub use instructions::*;
pub use schema::*;

declare_id!("3E8eFwLQhHgtzqAnestzG7SeZUWYH7BZLf8m9EGa8wJH");

#[program]
pub mod le_flash {
    use super::*;

    pub fn initialize_pool(
        ctx: Context<InitializePool>,
        mint: Pubkey,
        treasury: Pubkey,
    ) -> Result<()> {
        initialize_pool::exec(ctx, mint, treasury)
    }

    pub fn deposit(ctx: Context<Deposit>, recipient: Pubkey) -> Result<()> {
        deposit::exec(ctx, recipient)
    }
    pub fn withdraw(ctx: Context<Withdraw>, amount_out: u64) -> Result<()> {
        withdraw::exec(ctx, amount_out)
    }
    pub fn withdraw_nft(ctx: Context<WithdrawNFT>) -> Result<()> {
        withdraw_nft::exec(ctx)
    }
    pub fn close_cheque(ctx: Context<CloseCheque>) -> Result<()> {
        close_cheque::exec(ctx)
    }
}

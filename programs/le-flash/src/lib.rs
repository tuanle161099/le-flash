use anchor_lang::prelude::*;

pub mod schema;
pub use schema::*;

pub mod constant;
pub use constant::*;

pub mod instructions;
pub use instructions::*;

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

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

    pub fn deposit(ctx: Context<Deposit>, amount_int: u64) -> Result<()> {
        deposit::exec(ctx, amount_int)
    }
    pub fn withdraw(ctx: Context<Withdraw>, amount_out: u64) -> Result<()> {
        withdraw::exec(ctx, amount_out)
    }
}

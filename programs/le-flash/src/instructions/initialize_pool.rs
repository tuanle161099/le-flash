use crate::constant::*;
use crate::schema::pool::*;

use anchor_lang::prelude::*;
use anchor_spl::{associated_token, token};

#[event]
pub struct InitializePoolEvent {
    pub authority: Pubkey,
    pub pool: Pubkey,
    pub mint: Pubkey,
    pub treasury: Pubkey,
}

#[derive(Accounts)]

pub struct InitializePool<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    // pool info
    #[account(init, payer = authority, space = Pool::LEN)]
    pub pool: Account<'info, Pool>,

    /// CHECK: Just a pure account
    #[account(seeds =[b"treasurer",&pool.key().to_bytes()],bump)]
    pub treasurer: AccountInfo<'info>,

    // mint_lpt
    #[account(
      init,
      payer = authority,
      mint::decimals = MINT_LPT_DECIMALS,
      mint::authority = treasurer,
      mint::freeze_authority = treasurer
     )]
    pub mint_lpt: Account<'info, token::Mint>,

    #[account(
      init,
      payer = authority,
      associated_token::mint = mint_lpt,
      associated_token::authority = authority
    )]
    pub associated_token_account_lpt: Box<Account<'info, token::TokenAccount>>,

    // programs
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, token::Token>,
    pub associated_token_program: Program<'info, associated_token::AssociatedToken>,
    pub rent: Sysvar<'info, Rent>,
}

pub fn exec(ctx: Context<InitializePool>, mint: Pubkey, treasury: Pubkey) -> Result<()> {
    let pool = &mut ctx.accounts.pool;
    pool.authority = ctx.accounts.authority.key();
    pool.mint = mint;
    pool.mint_lpt = ctx.accounts.mint_lpt.key();
    pool.treasury = treasury;

    emit!(InitializePoolEvent {
        authority: ctx.accounts.authority.key(),
        pool: pool.key(),
        mint: pool.mint.clone(),
        treasury: pool.treasury.clone(),
    });
    Ok(())
}

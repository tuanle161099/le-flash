use crate::schema::pool::*;
use anchor_lang::prelude::*;
use anchor_spl::{associated_token, token};

#[event]
pub struct DepositEvent {
    pub authority: Pubkey,
    pub pool: Pubkey,
    pub mint: Pubkey,
    pub amount_in: u64,
    pub lpt_print_amount: u64,
}

#[derive(Accounts)]
pub struct Deposit<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    // pool info
    #[account(mut, has_one= mint_lpt)]
    pub pool: Account<'info, Pool>,

    /// CHECK: Just a pure account
    #[account(seeds =[b"treasurer",&pool.key().to_bytes()],bump)]
    pub treasurer: AccountInfo<'info>,

    // mint_lpt
    #[account(mut)]
    pub mint_lpt: Account<'info, token::Mint>,

    #[account(
      init_if_needed,
      payer = authority,
      associated_token::mint = mint_lpt,
      associated_token::authority = authority
    )]
    pub associated_token_account_lpt: Box<Account<'info, token::TokenAccount>>,
    // mint
    pub mint: Box<Account<'info, token::Mint>>,
    #[account(
    init_if_needed,
    payer = authority,
    associated_token::mint = mint,
    associated_token::authority = treasurer
  )]
    pub treasury: Box<Account<'info, token::TokenAccount>>,
    #[account(
      mut,
      associated_token::mint = mint,
      associated_token::authority = authority
    )]
    pub src_associated_token_account: Box<Account<'info, token::TokenAccount>>,

    // programs
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, token::Token>,
    pub associated_token_program: Program<'info, associated_token::AssociatedToken>,
    pub rent: Sysvar<'info, Rent>,
}

pub fn exec(ctx: Context<Deposit>, amount_in: u64) -> Result<()> {
    let pool = &mut ctx.accounts.pool;

    // Deposit tokens to the treasury
    let transfer_ctx = CpiContext::new(
        ctx.accounts.token_program.to_account_info(),
        token::Transfer {
            from: ctx.accounts.src_associated_token_account.to_account_info(),
            to: ctx.accounts.treasury.to_account_info(),
            authority: ctx.accounts.authority.to_account_info(),
        },
    );
    token::transfer(transfer_ctx, amount_in)?;

    let seeds: &[&[&[u8]]] = &[&[
        "treasurer".as_ref(),
        &pool.key().to_bytes(),
        &[*ctx.bumps.get("treasurer").unwrap()],
    ]];

    // Mint lp to user
    let mint_to_ctx = CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        token::MintTo {
            to: ctx.accounts.associated_token_account_lpt.to_account_info(),
            mint: ctx.accounts.mint_lpt.to_account_info(),
            authority: ctx.accounts.treasurer.to_account_info(),
        },
        seeds,
    );
    token::mint_to(mint_to_ctx, amount_in)?;

    emit!(DepositEvent {
        authority: ctx.accounts.authority.key(),
        pool: pool.key(),
        mint: ctx.accounts.mint.key(),
        amount_in,
        lpt_print_amount: amount_in
    });
    Ok(())
}

use anchor_lang::prelude::*;
use anchor_spl::{associated_token, token};

use crate::errors::ErrorCode;
use crate::traits::{Permission};
use crate::schema::pool::*;
use crate::schema::cheque::*;



#[event]
pub struct WithdrawNFTEvent {
    pub authority: Pubkey,
    pub pool: Pubkey,
    pub mint: Pubkey,
    pub cheque: Pubkey,
    
}

#[derive(Accounts)]
pub struct WithdrawNFT<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    // pool info
    #[account(mut, has_one= mint_lpt)]
    pub pool: Account<'info, Pool>,

    // pool info
    #[account(mut, has_one= pool,has_one=authority)]
    pub cheque: Account<'info, Cheque>,

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
    
    /// CHECK: Just a pure account
    pub metadata: AccountInfo<'info>,
    #[account(
    init_if_needed,
    payer = authority,
    associated_token::mint = mint,
    associated_token::authority = treasurer
  )]
    pub treasury: Box<Account<'info, token::TokenAccount>>,
    #[account(   
        init_if_needed,
        payer = authority,
        associated_token::mint = mint,
        associated_token::authority = authority
      )]
      pub dst_associated_token_account: Box<Account<'info, token::TokenAccount>>,

    // programs
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, token::Token>,
    pub associated_token_program: Program<'info, associated_token::AssociatedToken>,
    pub rent: Sysvar<'info, Rent>,
}

pub fn exec(ctx: Context<WithdrawNFT> ) -> Result<()> {
    let pool = &mut ctx.accounts.pool;
    let cheque = &mut ctx.accounts.cheque;

    if !pool.is_valid_mint_nft(cheque.mint, &ctx.accounts.metadata) {
        return err!(ErrorCode::InvalidNftCollection);
      }
    // Burn LPT token
  let bur_to_ctx = CpiContext::new(
    ctx.accounts.token_program.to_account_info(),
    token::Burn {
      from: ctx.accounts.associated_token_account_lpt.to_account_info(),
      mint: ctx.accounts.mint_lpt.to_account_info(),
      authority: ctx.accounts.authority.to_account_info(),
    },
  );
  token::burn(bur_to_ctx, 1)?;

    let seeds: &[&[&[u8]]] = &[&[
        "treasurer".as_ref(),
        &pool.key().to_bytes(),
        &[*ctx.bumps.get("treasurer").unwrap()],
    ]];

    // Mint lp to user
    let mint_to_ctx = CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        token::Transfer {
            from: ctx.accounts.treasury.to_account_info(),
            to: ctx.accounts.dst_associated_token_account.to_account_info(),
            authority: ctx.accounts.treasurer.to_account_info(),
        },
        seeds,
    );
    token::transfer(mint_to_ctx, 1)?;

    emit!(WithdrawNFTEvent {
        authority: ctx.accounts.authority.key(),
        pool: pool.key(),
        mint: ctx.accounts.mint.key(),
        cheque: ctx.accounts.cheque.key()
    });
    Ok(())
}

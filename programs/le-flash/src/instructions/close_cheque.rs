use crate::errors::ErrorCode;
use crate::schema::cheque::*;
use anchor_lang::prelude::*;

#[event]
pub struct CloseChequeEvent {
    pub authority: Pubkey,
    pub cheque: Pubkey,
    pub mint: Pubkey,
}

#[derive(Accounts)]
pub struct CloseCheque<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(mut, has_one = authority, close = authority)]
    pub cheque: Account<'info, Cheque>,

    pub system_program: Program<'info, System>,
}

pub fn exec(ctx: Context<CloseCheque>) -> Result<()> {
    let cheque = &ctx.accounts.cheque;
    if cheque.amount != 0 {
        return err!(ErrorCode::NotWithDraw);
    }

    emit!(CloseChequeEvent {
        authority: ctx.accounts.authority.key(),
        mint: cheque.mint.key(),
        cheque: cheque.key(),
    });

    Ok(())
}

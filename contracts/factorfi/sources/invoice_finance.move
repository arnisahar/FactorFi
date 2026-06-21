module factorfi::invoice_finance;

use std::string::String;
use sui::balance::{Self, Balance};
use sui::coin::{Self, Coin};
use sui::event;
use sui::object::{Self, UID};
use sui::transfer;
use sui::tx_context::{Self, TxContext};

const E_NOT_OWNER: u64 = 1;
const E_BAD_STATUS: u64 = 2;
const E_BAD_AMOUNT: u64 = 3;
const E_POOL_LIQUIDITY: u64 = 4;

const STATUS_DRAFT: u8 = 0;
const STATUS_LISTED: u8 = 1;
const STATUS_FUNDED: u8 = 2;
const STATUS_SETTLED: u8 = 3;

public struct Invoice has key, store {
    id: UID,
    amount: u64,
    due_ms: u64,
    borrower: address,
    debtor_hash: vector<u8>,
    walrus_blob_id: String,
    status: u8,
    advance_bps: u64,
    discount_bps: u64,
    funded_principal: u64,
    expected_fee: u64,
}

public struct LendingPool<phantom T> has key {
    id: UID,
    owner: address,
    balance: Balance<T>,
    total_deposited: u64,
    outstanding_principal: u64,
    funded_count: u64,
}

public struct InvoiceMinted has copy, drop {
    invoice_id: address,
    borrower: address,
    amount: u64,
    due_ms: u64,
}

public struct InvoiceFunded has copy, drop {
    invoice_id: address,
    borrower: address,
    principal: u64,
    expected_fee: u64,
}

public struct InvoiceSettled has copy, drop {
    invoice_id: address,
    repayment: u64,
}

#[test_only]
public struct TEST_USDC has drop {}

entry fun create_pool<T>(ctx: &mut TxContext) {
    let owner = tx_context::sender(ctx);
    let pool = LendingPool<T> {
        id: object::new(ctx),
        owner,
        balance: balance::zero<T>(),
        total_deposited: 0,
        outstanding_principal: 0,
        funded_count: 0,
    };

    transfer::share_object(pool);
}

entry fun deposit<T>(pool: &mut LendingPool<T>, coin: Coin<T>) {
    let amount = coin::value(&coin);
    assert!(amount > 0, E_BAD_AMOUNT);
    balance::join(&mut pool.balance, coin::into_balance(coin));
    pool.total_deposited = pool.total_deposited + amount;
}

entry fun withdraw<T>(
    pool: &mut LendingPool<T>,
    amount: u64,
    ctx: &mut TxContext,
) {
    assert!(tx_context::sender(ctx) == pool.owner, E_NOT_OWNER);
    assert!(amount > 0, E_BAD_AMOUNT);
    let coin = coin::take(&mut pool.balance, amount, ctx);
    transfer::public_transfer(coin, pool.owner);
}

entry fun mint_invoice(
    amount: u64,
    due_ms: u64,
    debtor_hash: vector<u8>,
    walrus_blob_id: String,
    advance_bps: u64,
    discount_bps: u64,
    ctx: &mut TxContext,
) {
    assert!(amount > 0, E_BAD_AMOUNT);
    assert!(advance_bps <= 10_000, E_BAD_AMOUNT);
    assert!(discount_bps <= 10_000, E_BAD_AMOUNT);

    let borrower = tx_context::sender(ctx);
    let invoice = Invoice {
        id: object::new(ctx),
        amount,
        due_ms,
        borrower,
        debtor_hash,
        walrus_blob_id,
        status: STATUS_DRAFT,
        advance_bps,
        discount_bps,
        funded_principal: 0,
        expected_fee: 0,
    };

    event::emit(InvoiceMinted {
        invoice_id: object::uid_to_address(&invoice.id),
        borrower,
        amount,
        due_ms,
    });

    transfer::transfer(invoice, borrower);
}

entry fun mint_listed_invoice(
    amount: u64,
    due_ms: u64,
    debtor_hash: vector<u8>,
    walrus_blob_id: String,
    advance_bps: u64,
    discount_bps: u64,
    ctx: &mut TxContext,
) {
    assert!(amount > 0, E_BAD_AMOUNT);
    assert!(advance_bps <= 10_000, E_BAD_AMOUNT);
    assert!(discount_bps <= 10_000, E_BAD_AMOUNT);

    let borrower = tx_context::sender(ctx);
    let invoice = Invoice {
        id: object::new(ctx),
        amount,
        due_ms,
        borrower,
        debtor_hash,
        walrus_blob_id,
        status: STATUS_LISTED,
        advance_bps,
        discount_bps,
        funded_principal: 0,
        expected_fee: 0,
    };

    event::emit(InvoiceMinted {
        invoice_id: object::uid_to_address(&invoice.id),
        borrower,
        amount,
        due_ms,
    });

    transfer::share_object(invoice);
}

entry fun list_invoice(invoice: &mut Invoice, ctx: &TxContext) {
    assert!(tx_context::sender(ctx) == invoice.borrower, E_NOT_OWNER);
    assert!(invoice.status == STATUS_DRAFT, E_BAD_STATUS);
    invoice.status = STATUS_LISTED;
}

entry fun fund_invoice<T>(
    pool: &mut LendingPool<T>,
    invoice: &mut Invoice,
    ctx: &mut TxContext,
) {
    assert!(invoice.status == STATUS_LISTED, E_BAD_STATUS);
    let principal = invoice.amount * invoice.advance_bps / 10_000;
    let expected_fee = invoice.amount * invoice.discount_bps / 10_000;
    assert!(balance::value(&pool.balance) >= principal, E_POOL_LIQUIDITY);

    let advance = coin::take(&mut pool.balance, principal, ctx);
    transfer::public_transfer(advance, invoice.borrower);

    invoice.status = STATUS_FUNDED;
    invoice.funded_principal = principal;
    invoice.expected_fee = expected_fee;
    pool.outstanding_principal = pool.outstanding_principal + principal;
    pool.funded_count = pool.funded_count + 1;

    event::emit(InvoiceFunded {
        invoice_id: object::uid_to_address(&invoice.id),
        borrower: invoice.borrower,
        principal,
        expected_fee,
    });
}

entry fun settle_invoice<T>(
    pool: &mut LendingPool<T>,
    invoice: &mut Invoice,
    repayment: Coin<T>,
    ctx: &TxContext,
) {
    assert!(tx_context::sender(ctx) == invoice.borrower, E_NOT_OWNER);
    assert!(invoice.status == STATUS_FUNDED, E_BAD_STATUS);

    let repayment_amount = coin::value(&repayment);
    assert!(
        repayment_amount >= invoice.funded_principal + invoice.expected_fee,
        E_BAD_AMOUNT,
    );

    balance::join(&mut pool.balance, coin::into_balance(repayment));
    pool.outstanding_principal = pool.outstanding_principal - invoice.funded_principal;
    invoice.status = STATUS_SETTLED;

    event::emit(InvoiceSettled {
        invoice_id: object::uid_to_address(&invoice.id),
        repayment: repayment_amount,
    });
}

public fun status(invoice: &Invoice): u8 {
    invoice.status
}

public fun pool_liquidity<T>(pool: &LendingPool<T>): u64 {
    balance::value(&pool.balance)
}

#[test_only]
fun invoice_for_testing(
    borrower: address,
    amount: u64,
    advance_bps: u64,
    discount_bps: u64,
    ctx: &mut TxContext,
): Invoice {
    Invoice {
        id: object::new(ctx),
        amount,
        due_ms: 1_806_000_000_000,
        borrower,
        debtor_hash: b"debtor",
        walrus_blob_id: std::string::utf8(b"test-walrus-blob"),
        status: STATUS_DRAFT,
        advance_bps,
        discount_bps,
        funded_principal: 0,
        expected_fee: 0,
    }
}

#[test_only]
fun pool_for_testing<T>(owner: address, ctx: &mut TxContext): LendingPool<T> {
    LendingPool<T> {
        id: object::new(ctx),
        owner,
        balance: balance::zero<T>(),
        total_deposited: 0,
        outstanding_principal: 0,
        funded_count: 0,
    }
}

#[test_only]
fun destroy_invoice_for_testing(invoice: Invoice) {
    let Invoice {
        id,
        amount: _,
        due_ms: _,
        borrower: _,
        debtor_hash: _,
        walrus_blob_id: _,
        status: _,
        advance_bps: _,
        discount_bps: _,
        funded_principal: _,
        expected_fee: _,
    } = invoice;
    object::delete(id);
}

#[test_only]
fun destroy_pool_for_testing<T>(pool: LendingPool<T>): u64 {
    let LendingPool {
        id,
        owner: _,
        balance,
        total_deposited: _,
        outstanding_principal: _,
        funded_count: _,
    } = pool;
    object::delete(id);
    balance::destroy_for_testing(balance)
}

#[test]
fun invoice_can_be_listed() {
    let mut ctx = tx_context::dummy();
    let mut invoice = invoice_for_testing(tx_context::sender(&ctx), 50_000_000_000, 9_000, 700, &mut ctx);

    assert!(status(&invoice) == STATUS_DRAFT, 0);
    list_invoice(&mut invoice, &ctx);
    assert!(status(&invoice) == STATUS_LISTED, 1);

    destroy_invoice_for_testing(invoice);
}

#[test]
fun listed_invoice_is_shared() {
    let borrower = @0xA;
    let lender = @0xB;
    let mut scenario = sui::test_scenario::begin(borrower);

    mint_listed_invoice(
        5_000_000,
        1_806_000_000_000,
        b"debtor",
        std::string::utf8(b"test-walrus-blob"),
        9_000,
        700,
        scenario.ctx(),
    );

    scenario.next_tx(lender);
    let invoice = scenario.take_shared<Invoice>();
    assert!(status(&invoice) == STATUS_LISTED, 0);
    assert!(invoice.borrower == borrower, 1);
    sui::test_scenario::return_shared(invoice);
    scenario.end();
}

#[test]
fun pool_funds_and_settles_invoice() {
    let mut ctx = tx_context::dummy();
    let owner = tx_context::sender(&ctx);
    let mut pool = pool_for_testing<TEST_USDC>(owner, &mut ctx);
    let mut invoice = invoice_for_testing(owner, 50_000_000_000, 9_000, 700, &mut ctx);
    let deposit_coin = coin::mint_for_testing<TEST_USDC>(60_000_000_000, &mut ctx);

    deposit(&mut pool, deposit_coin);
    list_invoice(&mut invoice, &ctx);
    fund_invoice(&mut pool, &mut invoice, &mut ctx);

    assert!(status(&invoice) == STATUS_FUNDED, 0);
    assert!(invoice.funded_principal == 45_000_000_000, 1);
    assert!(invoice.expected_fee == 3_500_000_000, 2);
    assert!(pool_liquidity(&pool) == 15_000_000_000, 3);

    let repayment = coin::mint_for_testing<TEST_USDC>(48_500_000_000, &mut ctx);
    settle_invoice(&mut pool, &mut invoice, repayment, &ctx);

    assert!(status(&invoice) == STATUS_SETTLED, 4);
    assert!(pool.outstanding_principal == 0, 5);
    assert!(pool_liquidity(&pool) == 63_500_000_000, 6);

    destroy_invoice_for_testing(invoice);
    assert!(destroy_pool_for_testing(pool) == 63_500_000_000, 7);
}

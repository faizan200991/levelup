# Bank Account Management Program

A simple JavaScript class for managing a bank account with deposit, withdrawal, and transaction history features.

## Features
- Deposit and withdraw money
- Prevents invalid transactions
- Tracks all transactions (deposits and withdrawals)
- Check current balance
- List all deposits and withdrawals

## Example Usage
```js
const myAccount = new BankAccount();
myAccount.deposit(200);
myAccount.deposit(150);
myAccount.withdraw(50);
myAccount.withdraw(80);
myAccount.deposit(20);
console.log(myAccount.checkBalance()); // Current balance: $240
console.log(myAccount.listAllDeposits()); // Deposits: 200,150,20
console.log(myAccount.listAllWithdrawals()); // Withdrawals: 50,80
```

## License
MIT

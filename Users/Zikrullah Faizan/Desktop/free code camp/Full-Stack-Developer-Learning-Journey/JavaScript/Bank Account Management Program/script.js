// Bank Account Management Program

class BankAccount {
  constructor() {
    this.balance = 0;
    this.transactions = [];
  }

  deposit(amount) {
    if (amount > 0) {
      this.transactions.push({ type: 'deposit', amount });
      this.balance += amount;
      return `Successfully deposited $${amount}. New balance: $${this.balance}`;
    } else {
      return "Deposit amount must be greater than zero.";
    }
  }

  withdraw(amount) {
    if (amount > 0 && amount <= this.balance) {
      this.transactions.push({ type: 'withdraw', amount });
      this.balance -= amount;
      return `Successfully withdrew $${amount}. New balance: $${this.balance}`;
    } else {
      return "Insufficient balance or invalid amount.";
    }
  }

  checkBalance() {
    return `Current balance: $${this.balance}`;
  }

  listAllDeposits() {
    const deposits = this.transactions.filter(t => t.type === 'deposit').map(t => t.amount);
    return `Deposits: ${deposits.join(',')}`;
  }

  listAllWithdrawals() {
    const withdrawals = this.transactions.filter(t => t.type === 'withdraw').map(t => t.amount);
    return `Withdrawals: ${withdrawals.join(',')}`;
  }
}

// Create an instance and perform transactions
const myAccount = new BankAccount();
myAccount.deposit(200);
myAccount.deposit(150);
myAccount.withdraw(50);
myAccount.withdraw(80);
myAccount.deposit(20);
// myAccount now has 5 transactions, at least 2 deposits, at least 2 withdrawals, and balance > $100

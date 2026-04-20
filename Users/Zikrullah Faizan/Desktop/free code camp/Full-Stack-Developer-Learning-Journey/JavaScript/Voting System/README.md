# Voting System

A simple voting system using JavaScript's Map and Set. Prevents duplicate votes and displays poll results.

## Features
- Add options to the poll
- Prevent duplicate options and empty options
- Vote for options (one vote per voter per option)
- Prevent duplicate votes
- Display poll results in a readable format

## Example Usage
```js
addOption("Turkey");
addOption("Morocco");
addOption("Spain");
vote("Turkey", "traveler1");
vote("Turkey", "traveler2");
vote("Morocco", "traveler3");
console.log(displayResults());
```

## Sample Output
```
Poll Results:
Turkey: 2 votes
Morocco: 1 votes
Spain: 0 votes
```

## License
MIT

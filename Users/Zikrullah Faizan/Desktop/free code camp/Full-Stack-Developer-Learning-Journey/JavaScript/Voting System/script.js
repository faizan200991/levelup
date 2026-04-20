// Voting System using Map and Set

// 1. Initialize poll as a new Map
const poll = new Map();

// 2. Add option to poll
function addOption(option) {
  if (!option || option.trim() === "") {
    return "Option cannot be empty.";
  }
  if (poll.has(option)) {
    return `Option "${option}" already exists.`;
  }
  poll.set(option, new Set());
  return `Option "${option}" added to the poll.`;
}

// 3. Vote for an option
function vote(option, voterId) {
  if (!poll.has(option)) {
    return `Option "${option}" does not exist.`;
  }
  const voters = poll.get(option);
  if (voters.has(voterId)) {
    return `Voter ${voterId} has already voted for "${option}".`;
  }
  voters.add(voterId);
  return `Voter ${voterId} voted for "${option}".`;
}

// 4. Display poll results
function displayResults() {
  let result = "Poll Results:";
  for (const [option, voters] of poll.entries()) {
    result += `\n${option}: ${voters.size} votes`;
  }
  return result;
}

// --- Example setup for tests ---
addOption("Turkey");
addOption("Morocco");
addOption("Spain");
vote("Turkey", "traveler1");
vote("Turkey", "traveler2");
vote("Morocco", "traveler3");
// --- End example ---

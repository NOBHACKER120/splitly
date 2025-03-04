function createInputs() {
    let num = document.getElementById("numPeople").value;
    let inputsDiv = document.getElementById("inputs");
    inputsDiv.innerHTML = ""; // Clear previous inputs

    if (num < 1) {
        alert("Please enter a valid number of people.");
        return;
    }

    for (let i = 0; i < num; i++) {
        let div = document.createElement("div");
        div.classList.add("person-entry");
        div.innerHTML = `
            <input type="text" placeholder="Name" id="name${i}">
            <input type="number" placeholder="Amount Paid" id="paid${i}" min="0">
        `;
        inputsDiv.appendChild(div);
    }

    // Show Calculate Button after Next is clicked
    document.getElementById("calculateButton").style.display = "block";
}


document.addEventListener("DOMContentLoaded", function () {
    document.getElementById("homeButton").classList.add("active"); // Ensure Home stays active on load
});



function calculateSplit() {
    let num = document.getElementById("numPeople").value;
    let people = [];
    let totalPaid = 0;
    let validInput = true;

    for (let i = 0; i < num; i++) {
        let nameField = document.getElementById(`name${i}`);
        let paidField = document.getElementById(`paid${i}`);
        let name = nameField.value.trim();
        let paid = parseFloat(paidField.value) || 0;

        // Reset previous errors
        nameField.classList.remove("input-error");
        paidField.classList.remove("input-error");

        // Check for empty name
        if (name === "") {
            nameField.classList.add("input-error");
            validInput = false;
        }

        // Check for empty amount
        if (paidField.value === "") {
            paidField.classList.add("input-error");
            validInput = false;
        }

        if (validInput) {
            people.push({ name, paid });
            totalPaid += paid;
        }
    }

    if (!validInput) return; // Stop function if inputs are invalid

    let perPerson = totalPaid / num;
    let resultsDiv = document.getElementById("results");
    resultsDiv.innerHTML = `<h3>Total Per Person: ₹${perPerson.toFixed(2)}</h3>`;

    let transactions = [];
    people.forEach(p => p.balance = p.paid - perPerson);
    people.sort((a, b) => a.balance - b.balance);

    let i = 0, j = people.length - 1;
    while (i < j) {
        let owe = -people[i].balance;
        let receive = people[j].balance;
        let amount = Math.min(owe, receive);

        let transaction = `<b>${people[i].name}</b> pays ₹${amount.toFixed(2)} to <b>${people[j].name}</b>`;
        transactions.push(transaction);

        resultsDiv.innerHTML += `<div class='result-item'>${transaction}</div>`;
        people[i].balance += amount;
        people[j].balance -= amount;

        if (people[i].balance === 0) i++;
        if (people[j].balance === 0) j--;
    }

    setTimeout(() => {
        resultsDiv.scrollIntoView({ behavior: "smooth" });
    }, 200);

    let history = JSON.parse(localStorage.getItem("splitHistory")) || [];
    history.push({
        id: Date.now(),
        date: new Date().toLocaleString(),
        perPerson: perPerson.toFixed(2),
        transactions
    });

    localStorage.setItem("splitHistory", JSON.stringify(history));
}



// hidden navs

function showHistory() {
    document.getElementById("historySection").style.display = "block";
    document.querySelector(".container").style.display = "none"; // Hide Bill Splitter
    document.querySelector(".selector").style.display = "none"; // Hide Blue Navbar
    loadHistory(); // Load saved history

    // Highlight History Button, Reset Home
    document.getElementById("historyButton").classList.add("active");
    document.getElementById("homeButton").classList.remove("active");
}

function showHome() {
    document.getElementById("historySection").style.display = "none";
    document.querySelector(".container").style.display = "block"; // Show Bill Splitter
    document.querySelector(".selector").style.display = "flex"; // Show Blue Navbar Again

    // Highlight Home Button, Reset History
    document.getElementById("homeButton").classList.add("active");
    document.getElementById("historyButton").classList.remove("active");
}


// Function to Load History from Local Storage
function loadHistory() {
    let historyResults = document.getElementById("historyResults");
    historyResults.innerHTML = "";

    let history = JSON.parse(localStorage.getItem("splitHistory")) || [];

    if (history.length === 0) {
        historyResults.innerHTML = "<p>No history found.</p>";
        return;
    }

    history.forEach(entry => {
        let historyClass = entry.type === "random" ? "random-history" : "history-card";
        let title = entry.type === "random" ? "Random Split History" : "Expense Splitter History";

        let historyItem = `<div class="${historyClass}">
                    <h3>${title} (${entry.date})</h3>
                    <ul>${entry.transactions.map(t => `<li>${t}</li>`).join("")}</ul>
                </div>`;
        historyResults.innerHTML += historyItem;
    });
}




// stop







function clearHistory() {
    localStorage.removeItem("splitHistory");
    loadHistory(); // Refresh history display
}



document.addEventListener("DOMContentLoaded", function () {
    // Set "Expense Splitter" active by default
    let expenseTab = document.querySelector(".selector ul li:nth-child(1)");
    expenseTab.classList.add("active");

    // Future: Add logic to switch between tabs
    document.querySelectorAll(".selector ul li").forEach((tab, index) => {
        tab.addEventListener("click", function () {
            document.querySelectorAll(".selector ul li").forEach(item => item.classList.remove("active"));
            this.classList.add("active");
        });
    });
});

// Function to show only Expense Splitter
// Function to show only Expense Splitter
function showExpenseSplitter() {
    hideAllSections();
    document.getElementById("expenseSplitter").style.display = "block";
    document.querySelector(".selector").style.display = "flex"; // Show navbar
    updateActiveTab(0);
}

// Function to show only Random Splitter
function showRandomSplitter() {
    hideAllSections();
    document.getElementById("randomSplitter").style.display = "block";
    document.querySelector(".selector").style.display = "flex"; // Show navbar
    updateActiveTab(1);
}

// Function to show only Create Group
function showCreateGroup() {
    hideAllSections();
    document.getElementById("createGroup").style.display = "block";
    document.querySelector(".selector").style.display = "flex"; // Show navbar
    updateActiveTab(2);
}

// Function to show History (and hide everything else)
function showHistory() {
    hideAllSections();
    document.getElementById("historySection").style.display = "block";
    document.querySelector(".selector").style.display = "none"; // Hide navbar
    loadHistory();

    // Remove active status from navbar and footer
    document.querySelectorAll(".selector ul li").forEach(tab => tab.classList.remove("active"));
    document.getElementById("homeButton").classList.remove("active");
    document.getElementById("historyButton").classList.add("active");
}

// Function to return to Home (always shows Expense Splitter)
function showHome() {
    hideAllSections();
    document.getElementById("expenseSplitter").style.display = "block"; // Default home section
    document.querySelector(".selector").style.display = "flex"; // Show navbar again
    updateActiveTab(0);

    // Reset active states
    document.getElementById("historyButton").classList.remove("active");
    document.getElementById("homeButton").classList.add("active");
}

// Function to hide all sections
function hideAllSections() {
    document.getElementById("expenseSplitter").style.display = "none";
    document.getElementById("randomSplitter").style.display = "none";
    document.getElementById("createGroup").style.display = "none";
    document.getElementById("historySection").style.display = "none";
}

// Function to update navbar active state
function updateActiveTab(index) {
    document.querySelectorAll(".selector ul li").forEach((tab, i) => {
        tab.classList.toggle("active", i === index);
    });

    // Also reset the footer state
    document.getElementById("homeButton").classList.add("active");
    document.getElementById("historyButton").classList.remove("active");
}

// Ensure Home (Expense Splitter) is selected on page load
document.addEventListener("DOMContentLoaded", function () {
    showExpenseSplitter();
});


// random splitter
function togglePercentageOptions() {
    let percentOptions = document.getElementById("percentOptions");
    let weightedOptions = document.getElementById("weightedOptions");
    let splitMode = document.getElementById("splitMode").value;

    percentOptions.style.display = splitMode === "percent" ? "block" : "none";
    weightedOptions.style.display = splitMode === "weighted" ? "block" : "none";

    if (splitMode === "weighted") {
        document.getElementById("highPayers").style.display = "block";
        document.getElementById("lowPayers").style.display = "block";
    } else {
        document.getElementById("highPayers").style.display = "none";
        document.getElementById("lowPayers").style.display = "none";
    }
}


function calculateWeightedSplit() {
    let num = parseInt(document.getElementById("numPeopleRandom").value);
    let totalAmount = parseFloat(document.getElementById("totalAmount").value);
    let highPayersCount = parseInt(document.getElementById("highPayers").value);
    let lowPayersCount = parseInt(document.getElementById("lowPayers").value);

    if (isNaN(num) || num < 2 || isNaN(totalAmount) || totalAmount <= 0) {
        return;
    }

    let people = [];
    for (let i = 0; i < num; i++) {
        let name = document.getElementById(`randomName${i}`).value.trim();
        if (name === "") return;
        people.push({ name });
    }

    let assignedAmounts = new Array(num).fill(roundToNearest5(totalAmount / num));

    for (let i = 0; i < highPayersCount; i++) {
        assignedAmounts[i] = roundToNearest5(assignedAmounts[i] * 1.5);
    }

    for (let i = num - 1; i >= num - lowPayersCount; i--) {
        assignedAmounts[i] = roundToNearest5(assignedAmounts[i] * 0.5);
    }

    let totalAssigned = assignedAmounts.reduce((sum, val) => sum + val, 0);
    assignedAmounts[num - 1] += roundToNearest5(totalAmount - totalAssigned);

    let resultsDiv = document.getElementById("randomResults");
    resultsDiv.innerHTML = `<h3>Total Amount: ₹${totalAmount.toFixed(2)}</h3>`;
    people.forEach((person, index) => {
        resultsDiv.innerHTML += `<div class='result-item'><b>${person.name}</b> pays ₹${assignedAmounts[index]}</div>`;
    });

    saveRandomSplitHistory(people, assignedAmounts);
}






function createRandomInputs() {
    let numInput = document.getElementById("numPeopleRandom");
    let amountInput = document.getElementById("totalAmount");
    let num = numInput.value.trim();
    let amount = amountInput.value.trim();
    let inputsDiv = document.getElementById("randomInputs");

    // Reset previous error styles
    numInput.classList.remove("input-error");
    amountInput.classList.remove("input-error");

    // Check for missing input
    let hasError = false;
    if (num === "" || num < 2) {
        numInput.classList.add("input-error");
        hasError = true;
    }
    if (amount === "" || amount <= 0) {
        amountInput.classList.add("input-error");
        hasError = true;
    }
    if (hasError) return; // Stop execution if inputs are invalid

    inputsDiv.innerHTML = ""; // Clear previous inputs
    for (let i = 0; i < num; i++) {
        let div = document.createElement("div");
        div.classList.add("person-entry");
        div.innerHTML = `<input type="text" placeholder="Name" id="randomName${i}" oninput="checkNamesEntered()">`;
        inputsDiv.appendChild(div);
    }

    // Show Choose Split Mode after Next is clicked
    document.getElementById("splitMode").style.display = "block";
    document.getElementById("randomCalculateButton").style.display = "none";
}



function checkNamesEntered() {
    let num = document.getElementById("numPeopleRandom").value;
    let allFilled = true;

    for (let i = 0; i < num; i++) {
        let name = document.getElementById(`randomName${i}`).value.trim();
        if (name === "") {
            allFilled = false;
            break;
        }
    }

    document.getElementById("randomCalculateButton").style.display = allFilled ? "block" : "none";
}





function roundToNearest5(value) {
    return Math.round(value / 5) * 5;
}

function calculateRandomSplit() {
    let num = parseInt(document.getElementById("numPeopleRandom").value);
    let totalAmount = parseFloat(document.getElementById("totalAmount").value);
    let splitMode = document.getElementById("splitMode").value;
    
    if (isNaN(num) || num < 2 || isNaN(totalAmount) || totalAmount <= 0) {
        return;
    }

    let people = [];
    for (let i = 0; i < num; i++) {
        let name = document.getElementById(`randomName${i}`).value.trim();
        if (name === "") return;
        people.push({ name });
    }

    let assignedAmounts = new Array(num).fill(0);
    let totalAssigned = 0;

    if (splitMode === "random") {
        let remainingAmount = totalAmount;
        let minPercent = 5;  // Minimum % a person should pay
        let maxPercent = 50; // Maximum % a person should pay

        for (let i = 0; i < num; i++) {
            if (i === num - 1) {
                assignedAmounts[i] = remainingAmount;  // Assign remaining amount to last person
            } else {
                let percentage = Math.floor(Math.random() * (maxPercent - minPercent + 1) + minPercent);
                let randomAmount = roundToNearest5((totalAmount * percentage) / 100);
                assignedAmounts[i] = Math.min(randomAmount, remainingAmount); 
                remainingAmount -= assignedAmounts[i];  
            }
        }
    }

    // Display results
    let resultsDiv = document.getElementById("randomResults");
    resultsDiv.innerHTML = `<h3>Total Amount: ₹${totalAmount.toFixed(2)}</h3>`;
    people.forEach((person, index) => {
        resultsDiv.innerHTML += `<div class='result-item'><b>${person.name}</b> pays ₹${assignedAmounts[index]}</div>`;
    });

    saveRandomSplitHistory(people, assignedAmounts);
}

document.getElementById("fixedPercent").addEventListener("change", function () {
    document.getElementById("customPercent").style.display = this.value === "custom" ? "block" : "none";
});





function validateSplitSelection() {
    let numPeople = document.getElementById("numPeopleRandom").value.trim();
    let amount = document.getElementById("totalAmount").value.trim();
    let splitModeError = document.getElementById("splitModeError");

    if (numPeople === "" || amount === "") {
        splitModeError.style.display = "block";
        document.getElementById("splitMode").selectedIndex = 0; // Reset selection
    } else {
        splitModeError.style.display = "none";
    }
}



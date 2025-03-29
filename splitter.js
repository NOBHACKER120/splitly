
// Global variable to store the last active section.
let lastActiveSection = "expenseSplitter";

// for profile tabs
document.addEventListener("DOMContentLoaded", function() {
    const profileButton = document.getElementById("profileButton");
    const profileMenu = document.getElementById("profileMenu");
    const signupModal = document.getElementById("signupModal");

    if (!profileButton || !profileMenu || !signupModal) {
        console.error("Missing profile elements in the DOM!");
        return;
    }

    // Wait for Firebase Auth state to load
    window.auth.onAuthStateChanged((user) => {
        if (user) {
            console.log("User is logged in:", user.email);
            profileButton.addEventListener("click", function() {
                profileMenu.classList.toggle("show");
            });
        } else {
            console.log("No user logged in");
            profileButton.addEventListener("click", function() {
                signupModal.style.display = "block";
            });
        }
    });
});


  
// Utility: round a value to the nearest multiple of 5.
function roundToNearest5(value) {
    return Math.round(value / 5) * 5;
}

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
    document.getElementById("calculateButton").style.display = "block";
    // Scroll to the name inputs
    inputsDiv.scrollIntoView({ behavior: "smooth", block: "start" });
}



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

        nameField.classList.remove("input-error");
        paidField.classList.remove("input-error");

        if (name === "") {
            nameField.classList.add("input-error");
            validInput = false;
        }
        if (paidField.value === "") {
            paidField.classList.add("input-error");
            validInput = false;
        }
        if (validInput) {
            people.push({ name, paid });
            totalPaid += paid;
        }
    }
    if (!validInput) return;

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
    setTimeout(() => { resultsDiv.scrollIntoView({ behavior: "smooth" }); }, 200);

    let history = JSON.parse(localStorage.getItem("splitHistory")) || [];
    history.push({
        id: Date.now(),
        date: new Date().toLocaleString(),
        perPerson: perPerson.toFixed(2),
        transactions
    });
    localStorage.setItem("splitHistory", JSON.stringify(history));
}

function calculateCustomSplit() {
    let num = parseInt(document.getElementById("numPeopleRandom").value);
    let totalAmount = parseFloat(document.getElementById("totalAmount").value);
    let assignedAmounts = [];

    for (let i = 0; i < num; i++) {
        let amount = parseFloat(document.getElementById(`customAmount${i}`).value);
        if (isNaN(amount) || amount < 0) return;
        assignedAmounts.push(amount);
    }
    let totalAssigned = assignedAmounts.reduce((sum, val) => sum + val, 0);
    if (totalAssigned !== totalAmount) {
        alert("Total assigned amounts do not match the total amount.");
        return;
    }
    let resultsDiv = document.getElementById("randomResults");
    resultsDiv.innerHTML = `<h3>Total Amount: ₹${totalAmount.toFixed(2)}</h3>`;
    assignedAmounts.forEach((amount, index) => {
        resultsDiv.innerHTML += `<div class='result-item'><b>Person ${index + 1}</b> pays ₹${amount}</div>`;
    });
    saveRandomSplitHistory(people, assignedAmounts);
}

// ----- Navigation Functions -----

function hideAllSections() {
    document.getElementById("expenseSplitter").style.display = "none";
    document.getElementById("randomSplitter").style.display = "none";
    document.getElementById("createGroup").style.display = "none";
    document.getElementById("historySection").style.display = "none";
}

function showHistory() {
    if(document.getElementById("expenseSplitter").style.display === "block"){
        lastActiveSection = "expenseSplitter";
    } else if(document.getElementById("randomSplitter").style.display === "block"){
        lastActiveSection = "randomSplitter";
    } else if(document.getElementById("createGroup").style.display === "block"){
        lastActiveSection = "createGroup";
    }
    hideAllSections();
    document.getElementById("historySection").style.display = "block";
    document.querySelector(".selector").style.display = "none";
    loadHistory();
    document.getElementById("historyButton").classList.add("active");
    document.getElementById("homeButton").classList.remove("active");
}

function showHome() {
    hideAllSections();
    if (lastActiveSection === "expenseSplitter") {
        document.getElementById("expenseSplitter").style.display = "block";
    } else if (lastActiveSection === "randomSplitter") {
        document.getElementById("randomSplitter").style.display = "block";
    } else if (lastActiveSection === "createGroup") {
        document.getElementById("createGroup").style.display = "block";
    }
    document.querySelector(".selector").style.display = "flex";
    document.getElementById("homeButton").classList.add("active");
    document.getElementById("historyButton").classList.remove("active");
}

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

function clearHistory() {
    localStorage.removeItem("splitHistory");
    loadHistory();
}

document.addEventListener("DOMContentLoaded", function () {
    let expenseTab = document.querySelector(".selector ul li:nth-child(1)");
    expenseTab.classList.add("active");
    document.querySelectorAll(".selector ul li").forEach((tab, index) => {
        tab.addEventListener("click", function () {
            document.querySelectorAll(".selector ul li").forEach(item => item.classList.remove("active"));
            this.classList.add("active");
        });
    });
});

function showExpenseSplitter() {
    hideAllSections();
    document.getElementById("expenseSplitter").style.display = "block";
    document.querySelector(".selector").style.display = "flex";
    lastActiveSection = "expenseSplitter";
    updateActiveTab(0);
    let firstInput = document.querySelector("#inputs input[type='text']");
    if(firstInput) firstInput.scrollIntoView({ behavior: "smooth", block: "start" });
}

function showRandomSplitter() {
    hideAllSections();
    document.getElementById("randomSplitter").style.display = "block";
    document.querySelector(".selector").style.display = "flex";
    lastActiveSection = "randomSplitter";
    updateActiveTab(1);
    let firstRandom = document.querySelector("#randomInputs input[type='text']");
    if(firstRandom) firstRandom.scrollIntoView({ behavior: "smooth", block: "start" });
}

function showCreateGroup() {
    hideAllSections();
    document.getElementById("createGroup").style.display = "block";
    document.querySelector(".selector").style.display = "flex";
    lastActiveSection = "createGroup";
    updateActiveTab(2);
}

function updateActiveTab(index) {
    document.querySelectorAll(".selector ul li").forEach((tab, i) => {
        tab.classList.toggle("active", i === index);
    });
    document.getElementById("homeButton").classList.add("active");
    document.getElementById("historyButton").classList.remove("active");
}

document.addEventListener("DOMContentLoaded", function () {
    if (window.location.hash === "#createGroup") {
      showCreateGroup();
    } else {
      // default section; for example:
      showExpenseSplitter();
    }
  });
  

// ----- RANDOM SPLITTER FUNCTIONS -----

// When selecting a split mode, scroll to its options container.
function togglePercentageOptions() {
    let percentOptions = document.getElementById("percentOptions");
    let weightedOptions = document.getElementById("weightedOptions");
    let splitMode = document.getElementById("splitMode").value;
    percentOptions.style.display = splitMode === "percent" ? "block" : "none";
    weightedOptions.style.display = splitMode === "weighted" ? "block" : "none";
    // Scroll to the options container
    if(splitMode === "percent") {
        percentOptions.scrollIntoView({ behavior: "smooth", block: "start" });
    } else if(splitMode === "weighted") {
        weightedOptions.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    document.getElementById("randomResults").innerHTML = "";
    document.getElementById("randomCalculateButton").textContent = "Split Now";
    if (splitMode === "weighted") {
        document.getElementById("highPayers").parentElement.style.display = "block";
        document.getElementById("lowPayers").parentElement.style.display = "block";
    } else {
        document.getElementById("highPayers").parentElement.style.display = "none";
        document.getElementById("lowPayers").parentElement.style.display = "none";
    }
}

document.getElementById("fixedPercent").addEventListener("change", function () {
    document.querySelector("#customOptions input#customPercent").style.display = this.value === "custom" ? "block" : "none";
});

// --- Weighted Split: allow independent selection of high and low payers.
function populateWeightedOptions() {
    let num = parseInt(document.getElementById("numPeopleRandom").value);
    let highPayersSelect = document.getElementById("highPayers");
    let lowPayersSelect = document.getElementById("lowPayers");
    
    // Populate high payers: options 1 to num-1, default = num-1.
    highPayersSelect.innerHTML = "";
    for (let i = 1; i <= num - 1; i++) {
        let option = document.createElement("option");
        option.value = i;
        option.textContent = `${i} Person${i > 1 ? 's' : ''} Pays More`;
        highPayersSelect.appendChild(option);
    }
    highPayersSelect.value = num - 1;
    
    // Populate low payers: options from 1 to (num - highPayers).
    updateLowPayersOptions();
    
    // When high payers changes, update the low payers dropdown.
    highPayersSelect.addEventListener("change", updateLowPayersOptions);
}

function updateLowPayersOptions() {
    let num = parseInt(document.getElementById("numPeopleRandom").value);
    let highPayers = parseInt(document.getElementById("highPayers").value);
    let lowPayersSelect = document.getElementById("lowPayers");
    
    // Maximum allowed for low is (num - highPayers)
    let maxLow = num - highPayers;
    lowPayersSelect.innerHTML = "";
    for (let i = 1; i <= maxLow; i++) {
        let option = document.createElement("option");
        option.value = i;
        option.textContent = `${i} Person${i > 1 ? 's' : ''} Pays Less`;
        lowPayersSelect.appendChild(option);
    }
    if (parseInt(lowPayersSelect.value) > maxLow || !lowPayersSelect.value) {
        lowPayersSelect.value = 1;
    }
}

function createRandomInputs() {
    let numInput = document.getElementById("numPeopleRandom");
    let amountInput = document.getElementById("totalAmount");
    let num = numInput.value.trim();
    let amount = amountInput.value.trim();
    let inputsDiv = document.getElementById("randomInputs");

    numInput.classList.remove("input-error");
    amountInput.classList.remove("input-error");

    let hasError = false;
    if (num === "" || num < 2) {
        numInput.classList.add("input-error");
        hasError = true;
    }
    if (amount === "" || amount <= 0 || parseFloat(amount) < parseInt(num)) {
        amountInput.classList.add("input-error");
        alert("Total amount must be at least equal to the number of people.");
        hasError = true;
    }
    if (hasError) return;

    inputsDiv.innerHTML = "";
    for (let i = 0; i < num; i++) {
        let div = document.createElement("div");
        div.classList.add("person-entry");
        div.innerHTML = `<input type="text" placeholder="Name" id="randomName${i}" oninput="checkNamesEntered()">`;
        inputsDiv.appendChild(div);
    }
    document.getElementById("splitMode").style.display = "block";
    document.getElementById("randomCalculateButton").style.display = "none";
    populateWeightedOptions();
    inputsDiv.scrollIntoView({ behavior: "smooth", block: "start" });
}

function checkNamesEntered() {
    let num = document.getElementById("numPeopleRandom").value;
    let allFilled = true;
    for (let i = 0; i < num; i++) {
        let name = document.getElementById(`randomName${i}`).value.trim();
        if (name === "") { allFilled = false; break; }
    }
    document.getElementById("randomCalculateButton").style.display = allFilled ? "block" : "none";
}

// Main function for random split.
function calculateRandomSplit() {
    let num = parseInt(document.getElementById("numPeopleRandom").value);
    let totalAmount = parseFloat(document.getElementById("totalAmount").value);
    let splitMode = document.getElementById("splitMode").value;
    
    if (isNaN(num) || num < 2 || isNaN(totalAmount) || totalAmount <= 0) {
        return;
    }
    document.getElementById("randomResults").innerHTML = "";
    document.getElementById("randomCalculateButton").textContent = "Split Now";
    totalAmount = roundToNearest5(totalAmount);
    
    let people = [];
    for (let i = 0; i < num; i++) {
        let name = document.getElementById(`randomName${i}`).value.trim();
        if (name === "") return;
        people.push({ name });
    }
    
    // ---- Percentage Based Split ----
    if (splitMode === "percent") {
        let percentValue = document.getElementById("fixedPercent").value;
        let lowerBound, upperBound;
        if (percentValue === "custom") {
            let customInput = document.getElementById("customPercent").value.split("-");
            if (customInput.length !== 2) { 
                alert("Enter a valid custom percentage range, e.g., 20-40");
                return;
            }
            lowerBound = parseFloat(customInput[0]);
            upperBound = parseFloat(customInput[1]);
        } else {
            let parts = percentValue.split('-');
            lowerBound = parseFloat(parts[0]);
            upperBound = parseFloat(parts[1]);
        }
        // Random multiplier between (1 + lowerBound/100) and (1 + upperBound/100)
        let r = Math.random() * ((1 + upperBound/100) - (1 + lowerBound/100)) + (1 + lowerBound/100);
        let n = num;
        let m = totalAmount / ( n * (1 + (r - 1) / 2) );
        let assignedAmounts = [];
        for (let i = 0; i < n; i++) {
            let amount = m + (m * (r - 1)) * (i / (n - 1));
            assignedAmounts.push(amount);
        }
        // Optional: shuffle amounts for randomness
        for (let i = assignedAmounts.length - 1; i > 0; i--) {
            let j = Math.floor(Math.random() * (i + 1));
            [assignedAmounts[i], assignedAmounts[j]] = [assignedAmounts[j], assignedAmounts[i]];
        }
        // Round each amount to the nearest 5 rupees
        assignedAmounts = assignedAmounts.map(a => roundToNearest5(a));
        // Adjust discrepancy in increments of 5
        let sumAssigned = assignedAmounts.reduce((sum, val) => sum + val, 0);
        let diff = totalAmount - sumAssigned;
        while (Math.abs(diff) >= 5) {
            for (let i = 0; i < n && Math.abs(diff) >= 5; i++) {
                if (diff > 0) { 
                    assignedAmounts[i] += 5; 
                    diff -= 5; 
                } else if (diff < 0 && assignedAmounts[i] >= 5) { 
                    assignedAmounts[i] -= 5; 
                    diff += 5; 
                }
            }
        }
        let resultsDiv = document.getElementById("randomResults");
        resultsDiv.innerHTML = `<h3>Total Amount: ₹${totalAmount.toFixed(2)}</h3>`;
        people.forEach((person, index) => {
            resultsDiv.innerHTML += `<div class='result-item'><b>${person.name}</b> pays ₹${assignedAmounts[index]}</div>`;
        });
        // Save history and change button text
        saveRandomSplitHistory(people, assignedAmounts);
        document.getElementById("randomCalculateButton").textContent = "Split Again";
        resultsDiv.scrollIntoView({ behavior: "smooth" });
        return;
    }
    
    // ---- Completely Random Split ----
    if (splitMode === "random") {
        let assignedAmounts = new Array(num).fill(0);
        let weights = [];
        let totalWeight = 0;
        for (let i = 0; i < num; i++) {
            let weight = Math.random();
            weights.push(weight);
            totalWeight += weight;
        }
        for (let i = 0; i < num; i++) {
            let share = (weights[i] / totalWeight) * totalAmount;
            assignedAmounts[i] = roundToNearest5(share);
        }
        let sumAssigned = assignedAmounts.reduce((sum, val) => sum + val, 0);
        let diff = totalAmount - sumAssigned;
        while (diff !== 0) {
            for (let i = 0; i < num && diff !== 0; i++) {
                if (diff > 0) { assignedAmounts[i] += 5; diff -= 5; }
                else if (diff < 0 && assignedAmounts[i] >= 5) { assignedAmounts[i] -= 5; diff += 5; }
            }
        }
        let resultsDiv = document.getElementById("randomResults");
        resultsDiv.innerHTML = `<h3>Total Amount: ₹${totalAmount.toFixed(2)}</h3>`;
        people.forEach((person, index) => {
            resultsDiv.innerHTML += `<div class='result-item'><b>${person.name}</b> pays ₹${assignedAmounts[index]}</div>`;
        });
        saveRandomSplitHistory(people, assignedAmounts);
        document.getElementById("randomCalculateButton").textContent = "Split Again";
        resultsDiv.scrollIntoView({ behavior: "smooth" });
        return;
    }
    
    // ---- Weighted Split ----
    if (splitMode === "weighted") {
        let highPayersCount = parseInt(document.getElementById("highPayers").value);
        let lowPayersCount = parseInt(document.getElementById("lowPayers").value);
        let numNormal = num - (highPayersCount + lowPayersCount);
        let indices = [...Array(num).keys()];
        indices.sort(() => Math.random() - 0.5);
        let group = new Array(num).fill("normal");
        for (let i = 0; i < highPayersCount; i++) {
            group[indices[i]] = "high";
        }
        for (let i = highPayersCount; i < highPayersCount + lowPayersCount; i++) {
            group[indices[i]] = "low";
        }
        let weights = [];
        for (let i = 0; i < num; i++) {
            if (group[i] === "high") {
                weights.push(1.8 + Math.random() * 0.4);
            } else if (group[i] === "low") {
                weights.push(0.4 + Math.random() * 0.2);
            } else {
                weights.push(0.8 + Math.random() * 0.4);
            }
        }
        let totalWeight = weights.reduce((sum, w) => sum + w, 0);
        let assignedAmounts = [];
        for (let i = 0; i < num; i++) {
            let share = (weights[i] / totalWeight) * totalAmount;
            assignedAmounts.push(roundToNearest5(share));
        }
        let sumAssigned = assignedAmounts.reduce((sum, val) => sum + val, 0);
        let diff = totalAmount - sumAssigned;
        while (diff !== 0) {
            for (let i = 0; i < num && diff !== 0; i++) {
                if (diff > 0) { assignedAmounts[i] += 5; diff -= 5; }
                else if (diff < 0 && assignedAmounts[i] >= 5) { assignedAmounts[i] -= 5; diff += 5; }
            }
        }
        let resultsDiv = document.getElementById("randomResults");
        resultsDiv.innerHTML = `<h3>Total Amount: ₹${totalAmount.toFixed(2)}</h3>`;
        people.forEach((person, index) => {
            resultsDiv.innerHTML += `<div class='result-item'><b>${person.name}</b> pays ₹${assignedAmounts[index]}</div>`;
        });
        saveRandomSplitHistory(people, assignedAmounts);
        document.getElementById("randomCalculateButton").textContent = "Split Again";
        resultsDiv.scrollIntoView({ behavior: "smooth" });
        return;
    }
}

function saveRandomSplitHistory(people, assignedAmounts) {
    let transactions = [];
    people.forEach((person, index) => {
         transactions.push(`${person.name} pays ₹${assignedAmounts[index]}`);
    });
    let history = JSON.parse(localStorage.getItem("splitHistory")) || [];
    history.push({
         id: Date.now(),
         date: new Date().toLocaleString(),
         type: "random",
         transactions
    });
    localStorage.setItem("splitHistory", JSON.stringify(history));
}

function validateSplitSelection() {
    let numPeople = document.getElementById("numPeopleRandom").value.trim();
    let amount = document.getElementById("totalAmount").value.trim();
    let splitModeError = document.getElementById("splitModeError");

    if (numPeople === "" || amount === "") {
        splitModeError.style.display = "block";
        document.getElementById("splitMode").selectedIndex = 0;
    } else {
        splitModeError.style.display = "none";
    }
}


// ----- CREATE GROUP FUNCTIONS -----

// Called when the Create Group section is shown.
function showCreateGroup() {
    hideAllSections();
    document.getElementById("createGroup").style.display = "block";
    document.querySelector(".selector").style.display = "flex";
    lastActiveSection = "createGroup";
    updateActiveTab(2);
    createGroupInputs();
}

// Generate the initial form for group creation.
function createGroupInputs() {
    let groupContainer = document.getElementById("createGroup");
    groupContainer.innerHTML = `
        <h2>Create Group</h2>
        <input type="text" id="groupName" placeholder="Enter Group Name" style="width:100%; padding:10px; margin:10px 0; border:1px solid #ccc; border-radius:6px;">
        <select id="groupType" style="width:100%; padding:10px; margin:10px 0; border:1px solid #ccc; border-radius:6px;">
            <option value="">-- Select Group Type --</option>
            <option value="friends">Friends</option>
            <option value="family">Family</option>
            <option value="colleagues">Colleagues</option>
        </select>
        <input type="number" id="groupMembersCount" placeholder="Number of Members" min="1" style="width:100%; padding:10px; margin:10px 0; border:1px solid #ccc; border-radius:6px;">
        <button onclick="generateGroupMemberInputs()" style="width:100%; padding:10px; margin-bottom:10px; border:none; border-radius:6px; background:#ff7e5f; color:#fff; font-weight:bold;">Next</button>
        <div id="groupMemberInputs"></div>
        <button id="saveGroupButton" onclick="saveGroup()" style="display:none; width:100%; padding:10px; margin-top:10px; border:none; border-radius:6px; background:#027aca; color:#fff; font-weight:bold;">Save Group</button>
        <div id="groupMessage" style="margin-top:10px;"></div>
        <div style="margin-top:20px; padding:15px; background:#f1f1f1; border-radius:6px;">
            <p style="margin:0; font-size:14px; color:#555;">
                Already have a group? Click below to manage your groups.
            </p>
            <button onclick="location.href='group_dashboard.html'" 
                style="width:100%; padding:10px; margin-top:10px; border:none; border-radius:6px; background:#027aca; color:#fff; font-weight:bold;">
                Go to Group Dashboard
            </button>
        </div>
    `;
}

// Generate input fields for member names based on the number entered.
function generateGroupMemberInputs() {
    // Clear any previous error styling.
    document.getElementById("groupMembersCount").classList.remove("input-error");
    
    let count = parseInt(document.getElementById("groupMembersCount").value);
    let container = document.getElementById("groupMemberInputs");
    container.innerHTML = "";
    if (isNaN(count) || count < 1) {
        document.getElementById("groupMembersCount").classList.add("input-error");
        return;
    }
    for (let i = 0; i < count; i++) {
        container.innerHTML += `<input type="text" placeholder="Member ${i+1} Name" id="memberName${i}" style="width:100%; padding:10px; margin:5px 0; border:1px solid #ccc; border-radius:6px;">`;
    }
    document.getElementById("saveGroupButton").style.display = "block";
}

// Save the group information and immediately redirect to the Group Dashboard.
function saveGroup() {
    // Remove previous error styling.
    document.getElementById("groupName").classList.remove("input-error");
    document.getElementById("groupType").classList.remove("input-error");
    document.getElementById("groupMembersCount").classList.remove("input-error");

    let groupName = document.getElementById("groupName").value.trim();
    let groupType = document.getElementById("groupType").value;
    let countValue = document.getElementById("groupMembersCount").value;
    let count = parseInt(countValue);

    let hasError = false;

    // Validate group name.
    if (groupName === "") {
        document.getElementById("groupName").classList.add("input-error");
        hasError = true;
    }
    // Validate group type.
    if (groupType === "") {
        document.getElementById("groupType").classList.add("input-error");
        hasError = true;
    }
    // Validate number of members.
    if (isNaN(count) || countValue === "" || count < 1) {
        document.getElementById("groupMembersCount").classList.add("input-error");
        hasError = true;
    }
    if (hasError) {
        return;
    }

    let members = [];
    // Validate each member input.
    for (let i = 0; i < count; i++){
        let memberInput = document.getElementById(`memberName${i}`);
        memberInput.classList.remove("input-error");
        let member = memberInput.value.trim();
        if (member === "") {
            memberInput.classList.add("input-error");
            hasError = true;
        }
        members.push(member);
    }
    if (hasError) return;

    // Save group info in local storage (simulate a database)
    let groups = JSON.parse(localStorage.getItem("groups")) || [];
    // Ensure the group name is unique.
    if (groups.some(g => g.groupName.toLowerCase() === groupName.toLowerCase())) {
        document.getElementById("groupName").classList.add("input-error");
        document.getElementById("groupMessage").innerHTML = `<p style="color:red;">Group name already exists. Please choose a unique name.</p>`;
        return;
    }
    
    let group = {
        id: Date.now(),
        groupName: groupName,
        groupType: groupType,
        members: members
    };
    
    groups.push(group);
    localStorage.setItem("groups", JSON.stringify(groups));
    
    // Show success message.
    document.getElementById("groupMessage").innerHTML = `<p style="color:green;">Group "${groupName}" created successfully!</p>`;
    
    // Immediately redirect to the Group Dashboard.
    window.location.href = "group_dashboard.html";
}

// to call user back from group dashboard


  
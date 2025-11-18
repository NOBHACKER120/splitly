
// import {
//     getFirestore,
//     collection,
//     addDoc,
//     getDocs,
//     query,
//     orderBy
//   } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";
  
//   const db = getFirestore();

// Uploads the entire local history array to Firestore under the current user
async function syncHistoryToServer() {
    if (!auth.currentUser) throw new Error("Must be signed in to sync.");
    const history = JSON.parse(localStorage.getItem("splitHistory") || "[]");
    const docRef = firebase.firestore()
      .collection("userHistories")
      .doc(auth.currentUser.uid);
    // overwrite or merge
    await docRef.set({ entries: history }, { merge: true });
    console.log("History synced to server:", history);
  }
  
  // Fetches history from Firestore, merges it with localStorage, and returns the merged array
  async function loadHistoryFromServer() {
    if (!auth.currentUser) return;  // no-op for anonymous
    const docRef = firebase.firestore()
      .collection("userHistories")
      .doc(auth.currentUser.uid);
    const snap = await docRef.get();
    if (!snap.exists) return;       // no history on server yet
  
    const serverEntries = snap.data().entries || [];
    const localEntries  = JSON.parse(localStorage.getItem("splitHistory") || "[]");
  
    // Merge strategy: keep local + server, dedupe by `id`
    const all = [...localEntries, ...serverEntries];
    const deduped = [];
    const seenIds = new Set();
    all.forEach(e => {
      if (!seenIds.has(e.id)) {
        seenIds.add(e.id);
        deduped.push(e);
      }
    });
  
    // Save merged array back to localStorage
    localStorage.setItem("splitHistory", JSON.stringify(deduped));
    console.log("History loaded from server:", deduped);
    return deduped;
  }

//   const syncBtn = document.getElementById("syncHistoryBtn");
// syncBtn.addEventListener("click", async () => {
//   try {
//     await syncHistoryToServer();
//     alert("✅ History successfully uploaded.");
//   } catch (e) {
//     console.error(e);
//     alert("❌ Could not sync history. Please try again.");
//   }
// });

// syncBtn.style.display = auth.currentUser ? "inline-block" : "none";

  

// Global variable to store the last active section.
let lastActiveSection = "expenseSplitter";

// for profile tabs
document.addEventListener("DOMContentLoaded", () => {
    const signupModal   = document.getElementById("signupModal");
    const closeBtn      = signupModal.querySelector(".close");
    const startBtn      = document.getElementById("modalSignupBtn");
    const profileButton = document.getElementById("profileButton");
    const profileMenu   = document.getElementById("profileMenu");
    const logoutLink    = document.getElementById("logoutLink");
  
    // Close (×) button: hide modal, re-enable page scrolling, show splitter
    closeBtn.addEventListener("click", () => {
      signupModal.style.display = "none";
      document.body.style.overflow = "";          // restore scrolling
      showExpenseSplitter();
    });
  
    // “Get Started” button forwards to signup page
    startBtn.addEventListener("click", () => {
      window.location.href = "signup-login.html";
    });
  
    // Profile icon: if signed in, toggle dropdown; if not, open modal and disable scrolling
    auth.onAuthStateChanged(user => {
        if (user) {
          profileButton.onclick = () => profileMenu.classList.toggle("show");
        } else {
          profileButton.onclick = () => {
            signupModal.style.display = "block";
            document.body.style.overflow = "hidden"; // disable page scrolling
          };
        }
      });
      

  
    // Logout link: sign out & redirect
   // Logout link: confirm before sign out
if (logoutLink) {
  logoutLink.addEventListener("click", (e) => {
    e.preventDefault();
    showConfirmation("Are you sure you want to log out?", async () => {
      await auth.signOut();
      persistToast("You’ve been logged out.");
      window.location.href = "signup-login.html";
    });
  });
}
});
  
// for non signed up users


  
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
      // expense splitter: after inputsDiv.appendChild(div) loop completes


    }
    document.getElementById("calculateButton").style.display = "block";
    // --- Expense: Enter-to-next ---
const expenseInputs = Array.from(
  document.querySelectorAll("#inputs input")
);
expenseInputs.forEach((input, idx) => {
  input.addEventListener("keydown", e => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (idx < expenseInputs.length - 1) {
        expenseInputs[idx + 1].focus();
      } else {
        calculateSplit();
      }
    }
  });
});

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

// === Show History Function ===
function showHistory() {
    // 1. Remember last active splitter section
    if (document.getElementById("expenseSplitter").style.display === "block") {
      lastActiveSection = "expenseSplitter";
    } else if (document.getElementById("randomSplitter").style.display === "block") {
      lastActiveSection = "randomSplitter";
    } else if (document.getElementById("createGroup").style.display === "block") {
      lastActiveSection = "createGroup";
    }
  
    // 2. Show History section
    hideAllSections();
    document.getElementById("historySection").style.display = "block";
    document.querySelector(".selector").style.display = "none";
  
    // 3. Load from localStorage and render into #historyResults
     const history = JSON.parse(localStorage.getItem("splitHistory")) || [];
  if (history.length === 0) {
    document.getElementById("noHistoryModal").style.display = "flex";
    // NEW: switch footer active states
    document.getElementById("historyButton").classList.add("active");
    document.getElementById("homeButton").classList.remove("active");
    return;
  
}
 else {
      history.forEach(entry => {
        const cls = entry.type === "random" ? "random-history" : "history-card";
        const title = entry.type === "random" 
          ? "Random Split History" 
          : "Expense Splitter History";
  
        const html = `
          <div class="${cls}">
            <h3>${title} (${entry.date})</h3>
            <ul>
              ${entry.transactions.map(t => `<li>${t}</li>`).join("")}
            </ul>
          </div>`;
        historyResults.innerHTML += html;
      });
    }
  
    // 4. Update footer buttons
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
  const history = JSON.parse(localStorage.getItem("splitHistory")) || [];
  if (history.length === 0) {
    // no history — show the friendly no-history modal
    document.getElementById("noHistoryModal").style.display = "flex";
    return;
  }
  // otherwise proceed as before:
  showConfirmation("Do you want to clear all history?", () => {
    localStorage.removeItem("splitHistory");
    const historyResults = document.getElementById("historyResults");
    historyResults.innerHTML = "<p>No history found.</p>";
    // after clearing, update footer too:
    document.getElementById("historyButton").classList.add("active");
    document.getElementById("homeButton").classList.remove("active");
    showToast("History cleared successfully!");
  });
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
    // Gate it behind signup
    if (!auth.currentUser) {
      document.getElementById("signupModal").style.display = "block";
      return;
    }
  
    // Your existing Create Group logic:
    hideAllSections();
    document.getElementById("createGroup").style.display = "block";
    document.querySelector(".selector").style.display = "flex";
    lastActiveSection = "createGroup";
    updateActiveTab(2);
    createGroupInputs();
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
    // --- Random: Enter-to-next ---
const randomInputs = Array.from(
  document.querySelectorAll("#randomInputs input")
);
const randomBtn = document.getElementById("randomCalculateButton");
randomInputs.forEach((input, idx) => {
  input.addEventListener("keydown", e => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (idx < randomInputs.length - 1) {
        randomInputs[idx + 1].focus();
      } else if (randomBtn.style.display !== "none") {
        calculateRandomSplit();
      }
    }
  });
});

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
    // Scroll group-member inputs into view on “Next”
document
  .getElementById("groupMemberInputs")
  .scrollIntoView({ behavior: "smooth", block: "start" });

    // --- Group: Enter-to-next ---
const groupInputs = Array.from(
  document.querySelectorAll("#groupMemberInputs input")
);
const saveBtn = document.getElementById("saveGroupButton");
groupInputs.forEach((input, idx) => {
  input.addEventListener("keydown", e => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (idx < groupInputs.length - 1) {
        groupInputs[idx + 1].focus();
      } else {
        saveBtn.click();
      }
    }
  });
});

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
    // after localStorage.setItem(…)
persistToast(`Group "${groupName}" created!`);
window.location.href = "group_dashboard.html";

}

// to call user back from group dashboard


  // Save history entry to Firestore under users/{uid}/history
async function saveHistoryEntry(type, transactions) {
    const user = auth.currentUser;
    if (!user) return;
    const coll = collection(db, "users", user.uid, "history");
    await addDoc(coll, { type, transactions, timestamp: new Date() });
  }
  
  // Load history from Firestore (signed-in) or from localStorage
  async function loadHistory() {
    const user = auth.currentUser;
    let history = [];
    if (user) {
      const q = query(collection(db, "users", user.uid, "history"));
      const snap = await getDocs(q);
      snap.forEach(doc => history.push(doc.data()));
    } else {
      history = JSON.parse(localStorage.getItem("splitHistory")) || [];
    }
    // TODO: render `history` into your #historyResults container
  }

  document.getElementById("syncHistoryBtn")
  .addEventListener("click", async () => {
    const history = JSON.parse(localStorage.getItem("splitHistory") || "[]");
    try {
      // assume you have a Cloud Function or Firestore path for user histories:
      await firebase.firestore()
        .collection("userHistories")
        .doc(auth.currentUser.uid)
        .set({ entries: history }, { merge: true });
      alert("History synced! ✅");
    } catch (e) {
      console.error("Sync failed:", e);
      alert("Could not sync. Please try again.");
    }
  });

  // === Reusable Confirmation Modal Logic ===
function showConfirmation(message, onConfirm) {
  const modal = document.getElementById("confirmationModal");
  const text = document.getElementById("confirmationText");
  const yes = document.getElementById("confirmYes");
  const no = document.getElementById("confirmNo");

  text.textContent = message;
  modal.style.display = "flex";

  const cleanUp = () => {
modal.style.display = "none";  
    yes.removeEventListener("click", confirmHandler);
    no.removeEventListener("click", cancelHandler);
  };

  const confirmHandler = () => {
    cleanUp();
    onConfirm();
  };

  const cancelHandler = () => {
    cleanUp();
  };

  yes.addEventListener("click", confirmHandler);
  no.addEventListener("click", cancelHandler);
}

// Toast helper
function showToast(message) {
  const container = document.getElementById("toastContainer");
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = message;
  container.appendChild(toast);
  // auto-remove after anim
  setTimeout(() => container.removeChild(toast), 3000);
}

// Persist-toast for redirects:
function persistToast(message) {
  sessionStorage.setItem("pendingToast", message);
}
// On page load, show pending toast:
window.addEventListener("DOMContentLoaded", () => {
  const msg = sessionStorage.getItem("pendingToast");
  if (msg) {
    showToast(msg);
    sessionStorage.removeItem("pendingToast");
  }
});


/* KEEP EVERYTHING ABOVE AS IT IS */

/* === RESPONSIVE NAV & MOBILE MENU === */
(function () {
  const toggle = document.getElementById("nav-toggle");
  const links = document.getElementById("nav-links");
  const auth = document.getElementById("nav-auth");
  const navContainer = document.querySelector(".nav-container");
  const authButtons = auth ? auth.innerHTML : "";

  if (!toggle || !links) return;

  function openMenu() {
    toggle.classList.add("open");
    links.classList.add("mobile-open");
    navContainer.classList.add("mobile-open");
    toggle.setAttribute("aria-expanded", "true");

    if (authButtons && !links.querySelector(".auth-btn")) {
      links.insertAdjacentHTML("beforeend", authButtons);
    }

    const menuItems = links.querySelectorAll(".nav-link, .auth-btn");
    menuItems.forEach((item, i) => {
      const delay = `${i * 80}ms`;
      item.setAttribute("data-delay", delay);
      item.style.setProperty("--delay", delay);
    });
  }

  function closeMenu() {
    toggle.classList.remove("open");
    links.classList.remove("mobile-open");
    navContainer.classList.remove("mobile-open");
    toggle.setAttribute("aria-expanded", "false");

    links.querySelectorAll(".auth-btn").forEach(btn => btn.remove());
  }

  toggle.addEventListener("click", (e) => {
    const expanded = toggle.classList.contains("open");
    expanded ? closeMenu() : openMenu();
    e.stopPropagation();
  });

  document.addEventListener("click", (e) => {
    if (!navContainer.contains(e.target)) closeMenu();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeMenu();
  });

  document.querySelectorAll(".nav-link").forEach((a) => {
    a.addEventListener("click", () => {
      if (window.innerWidth <= 880) closeMenu();
    });
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 880) closeMenu();
  });

})();

// MARK ACTIVE NAV TAB AUTOMATICALLY
(function () {
  const path = window.location.pathname.split("/").pop() || "index.html";

  document.querySelectorAll(".nav-link").forEach(a => {
    const href = a.getAttribute("href");

    if (href === path) {
      a.classList.add("active");
    }

    // also support hash navigation
    if (href.includes("#")) {
      if (window.location.href.includes(href)) {
        a.classList.add("active");
      }
    }
  });
})();


/* ==========================
   Robust User-Guide overlay
   (replace previous UG JS with this)
   ========================== */

(function () {
  // find or create wrapper
  let wrapper = document.getElementById("user-guide-wrapper");
  let createdHere = false;

  if (!wrapper) {
    // create a minimal wrapper if not present (keeps same ids used in CSS)
    wrapper = document.createElement("div");
    wrapper.id = "user-guide-wrapper";
    wrapper.style.display = "none";
    // safe inner structure (if your HTML already has full content, this won't be used)
    wrapper.innerHTML = `
      <button id="guide-close-btn" aria-label="Close guide">✕</button>
      <div id="user-guide-overlay"><div id="user-guide-content"></div></div>
    `;
    document.body.appendChild(wrapper);
    createdHere = true;
  }

  // references (support both id names you might have)
  const contentContainer = wrapper.querySelector("#user-guide-content") || wrapper.querySelector(".user-guide-content") || wrapper.querySelector("#ug-content");
  const closeCandidates = [
    wrapper.querySelector("#guide-close-btn"),
    wrapper.querySelector("#ug-close"),
    wrapper.querySelector(".guide-close-btn"),
    wrapper.querySelector("[data-ug-close]")
  ].filter(Boolean);

  // helper to find any close btn dynamically later
  function wireCloseButtons() {
    // attach listener to any close button that may appear
    const buttons = [
      wrapper.querySelector("#guide-close-btn"),
      wrapper.querySelector("#ug-close"),
      wrapper.querySelector(".guide-close-btn"),
      ...Array.from(wrapper.querySelectorAll('[data-ug-close]'))
    ].filter(Boolean);
    buttons.forEach(btn => {
      // remove duplicate listeners safely by cloning
      const newBtn = btn.cloneNode(true);
      btn.parentNode.replaceChild(newBtn, btn);
      newBtn.addEventListener("click", closeGuide);
    });
  }

  // open/close helpers
  function openGuide() {
    // hide background scrolling
    document.body.style.overflow = "hidden";
    wrapper.style.display = "block";

    // if content area is empty, try to use embedded markup on page (if user included full markup)
    if (contentContainer && contentContainer.innerHTML.trim().length > 10) {
      // content already present — great
    } else {
      // try to find existing main in a separate user-guide block that might already be in DOM
      const existingMain = document.querySelector("main#ug-main, main#main, main");
      if (existingMain && existingMain.closest("#user-guide-wrapper")) {
        // there is already content inside wrapper; nothing to fetch
      } else {
        // fallback: attempt to fetch user-guide.html and extract <main> (best-effort)
        fetch("user-guide.html").then(r => {
          if (!r.ok) throw new Error("fetch failed");
          return r.text();
        }).then(html => {
          try {
            const tmp = document.createElement("div");
            tmp.innerHTML = html;
            const main = tmp.querySelector("main");
            if (main && contentContainer) {
              contentContainer.innerHTML = main.innerHTML;
            }
          } catch (e) {
            console.warn("Could not parse fetched guide; leaving empty content if present.", e);
          }
        }).catch(err => {
          // ignore fetch errors; user may have embedded guide markup already
          console.warn("user-guide fetch failed (this is ok if guide markup is embedded):", err);
        }).finally(() => {
          // wire demo JS if present
          setTimeout(activateUGDemoJS, 80);
        });
      }
    }

    // wire close buttons now (in case content was just inserted)
    wireCloseButtons();

    // update URL hash for back-button support
    if (location.hash !== "#user-guide") {
      history.pushState(null, "", "#user-guide");
    }
  }

  function closeGuide() {
    wrapper.style.display = "none";
    document.body.style.overflow = "";
    if (location.hash === "#user-guide") {
      // remove hash but keep history reasonable
      history.replaceState(null, "", location.pathname + location.search);
    }
  }

  // delegate clicks on anchors that point to #user-guide
  document.addEventListener("click", function (ev) {
    const a = ev.target.closest && ev.target.closest('a[href="#user-guide"], [data-open-user-guide]');
    if (!a) return;
    ev.preventDefault();
    openGuide();
  }, { capture: true });

  // also allow direct call (in case some code tries to call openUserGuide)
  window.openUserGuide = openGuide;
  window.closeUserGuide = closeGuide;

  // close on Escape
  document.addEventListener("keydown", function (ev) {
    if (ev.key === "Escape" && wrapper.style.display === "block") {
      closeGuide();
    }
  });

  // close when hash changes away from #user-guide (back button)
  window.addEventListener("hashchange", function () {
    if (location.hash !== "#user-guide" && wrapper.style.display === "block") {
      closeGuide();
    } else if (location.hash === "#user-guide" && wrapper.style.display !== "block") {
      openGuide();
    }
  });

  // if page loaded with hash -> open
  if (location.hash === "#user-guide") {
    // small delay so DOM finishes loading
    window.addEventListener("load", function () { setTimeout(openGuide, 80); });
  }

  
// ===== Helper: round to nearest 5 =====
function roundToNearest5(v) {
    return Math.round(v / 5) * 5;
}

// ===== Compute transactions =====
function computeTransactions(people) {
    const n = people.length;
    const total = people.reduce((s, p) => s + (Number(p.paid) || 0), 0);
    const perExact = total / n;
    const perRoundedTo5 = roundToNearest5(perExact);

    // calculate balances
    const balances = people.map(p => ({
        ...p,
        balance: (Number(p.paid) || 0) - perExact
    }));

    // sort balances to compute minimal transactions
    const sorted = balances.slice().sort((a, b) => a.balance - b.balance);
    let i = 0, j = sorted.length - 1;
    const tx = [];

    while (i < j) {
        const owe = -sorted[i].balance;
        const receive = sorted[j].balance;
        const amt = Math.min(owe, receive);

        if (amt > 0.0001) {
            tx.push({
                from: sorted[i].name,
                to: sorted[j].name,
                amount: Math.round(amt * 100) / 100
            });

            sorted[i].balance += amt;
            sorted[j].balance -= amt;
        }
        if (Math.abs(sorted[i].balance) < 0.0001) i++;
        if (Math.abs(sorted[j].balance) < 0.0001) j--;
    }

    const txRounded = tx.map(t => ({
        ...t,
        rounded: roundToNearest5(t.amount)
    }));

    return {
        total,
        perExact: Math.round(perExact * 100) / 100,
        perRoundedTo5,
        tx,
        txRounded
    };
}

// ===== Render demo output like User-guide.html =====
function renderDemo() {
    const p1 = document.getElementById('p1').value || 'A';
    const a1 = Number(document.getElementById('a1').value) || 0;
    const p2 = document.getElementById('p2').value || 'B';
    const a2 = Number(document.getElementById('a2').value) || 0;
    const p3 = document.getElementById('p3').value || 'C';
    const a3 = Number(document.getElementById('a3').value) || 0;

    const people = [
        { name: p1, paid: a1 },
        { name: p2, paid: a2 },
        { name: p3, paid: a3 }
    ];

    const res = computeTransactions(people);

    const out = document.getElementById('demoOutput');
    out.innerHTML = `
        <div><strong>Total:</strong> ₹${res.total.toFixed(2)}</div>
        <div><strong>Per person (exact):</strong> ₹${res.perExact.toFixed(2)}</div>
        <div><strong>Per person (rounded to nearest ₹5):</strong> ₹${res.perRoundedTo5}</div>

        <div style="margin-top:8px"><strong>Suggested transactions (exact):</strong></div>
        <ul>
            ${res.tx.map(t => `<li>${t.from} → ${t.to}: ₹${t.amount.toFixed(2)}</li>`).join('')}
        </ul>

        <div style="margin-top:8px;color:#334155"><strong>Cash-friendly rounded transactions (nearest ₹5):</strong></div>
        <ul>
            ${res.txRounded.map(t => `<li>${t.from} → ${t.to}: ₹${t.rounded}</li>`).join('')}
        </ul>

        <div class="ug-small" style="margin-top:8px">
            Note: Rounded transactions may introduce small rounding differences; the app adjusts sums by ±₹5 increments to match total.
        </div>
    `;
}

// ===== Connect buttons =====
document.getElementById('computeBtn').addEventListener('click', renderDemo);
document.getElementById('resetBtn').addEventListener('click', function() {
    document.getElementById('p1').value = 'A'; document.getElementById('a1').value = 1200;
    document.getElementById('p2').value = 'B'; document.getElementById('a2').value = 400;
    document.getElementById('p3').value = 'C'; document.getElementById('a3').value = 400;
    renderDemo();
});

// ===== Initial demo render =====
renderDemo();



  // If wrapper already has content at page load, wire close buttons now
  wireCloseButtons();

})();


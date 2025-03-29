  // Redirect back to Create Group page
  function goBackToCreateGroup() {
    window.location.href = "splitter.html#createGroup";
  }
  
  // Get groups from localStorage
  function loadGroupsData() {
    return JSON.parse(localStorage.getItem('groups')) || [];
  }
  
  // Save groups to localStorage
  function saveGroupsData(groups) {
    localStorage.setItem("groups", JSON.stringify(groups));
  }
  
  // Calculate total expenses from an array of expense objects
  function getTotalExpenses(expenses) {
    return expenses ? expenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0).toFixed(2) : "0.00";
  }
  
  // Calculate per-person average expense
  function getAverage(expenses, membersCount) {
    let total = parseFloat(getTotalExpenses(expenses));
    return membersCount > 0 ? (total / membersCount).toFixed(2) : "0.00";
  }
  
  // Update paid amount for member
  function updateMemberPayment(group, payer, amount) {
    group.payments = group.payments || {};
    if(group.payments[payer]) {
      group.payments[payer] += amount;
    } else {
      group.payments[payer] = amount;
    }
  }
  
  // Render a group card; editable determines whether edit/delete icons appear
  function renderGroupCard(group, index, editable) {
    let total = parseFloat(getTotalExpenses(group.expenses));
    let average = getAverage(group.expenses, group.members.length);
    
    let expensesHtml = group.expenses ? group.expenses.slice().reverse().map(exp => `
<div class="expense-item">
  <p><strong>${exp.category}</strong>: ₹${exp.amount} on ${exp.date} at ${exp.time} - ${exp.description}</p>
  <p>Paid By: ${exp.paidBy} via ${exp.paymentMethod}</p>
</div>
`).join('') : '<p>No expenses added yet.</p>';

    
    let membersHtml = group.members.map(member => {
      let paid = group.payments && group.payments[member] ? group.payments[member] : 0;
      return `<li>${member}<span class="amount">₹${paid}</span></li>`;
    }).join('');
    
    let splitterHtml = `<div class="expense-splitter" id="splitter${index}">
      <p><strong>Expense Splitter:</strong></p>
      <button onclick="splitExpense(${index})" id="splitBtn${index}">Split Now</button>
      <div id="splitResult${index}" style="margin-top:10px;"></div>
    </div>`;
    
    let editIcon = editable ? `<span class="edit-icon" onclick="editGroup(${index})" title="Edit Group">
      <i class="fas fa-pen"></i>
    </span>` : "";
    let deleteIcon = editable ? `<span class="delete-icon" onclick="deleteGroup(${index})" title="Delete Group">
      <i class="fas fa-trash"></i>
    </span>` : "";
    
    let addExpenseBtn = editable ? `<button class="add-expense-btn" id="addExpenseBtn${index}" onclick="toggleExpenseForm(${index})">Add Expense</button>` : `<button onclick="toggleExpenseForm(${index})">Add Expense</button>`;
    
    return `
      <div class="group-card" id="groupCard${index}">
        ${editIcon} ${deleteIcon}
        <h3>${group.groupName}</h3>
        <p><strong>Type:</strong> ${group.groupType}</p>
        <p><strong>Members (${group.members.length}):</strong></p>
        <ul class="member-list">${membersHtml}</ul>
        <p class="balance"><strong>Total Expenses:</strong> ₹${total} | <strong>Per Person:</strong> ₹${average}</p>
        <div class="expense-list">${expensesHtml}</div>
        ${addExpenseBtn}
        <div id="expenseForm${index}" class="expense-form" style="display:none;">
          <input type="number" id="expenseAmount${index}" placeholder="Expense Amount (e.g., 500)" required>
           <select id="expensePaidBy${index}" required>
            <option value="">Select Payer</option>
            ${group.members.map(member => `<option value="${member}">${member}</option>`).join('')}
          </select>
          <select id="paymentMethod${index}" required>
            <option value="">Select Payment Method</option>
            <option value="Cash">Cash</option>
            <option value="Card">Card</option>
            <option value="Online">Online</option>
          </select>
          <select id="expenseCategory${index}" onchange="toggleCustomCategory(${index})" required>
            <option value="">Select Category</option>
            <option value="Food">Food</option>
            <option value="Transport">Transport</option>
            <option value="Entertainment">Entertainment</option>
            <option value="Custom">Custom</option>
          </select>
          <input type="text" id="customCategory${index}" placeholder="E.g., Stationery" style="display:none;">
          <input type="text" id="expenseDesc${index}" placeholder="Description">
         
          <div id="errorMsg${index}" class="error-msg"></div>
          <button onclick="saveExpense(${index})">Save Expense</button>
          <button class="cancel" onclick="cancelExpense(${index})">Cancel</button>
        </div>
        ${splitterHtml}
      </div>
    `;
  }
  
  function toggleExpenseForm(index) {
    const formDiv = document.getElementById(`expenseForm${index}`);
    const splitBtn = document.getElementById(`splitBtn${index}`);
    if(formDiv.style.display === "none") {
      formDiv.style.display = "block";
      if(splitBtn) { splitBtn.style.display = "none"; }
    } else {
      formDiv.style.display = "none";
      if(splitBtn) { splitBtn.style.display = "inline-block"; }
    }
  }
  
  function toggleCustomCategory(index) {
    const selectElem = document.getElementById(`expenseCategory${index}`);
    const customElem = document.getElementById(`customCategory${index}`);
    customElem.style.display = selectElem.value === "Custom" ? "block" : "none";
  }
  
  function cancelExpense(index) {
    document.getElementById(`expenseForm${index}`).style.display = "none";
    document.getElementById(`errorMsg${index}`).innerText = "";
    const splitBtn = document.getElementById(`splitBtn${index}`);
    if(splitBtn) { splitBtn.style.display = "inline-block"; }
  }
  
  function saveExpense(index) {
    const groups = loadGroupsData();
    const group = groups[index];
    const amountField = document.getElementById(`expenseAmount${index}`);
    const amount = parseFloat(amountField.value);
    let category = document.getElementById(`expenseCategory${index}`).value;
    const description = document.getElementById(`expenseDesc${index}`).value;
    const customCategory = document.getElementById(`customCategory${index}`).value;
    const paidBy = document.getElementById(`expensePaidBy${index}`).value;
    const paymentMethod = document.getElementById(`paymentMethod${index}`).value;
    const errorMsg = document.getElementById(`errorMsg${index}`);
    errorMsg.innerText = "";
    
    if (isNaN(amount) || amount <= 0) {
      errorMsg.innerText = "Enter a valid expense amount.";
      document.getElementById(`expenseAmount${index}`).classList.add("error");
      return;
    } else {
      document.getElementById(`expenseAmount${index}`).classList.remove("error");
    }
    if (!category) {
      errorMsg.innerText = "Please select a category.";
      document.getElementById(`expenseCategory${index}`).classList.add("error");
      return;
    } else {
      document.getElementById(`expenseCategory${index}`).classList.remove("error");
    }
    if (!paidBy) {
      errorMsg.innerText = "Please select a payer.";
      return;
    }
    if (!paymentMethod) {
      errorMsg.innerText = "Please select a payment method.";
      return;
    }
    
    if (category === "Custom" && customCategory.trim()) {
      category = customCategory;
    }
    
    let now = new Date();
    let date = now.toLocaleDateString("en-GB", { day: '2-digit', month: '2-digit', year: 'numeric' });
    let time = now.toLocaleTimeString();
    
    group.expenses = group.expenses || [];
    group.expenses.push({
      amount: amount,
      category: category,
      description: description,
      date: date,
      time: time,
      paidBy: paidBy,
      paymentMethod: paymentMethod
    });
    
    updateMemberPayment(group, paidBy, amount);
    
    groups[index] = group;
    saveGroupsData(groups);
    
    amountField.value = "";
    document.getElementById(`expenseDesc${index}`).value = "";
    document.getElementById(`paymentMethod${index}`).selectedIndex = 0;
    document.getElementById(`expensePaidBy${index}`).selectedIndex = 0;
    document.getElementById(`expenseCategory${index}`).selectedIndex = 0;
    document.getElementById(`customCategory${index}`).value = "";
    document.getElementById(`customCategory${index}`).style.display = "none";
    
    document.getElementById(`expenseForm${index}`).style.display = "none";
    const splitBtn = document.getElementById(`splitBtn${index}`);
    if(splitBtn) { splitBtn.style.display = "inline-block"; }
    
    refreshViews();
  }
  
  function splitExpense(index) {
    const groups = loadGroupsData();
    const group = groups[index];
    const total = parseFloat(getTotalExpenses(group.expenses));
    const resultDiv = document.getElementById(`splitResult${index}`);
    
    if(total <= 0) {
      resultDiv.innerHTML = "<p style='color:red;'>No transactions available to split.</p>";
      return;
    }
    
    let average = total / group.members.length;
    let net = {};
    group.members.forEach(member => {
      let paid = group.payments && group.payments[member] ? group.payments[member] : 0;
      net[member] = paid - average;
    });
    
    let creditors = [];
    let debtors = [];
    for (let member in net) {
      if(net[member] > 0.01) {
        creditors.push({ member: member, amount: net[member] });
      } else if(net[member] < -0.01) {
        debtors.push({ member: member, amount: -net[member] });
      }
    }
    
    creditors.sort((a, b) => b.amount - a.amount);
    debtors.sort((a, b) => b.amount - a.amount);
    
    let transactions = [];
    let i = 0, j = 0;
    while(i < debtors.length && j < creditors.length) {
      let debtor = debtors[i];
      let creditor = creditors[j];
      let minAmount = Math.min(debtor.amount, creditor.amount);
      transactions.push(`${debtor.member} pays ₹${minAmount.toFixed(2)} to ${creditor.member}`);
      debtor.amount -= minAmount;
      creditor.amount -= minAmount;
      if(debtor.amount < 0.01) i++;
      if(creditor.amount < 0.01) j++;
    }
    
    let resultHtml = `<p><strong>Total Expense:</strong> ₹${total.toFixed(2)}</p>`;
    resultHtml += `<p><strong>Average Expense per Person:</strong> ₹${average.toFixed(2)}</p>`;
    if(transactions.length === 0) {
      resultHtml += `<p>All accounts are settled.</p>`;
    } else {
      transactions.forEach(trans => {
        resultHtml += `<div class="transaction">${trans}</div>`;
      });
    }
    resultDiv.innerHTML = resultHtml;
  }
  
  // Functions for the custom modal (edit error)
function showModal(message) {
const modal = document.getElementById("customModal");
const modalMessage = document.getElementById("modalMessage");
modalMessage.textContent = message;
modal.style.display = "block";
}

function hideModal() {
document.getElementById("customModal").style.display = "none";
}

// Functions for the delete confirmation modal
// Show the delete modal
function showDeleteModal(index) {
const deleteModal = document.getElementById("deleteModal");

// Show the confirm view, hide success view
document.getElementById("deleteConfirmView").style.display = "block";
document.getElementById("deleteSuccessView").style.display = "none";

// Display the modal
deleteModal.style.display = "block";

// Set the confirm button's callback
document.getElementById("confirmDeleteBtn").onclick = function() {
  // Delete the group from storage
  const groups = loadGroupsData();
  groups.splice(index, 1);
  saveGroupsData(groups);

  // Switch to success message
  document.getElementById("deleteConfirmView").style.display = "none";
  document.getElementById("deleteSuccessView").style.display = "block";
};
}

// Hide modal completely
function hideDeleteModal() {
document.getElementById("deleteModal").style.display = "none";
}

// After clicking "OK", close the popup
function finalizeDelete() {
hideDeleteModal(); // Popup disappears
refreshViews(); // Refresh groups list
}


// Updated editGroup function to show the custom modal if editing the latest group
function editGroup(index) {
const groups = loadGroupsData();
if (index === groups.length - 1) {
  showModal("Editing the latest group is not allowed.");
  return;
}

const group = groups[index];
const groupCard = document.getElementById(`groupCard${index}`);

groupCard.innerHTML = `
  <div class="edit-group-form">
    <input type="text" id="editGroupName${index}" value="${group.groupName}" placeholder="Group Name">
    <select id="editGroupType${index}">
      <option value="Friends" ${group.groupType === "Friends" ? "selected" : ""}>Friends</option>
      <option value="Family" ${group.groupType === "Family" ? "selected" : ""}>Family</option>
      <option value="Colleagues" ${group.groupType === "Colleagues" ? "selected" : ""}>Colleagues</option>
    </select>
    <p><strong>Members:</strong></p>
    ${group.members.map((member, mIndex) => `<input type="text" id="editMember${index}_${mIndex}" value="${member}" placeholder="Member ${mIndex+1} Name">`).join('')}
    <button onclick="saveGroupEdits(${index})">Save Changes</button>
    <button onclick="refreshViews()" style="background:#ff7e5f;">Cancel</button>
  </div>
`;
}

// Updated deleteGroup function to use the delete modal
function deleteGroup(index) {
// Show the new fancy modal
showDeleteModal(index);
}





  
  function saveGroupEdits(index) {
    const groups = loadGroupsData();
    const group = groups[index];
    const newName = document.getElementById(`editGroupName${index}`).value.trim();
    const newType = document.getElementById(`editGroupType${index}`).value;
    if (!newName) {
      alert("Group name cannot be empty");
      return;
    }
    group.groupName = newName;
    group.groupType = newType;
    for (let i = 0; i < group.members.length; i++) {
      const newMember = document.getElementById(`editMember${index}_${i}`).value.trim();
      if (!newMember) {
        alert("Member names cannot be empty");
        return;
      }
      group.members[i] = newMember;
    }
    groups[index] = group;
    saveGroupsData(groups);
    alert("Group updated!");
    refreshViews();
  }
  
  // function deleteGroup(index) {
  //   if (confirm("Are you sure you want to delete this group?")) {
  //     const groups = loadGroupsData();
  //     groups.splice(index, 1);
  //     saveGroupsData(groups);
  //     alert("Group deleted");
  //     refreshViews();
  //   }
  // }
  
  // Render Latest Group view (most recent group)
  function showLatestGroup() {
    document.getElementById("latestTab").classList.add("active");
    document.getElementById("myGroupsTab").classList.remove("active");
    const groups = loadGroupsData();
    const latestView = document.getElementById("latestGroupView");
    const myGroupsView = document.getElementById("myGroupsView");
    myGroupsView.style.display = "none";
    latestView.style.display = "block";
    if (groups.length === 0) {
      latestView.innerHTML = "<p>No groups available. Please create one.</p>";
      return;
    }
    const latestGroup = groups[groups.length - 1];
    latestView.innerHTML = renderGroupCard(latestGroup, groups.length - 1, false);
  }
  
  // Render My Groups view in reverse order so that the latest group appears at the top
  function showMyGroups() {
    document.getElementById("myGroupsTab").classList.add("active");
    document.getElementById("latestTab").classList.remove("active");
    const groups = loadGroupsData();
    const myGroupsView = document.getElementById("myGroupsView");
    const latestView = document.getElementById("latestGroupView");
    latestView.style.display = "none";
    myGroupsView.style.display = "block";
    if (groups.length === 0) {
      myGroupsView.innerHTML = "<p>No groups available. Please create one.</p>";
      return;
    }
    let html = "";
    for (let i = groups.length - 1; i >= 0; i--) {
      html += renderGroupCard(groups[i], i, true);
    }
    myGroupsView.innerHTML = html;
  }
  
  function refreshViews() {
    if (document.getElementById("latestTab").classList.contains("active")) {
      showLatestGroup();
    } else {
      showMyGroups();
    }
  }
  
  document.addEventListener("DOMContentLoaded", function () {
    showLatestGroup();
  });
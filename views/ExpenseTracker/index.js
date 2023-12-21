const token = localStorage.getItem('token');
let currentPage = 1;
let totalPages = 1;

////////// Adds Expenses /////////
function addNewExpense(e) {
    e.preventDefault();
    const form = new FormData(e.target);

    const expenseDetails = {
        date: form.get("date"),
        expenseamount: form.get("expenseamount"),
        description: form.get("description"),
        category: form.get("category")

    }

    axios.post('/user/addexpense', expenseDetails, { headers: { "Authorization": token } }).then((response) => {

        if (response.status === 201) {
            e.target.reset()
            addNewExpensetoUI(response.data.expense);
        } else {
            throw new Error('Failed To create new expense');
        }

    }).catch(err => showError(err))
}

function addNewExpensetoUI(expense) {

    const parentElement = document.getElementById('listOfExpenses');
    const date = new Date(expense.date).toLocaleDateString();

    const newRow = document.createElement('tr');
    newRow.setAttribute('id', `expense-${expense.id}`)

    newRow.innerHTML = `
        <td>${date}</td>
        <td>${expense.expenseamount}.00 Rs</td>
        <td>${expense.description}</td>
        <td>${expense.category}</td>
        <td>
            <button onclick='deleteExpense(event, ${expense.id})'>
                Delete Expense
            </button>
        </td>
    `;

    parentElement.appendChild(newRow);
}


////////// Premium Checkers //////////
function premium() {
    axios.get('/user/premium', { headers: { "Authorization": token } }).then(response => {
        if (response.status === 200) {
            const premium = document.getElementById('premium')
            premium.innerHTML = (response.data.user.ispremiumuser == true) ? 'premium user' : ''
            premium.style.color = 'gold'
        } else {
            throw new Error();
        }
    })
}

function ispremium() {
    return new Promise((resolve,reject) => {
        axios.get('/user/premium', { headers: { "Authorization": token } }).then(response => {
        if (response.data.user.ispremiumuser) 
        { resolve (1) }
         else {
            resolve(0)
        }
    })
    })
    
}


////////// Delete Expenses //////////
function deleteExpense(e, expenseid) {
    axios.delete(`/user/deleteexpense/${expenseid}`, { headers: { "Authorization": token } }).then((response) => {

        if (response.status === 204) {
            removeExpensefromUI(expenseid);
        } else {
            throw new Error('Failed to delete');
        }
    }).catch((err => {
        showError(err);
    }))
}

function removeExpensefromUI(expenseid) {
    const expenseElemId = `expense-${expenseid}`;
    document.getElementById(expenseElemId).remove();
}


////////// Error Handling //////////
function showError(err) {
    document.body.innerHTML += `<div style="color:red;"> ${err}</div>`
    
}


////////// Download Expenses //////////
async function download() {
    if (await ispremium()) {
        axios.get('/user/download', { headers: { "Authorization": token } })
            .then((response) => {
                if (response.status === 200) {
                    var a = document.createElement("a");
                    a.href = response.data.fileURL;
                    a.download = 'myexpense.csv';
                    a.click();
                } else {
                    throw new Error(response.data.message)
                }

            })
            .catch((err) => {
                showError(err)
            });
    } else {
        showError("you are not a premium user")
    }

}


////////// Payment through Razorpay //////////
document.getElementById('rzp-button1').onclick = async function (e) {
    const response = await axios.get('/purchase/premiummembership', { headers: { "Authorization": token } });
    var options = {
        "key": response.data.key_id,
        "order_id": response.data.order.id,
        "handler": async function (response) {

            const obj = {
                order_id: response.razorpay_order_id,
                payment_id: response.razorpay_payment_id,
                status: 1
            };

            const config = {
                headers: {
                    'Authorization': token
                }
            };

            console.log(obj);
            try {
                await axios.post(
                    '/purchase/updatetransactionstatus',
                    obj, config)
                alert('You are a premium user now');
                premium();
            } catch (error) {
                console.error(error);
                alert('Something went wrong');
            }

        }
    };
    const rzp1 = new Razorpay(options);
    rzp1.open();
    e.preventDefault();

    rzp1.on('payment.failed', function (response) {
        alert(response.error.code);
        alert(response.error.description);
        alert(response.error.source);
        alert(response.error.step);
        alert(response.error.reason);
        alert(response.error.metadata.order_id);
        alert(response.error.metadata.payment_id);
    });
}


////////// Show Lead Board //////////
async function showleadboard(e) {
    if (await ispremium()) {
        const board = document.querySelector('#board')
        e.preventDefault()
        board.innerHTML = '';
        axios.get('/user/leadboard', { headers: { "Authorization": token } }).then((result) => {
            result.data.forEach(element => {
                const data = "<li> name: " + element.name + "; total expense: " + element
                    .totalExp + "</li>";
                board.innerHTML += data;
            })
        })
    } else {
        showError("you are not a premium user")
    }
}


///////// Dynamic pagination //////////
function updateExpensesPerPage() {
    const selectElement = document.getElementById('expensesPerPage');
    const selectedValue = selectElement.value;

    localStorage.setItem('expensesPerPage', selectedValue);

    location.reload();
    
}
/////////// Function to get page from local storage
function getExpensesPerPagePreference() {
    const storedValue = localStorage.getItem('expensesPerPage');

    // Return the stored value or a default value if not found
    return storedValue ? parseInt(storedValue, 10) : 10;
}
////////// function to add page options 5,10,20,30
function populateExpensesPerPageDropdown() {
    const selectElement = document.getElementById('expensesPerPage');
    const expensesPerPage = getExpensesPerPagePreference();

    const options = [5, 10, 20, 30]; // Add more options as needed
    options.forEach(optionValue => {
        const option = document.createElement('option');
        option.value = optionValue;
        option.text = `${optionValue} per page`;
        selectElement.add(option);
    });

    // Set the selected option based on the user's preference
    selectElement.value = expensesPerPage;
}


////////// On load executives like expenses, premium and so on //////////
window.onload = async () => {

    premium();
    populateExpensesPerPageDropdown();
    const expensesPerPage = getExpensesPerPagePreference();
    const selectedExpensesPerPageElement = document.getElementById('selectedExpensesPerPage');
    selectedExpensesPerPageElement.innerText = `Showing ${expensesPerPage} expenses per page`;

    await axios.get('/user/getexpenses', { headers: { "Authorization": token } }).then(response => {
        if (response.status === 200) {
            expenses = response.data.expenses;
            totalPages = Math.ceil(expenses.length / expensesPerPage);
            
            // Display the first page of expenses
            showExpenses(currentPage);
        } else {
            throw new Error();
        }
    });
}


////////// Show Expenses with Pagination in page
function showExpenses(page) {
    if (page < 1 || page > totalPages) {
        return; // Invalid page number
    }

    const expensesPerPage = getExpensesPerPagePreference();

    axios.get('/user/getexpenses', { headers: { "Authorization": token } })
    .then((response) => {
        const expenses = response.data.expenses;
        currentPage = page;

        // Calculate start and end indices for the expenses to display
        const startIndex = (currentPage - 1) * expensesPerPage;
        const endIndex = Math.min(startIndex + expensesPerPage, expenses.length);

        const parentElement = document.getElementById('listOfExpenses');
        parentElement.innerHTML = '';

        for (let i = startIndex; i < endIndex; i++) {
            addNewExpensetoUI(expenses[i]);
        }

        // Update page information
        document.getElementById('currentPage').innerText = `Page ${currentPage}`;
        document.getElementById('totalPages').innerText = `of ${totalPages}`;

        // Enable/disable pagination buttons based on the current page
        document.getElementById('prevPage').disabled = currentPage === 1;
        document.getElementById('nextPage').disabled = currentPage === totalPages;
    })
        .catch(err => showError(err))
}
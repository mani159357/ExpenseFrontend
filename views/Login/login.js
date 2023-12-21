
function login(e) {
    e.preventDefault();
    const form = new FormData(e.target);
    const loginDetails = {
        email: form.get("email"),
        password: form.get("password")
    }
    axios.post('/user/login',loginDetails).then(response => {
        if(response.status === 200){
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('userDetails', JSON.stringify(response.data.user))
            window.location.href = "../ExpenseTracker/index.html" // change the page on successful login
        } else {
            throw new Error('Failed to login')
        }
    }).catch(err => {
        document.body.innerHTML += `<div style="color:red;">${err} <div>`;
    })
}

function forgotpassword() {
    window.location.href = "../ForgotPassword/index.html"
}
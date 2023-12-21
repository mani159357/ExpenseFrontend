function signup(e) {
    e.preventDefault();
    const form = new FormData(e.target);

    const signupDetails = {
        name: form.get("name"),
        email: form.get("email"),
        password: form.get("password")
    }
    axios.post('/user/signup',signupDetails).then(response => {
        if(response.status === 201){
            window.location.href = "../Login/login.html" // change the page on successful login
        } else {
            throw new Error('Failed to login')
        }
    }).catch(err => {
        document.body.innerHTML += `<div style="color:red;">${err} <div>`;
    })
}
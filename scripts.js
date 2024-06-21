
var loggedInUser = undefined;

var modelAccess = {
    'donate': {
        require_auth: true,
        disable_when_logged_in: false
    },
    'donate-detail': {
        require_auth: true,
        disable_when_logged_in: false
    },
    'authentication': {
        require_auth: false,
        disable_when_logged_in: true
    },
    'authentication-login': {
        require_auth: false,
        disable_when_logged_in: true
    },
    'authentication-register': {
        require_auth: false,
        disable_when_logged_in: true
    },
};

document.addEventListener("DOMContentLoaded", function () {
    const lsAuthUserKey = `auth_user`;
    if (localStorage.getItem(lsAuthUserKey) != null) {
        loggedInUser = JSON.parse(localStorage.getItem(lsAuthUserKey));
    } else {
        loggedInUser = undefined;
    }
});

function showModal(modalId) {

    if (loggedInUser == undefined && modelAccess[modalId].require_auth) {
        modalId = "authentication";
    }

    document.querySelectorAll('.modal').forEach(modal => modal.style.display = "none");

    var modal = document.querySelector('[data-name="' + modalId + '"]');
    modal.style.display = "flex";

    document.querySelector('[data-name="' + modalId + '"]').addEventListener("click", function (event) {
        if (event.target == this) {
            this.style.display = "none";
        }
    });

}

function linkTo(href) {
    window.location.href = href;
}

function doRegister(event) {

    event.preventDefault();

    // Create an empty object to store the form data
    const payload = {};

    // Get all the input elements within the form
    const inputs = event.target.querySelectorAll('input');

    // Iterate over the input elements and add their values to the payload object
    inputs.forEach(input => {
        // Check if the input has a name attribute (excluding checkboxes)
        if (input.name && input.type !== 'checkbox') {
            payload[input.name] = input.value;
        } else if (input.type === 'checkbox') {
            // Handle checkboxes, adding their value only if checked
            payload[input.name] = input.checked;
        }
    });

    const requiredFields = [
        'username',
        'email',
        'password',
        'terms'
    ]

    for (var i = 0; i < requiredFields.length; i++) {
        if (!payload[requiredFields[i]]) {
            alert(`Required field ${requiredFields[i]} is missing!`);
            return;
        }
    }

    // set user id by using email but removed all non alphanumeric characters
    const userId = payload.email.replace(/[^a-zA-Z0-9]/g, '');

    try {
        // Check if username, email, or phone already exists
        window.firebase.databaseget(window.firebase.databaseref(window.firebase.database, 'users')).then((snapshot) => {
            if (snapshot.exists()) {
                const users = snapshot.val();
                for (const userKey in users) {
                    const user = users[userKey];
                    if (user.username === payload.username) {
                        alert('Username is already taken!');
                        return;
                    }
                    if (user.email === payload.email) {
                        alert('Email is already registered!');
                        return;
                    }
                    if (user.phone === payload.phone) {
                        alert('Phone number is already registered!');
                        return;
                    }
                }
            }
            // If no conflicts, proceed with registration
            return window.firebase.databaseset(
                window.firebase.databaseref(window.firebase.database, 'users/' + userId),
                payload
            ).then(() => {
                alert("Pendaftaran berhasil! Silahkan login!");
                showModal('authentication-login');
            });
        });
    } catch (error) {
        console.error("Error registering user:", error);
        alert("Terjadi kesalahan. Silahkan coba lagi.");
    }

}

function doLogin(event) {

    event.preventDefault();

    // Create an empty object to store the form data
    const payload = {};

    // Get all the input elements within the form
    const inputs = event.target.querySelectorAll('input');

    // Iterate over the input elements and add their values to the payload object
    inputs.forEach(input => {
        // Check if the input has a name attribute (excluding checkboxes)
        if (input.name && input.type !== 'checkbox') {
            payload[input.name] = input.value;
        } else if (input.type === 'checkbox') {
            // Handle checkboxes, adding their value only if checked
            payload[input.name] = input.checked;
        }
    });

    const requiredFields = [
        'email',
        'password',
    ]

    for (var i = 0; i < requiredFields.length; i++) {
        if (!payload[requiredFields[i]]) {
            alert(`Required field ${requiredFields[i]} is missing!`);
            return;
        }
    }

    try {
        window.firebase.databaseget(window.firebase.databaseref(window.firebase.database, 'users')).then((snapshot) => {
            if (snapshot.exists()) {
                const users = snapshot.val();
                let foundUser = null;
                // Iterate through users to find a match
                for (const userKey in users) {
                    const user = users[userKey];
                    if (user.email === payload.email && user.password === payload.password) {
                        foundUser = user;
                        break;
                    }
                }
                if (foundUser) {
                    alert("Login successful!");
                    loggedInUser = foundUser;
                    localStorage.setItem(`auth_user`, JSON.stringify(foundUser));
                    showModal('donate');
                } else {
                    alert("Invalid email or password.");
                }
            } else {
                alert("No users found.");
            }
        });
    } catch (error) {
        console.error("Error during login:", error);
        alert("An error occurred. Please try again later.");
    }

}


function selectNominal(nominal) {
    document.getElementById('nominal').value = nominal;
    document.getElementById('quantity').value = nominal;
}

function doDonate(event) {
    event.preventDefault();

    const quantity = parseInt(document.getElementById('quantity').value);
    const name = document.getElementById('name').value;
    const message = document.getElementById('message').value;
    const anonymous = document.getElementById('anonymous').checked;

    const userData = JSON.parse(localStorage.getItem('auth_user'));
    const email = userData.email;
    const donationId = new Date().getTime();

    const payload = {
        id: donationId,
        quantity,
        name,
        message,
        anonymous,
        email
    };

    try {
        return window.firebase.databaseset(
            window.firebase.databaseref(window.firebase.database, 'donations/' + donationId),
            payload
        ).then(() => {
            showModal('payment');
        });
    } catch (error) {
        console.error("Error storing donation:", error);
        alert("Terjadi kesalahan. Silahkan coba lagi.");
    }


}

function getDonations(callback) {
    window.firebase.databaseget(window.firebase.databaseref(window.firebase.database, 'donations')).then((snapshot) => {
        if (snapshot.exists()) {
            const donations = snapshot.val();
            const sortedDonations = Object.values(donations).sort((a, b) => b.id - a.id);
            callback(sortedDonations);
        } else {
            callback([]);
        }
    });
}

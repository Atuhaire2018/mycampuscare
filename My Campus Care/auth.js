var LOGIN_PAGE = "home_page2.0.html";

function getUser() {
    try {
        return JSON.parse(sessionStorage.getItem("user") || "null");
    } catch (e) {
        return null;
    }
}

function requireRole(role) {
    var current = getUser();

    if (!current || current.role !== role) {
        window.location.replace(LOGIN_PAGE);
        return null;
    }

    window.addEventListener("pageshow", function (e) {
        if (e.persisted && !getUser()) { window.location.replace(LOGIN_PAGE); }
    });

    return current;
}

function logout() {
    sessionStorage.removeItem("user");
    sessionStorage.removeItem("mcc_session");
    window.location.replace(LOGIN_PAGE);
}

var MCC = (function () {
    var USERS_KEY = "mcc_users";
    var SESSION_KEY = "mcc_session";

    function loadUsers() {
        try {
            return JSON.parse(localStorage.getItem(USERS_KEY)) || [];
        } catch (e) {
            return [];
        }
    }

    function saveUsers(users) {
        localStorage.setItem(USERS_KEY, JSON.stringify(users));
    }

    function makeSalt() {
        var bytes = new Uint8Array(16);
        (window.crypto || window.msCrypto).getRandomValues(bytes);
        return Array.prototype.map.call(bytes, function (b) {
            return ("0" + b.toString(16)).slice(-2);
        }).join("");
    }

    function fallbackHash(text) {
        var h1 = 0xdeadbeef, h2 = 0x41c6ce57;
        for (var i = 0; i < text.length; i++) {
            var ch = text.charCodeAt(i);
            h1 = Math.imul(h1 ^ ch, 2654435761);
            h2 = Math.imul(h2 ^ ch, 1597334677);
        }
        h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
        h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
        return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16);
    }

    function hashPassword(password, salt) {
        var text = salt + ":" + password;
        if (window.crypto && window.crypto.subtle && window.TextEncoder) {
            return window.crypto.subtle.digest("SHA-256", new TextEncoder().encode(text))
                .then(function (buf) {
                    return Array.prototype.map.call(new Uint8Array(buf), function (b) {
                        return ("0" + b.toString(16)).slice(-2);
                    }).join("");
                });
        }
        return Promise.resolve(fallbackHash(text));
    }

    function cleanId(v)    { return String(v || "").trim().toUpperCase(); }
    function cleanEmail(v) { return String(v || "").trim().toLowerCase(); }

    function register(details) {
        var users = loadUsers();
        var id = cleanId(details.studentId);
        var email = cleanEmail(details.email);

        for (var i = 0; i < users.length; i++) {
            if (users[i].studentId === id) {
                return Promise.reject(new Error("An account with this student ID already exists. Log in instead."));
            }
            if (users[i].email === email) {
                return Promise.reject(new Error("This email address is already registered. Log in instead."));
            }
        }

        var salt = makeSalt();
        return hashPassword(details.password, salt).then(function (hash) {
            users.push({
                fullName: details.fullName.trim(),
                studentId: id,
                email: email,
                phone: details.phone.trim(),
                gender: details.gender,
                salt: salt,
                hash: hash,
                createdAt: new Date().toISOString()
            });
            saveUsers(users);
        });
    }

    function login(identifier, password) {
        var users = loadUsers();
        var key = String(identifier || "").trim();
        var wrong = new Error("Student ID / email or password is incorrect.");
        var user = null;

        for (var i = 0; i < users.length; i++) {
            if (users[i].studentId === cleanId(key) || users[i].email === cleanEmail(key)) {
                user = users[i];
                break;
            }
        }
        if (!user) { return Promise.reject(wrong); }

        return hashPassword(password, user.salt).then(function (hash) {
            if (hash !== user.hash) { throw wrong; }
            sessionStorage.setItem(SESSION_KEY, user.studentId);
            return user;
        });
    }

    function currentUser() {
        var id = sessionStorage.getItem(SESSION_KEY);
        if (!id) { return null; }
        var users = loadUsers();
        for (var i = 0; i < users.length; i++) {
            if (users[i].studentId === id) { return users[i]; }
        }
        return null;
    }

    function requireLogin() {
        if (!currentUser()) {
            sessionStorage.removeItem(SESSION_KEY);
            window.location.replace(LOGIN_PAGE);
        }
    }

    function logout() {
        sessionStorage.removeItem(SESSION_KEY);
        sessionStorage.removeItem("user");
        window.location.href = LOGIN_PAGE;
    }

    return {
        register: register,
        login: login,
        currentUser: currentUser,
        requireLogin: requireLogin,
        logout: logout
    };
})();
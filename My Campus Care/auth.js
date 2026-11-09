function requireRole(role) {
  const user = JSON.parse(sessionStorage.getItem("user") || "null");
  if (!user || user.role !== role) {
    window.location.href = "home_page2.0.html";   // change to your login page's file name
    return null;
  }
  return user;
}

function logout() {
  sessionStorage.removeItem("user");
  window.location.href = "home_page2.0.html";     // same file name here
}
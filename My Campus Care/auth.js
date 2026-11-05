function requireRole(role) {
  const user = JSON.parse(sessionStorage.getItem("user") || "null");
  if (!user || user.role !== role) {
    window.location.href = "home.html";
    return null;
  }
  return user;
}

function logout() {
  sessionStorage.removeItem("user");
  window.location.href = "home.html";
}
const LOGIN_PAGE = "home_page2.0.html";

function getUser() {
  try {
    return JSON.parse(sessionStorage.getItem("user") || "null");
  } catch (e) {
    return null;
  }
}

function requireRole(role) {
  const current = getUser();

  if (!current || current.role !== role) {
    window.location.replace(LOGIN_PAGE);
    return null;
  }
  window.addEventListener("pageshow", function (e) {
    if (e.persisted && !getUser()) window.location.replace(LOGIN_PAGE);
  });

  return current;
}

function logout() {
  sessionStorage.removeItem("user");
  window.location.replace(LOGIN_PAGE);
}
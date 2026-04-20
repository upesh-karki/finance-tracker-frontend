// Central API configuration
// In Docker: nginx proxies /api/ → finance-tracker-api:8080
// In dev (npm start): uses relative path (set proxy in package.json or nginx)
const API_BASE = process.env.REACT_APP_API_URL || '';

export const API = {
  register:        `${API_BASE}/api/v1/members`,
  login:           `${API_BASE}/api/v1/members/login`,
  member:          (id) => `${API_BASE}/api/v1/members/${id}`,
  expenses:        (memberId) => `${API_BASE}/api/v1/expenses/member/${memberId}`,
  addExpense:      `${API_BASE}/api/v1/expenses`,
  expensesByCategory: (memberId, category) => `${API_BASE}/api/v1/expenses/member/${memberId}/category/${category}`,
  savingsGoals:    (memberId) => `${API_BASE}/api/v1/savings/goals/member/${memberId}`,
  recommendations: (memberId) => `${API_BASE}/api/v1/savings/recommendations/${memberId}`,
};

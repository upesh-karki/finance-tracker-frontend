// Central API configuration
// In Docker: nginx proxies /api/ → finance-tracker-api:8080
// In dev (npm start): uses relative path (set proxy in package.json or nginx)
const API_BASE = process.env.REACT_APP_API_URL || '';

export const API = {
  register:           `${API_BASE}/api/v1/members`,
  login:              `${API_BASE}/api/v1/members/login`,
  member:             (id) => `${API_BASE}/api/v1/members/${id}`,
  expenses:           (memberId) => `${API_BASE}/api/v1/expenses/member/${memberId}`,
  addExpense:         `${API_BASE}/api/v1/expenses`,
  expensesByCategory: (memberId, category) => `${API_BASE}/api/v1/expenses/member/${memberId}/category/${category}`,
  savingsGoals:       (memberId) => `${API_BASE}/api/v1/savings/goals/member/${memberId}`,
  recommendations:    (memberId) => `${API_BASE}/api/v1/savings/recommendations/${memberId}`,
  statementUpload:    `${API_BASE}/api/statements/upload`,
  // Accounts
  accounts:           (memberId) => `${API_BASE}/api/v1/accounts/member/${memberId}`,
  createAccount:      `${API_BASE}/api/v1/accounts`,
  deleteAccount:      (accountId) => `${API_BASE}/api/v1/accounts/${accountId}`,
  missingMonths:      (accountId) => `${API_BASE}/api/v1/accounts/${accountId}/missing-months`,
  // Income
  income:             (memberId) => `${API_BASE}/api/v1/income/member/${memberId}`,
  addIncome:          `${API_BASE}/api/v1/income`,
  deleteIncome:       (id) => `${API_BASE}/api/v1/income/${id}`,
  // Reference data (we'll hardcode for now)
};

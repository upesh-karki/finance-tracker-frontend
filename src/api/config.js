const API_BASE = process.env.REACT_APP_API_URL || '';

export const API = {
  // Legacy (keep for compat)
  register:           `${API_BASE}/api/v1/members`,
  login:              `${API_BASE}/api/v1/members/login`,
  member:             (id) => `${API_BASE}/api/v1/members/${id}`,
  // New auth endpoints
  authRegister:       `${API_BASE}/api/auth/register`,
  authLogin:          `${API_BASE}/api/auth/login`,
  authVerifyOtp:      `${API_BASE}/api/auth/verify-otp`,
  authResendOtp:      (email) => `${API_BASE}/api/auth/resend-otp?email=${encodeURIComponent(email)}`,
  authGoogle:         `${API_BASE}/api/auth/google`,
  // Expenses
  expenses:           (memberId) => `${API_BASE}/api/v1/expenses/member/${memberId}`,
  addExpense:         `${API_BASE}/api/v1/expenses`,
  expensesByCategory: (memberId, category) => `${API_BASE}/api/v1/expenses/member/${memberId}/category/${category}`,
  // Savings
  savingsGoals:       (memberId) => `${API_BASE}/api/v1/savings/goals/member/${memberId}`,
  recommendations:    (memberId) => `${API_BASE}/api/v1/savings/recommendations/${memberId}`,
  // Statements
  statementUpload:    `${API_BASE}/api/statements/upload`,
  // Accounts
  accounts:           (memberId) => `${API_BASE}/api/v1/accounts/member/${memberId}`,
  createAccount:      `${API_BASE}/api/v1/accounts`,
  deleteAccount:      (accountId) => `${API_BASE}/api/v1/accounts/${accountId}`,
  missingMonths:      (accountId) => `${API_BASE}/api/v1/accounts/${accountId}/missing-months`,
  institutions:       `${API_BASE}/api/v1/accounts/institutions`,
  markUploaded:       `${API_BASE}/api/statements/mark-uploaded`,
  statementStatus:    `${API_BASE}/api/statements/status`,
  // Income
  income:             (memberId) => `${API_BASE}/api/v1/income/member/${memberId}`,
  addIncome:          `${API_BASE}/api/v1/income`,
  deleteIncome:       (id) => `${API_BASE}/api/v1/income/${id}`,
};

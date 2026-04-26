import { AuthData } from "../../auth/AuthWrapper";
import { StatementImport } from './StatementImport';
import { API } from "../../api/config";
import React, { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

export const Private = () => {
  const { user, authFetch } = AuthData();
  const [expenses, setExpenses] = useState([]);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [income, setIncome] = useState([]);
  const [totalIncome, setTotalIncome] = useState(0);
  const [accounts, setAccounts] = useState([]);
  const [newExpense, setNewExpense] = useState({
    expenseName: '',
    amount: '',
    category: 'FOOD',
    description: '',
    expenseDate: new Date().toISOString().split('T')[0],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showImport, setShowImport] = useState(false);

  const fetchExpenses = async () => {
    try {
      const response = await authFetch(API.expenses(user.memberid), {
        method: 'GET',
      });
      if (!response.ok) throw new Error('Failed to fetch expenses');
      const result = await response.json();
      const data = result.data || [];
      setExpenses(data);
      setTotalExpenses(data.reduce((sum, e) => sum + Number(e.amount), 0));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchIncome = async () => {
    try {
      const res = await authFetch(API.income(user.memberid));
      const result = await res.json();
      const data = result.data || [];
      setIncome(data);
      setTotalIncome(data.reduce((sum, i) => sum + Number(i.amount), 0));
    } catch (err) { /* silent */ }
  };

  const fetchAccounts = async () => {
    try {
      const res = await authFetch(API.accounts(user.memberid));
      const result = await res.json();
      setAccounts(result.data || []);
    } catch (err) { /* silent */ }
  };

  useEffect(() => {
    if (user.memberid) {
      fetchExpenses();
      fetchIncome();
      fetchAccounts();
    }
  }, [user.memberid]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const response = await authFetch(API.addExpense, {
        method: 'POST',
        body: JSON.stringify({
          memberId: user.memberid,
          expenseName: newExpense.expenseName,
          amount: parseFloat(newExpense.amount),
          category: newExpense.category,
          description: newExpense.description,
          expenseDate: newExpense.expenseDate,
        })
      });

      const result = await response.json();
      if (response.ok && result.success) {
        await fetchExpenses();
        setNewExpense({ expenseName: '', amount: '', category: 'FOOD', description: '', expenseDate: new Date().toISOString().split('T')[0] });
      } else {
        throw new Error(result.message || 'Failed to add expense');
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleImportComplete = async (count) => {
    setShowImport(false);
    await fetchExpenses();
    await fetchIncome();
    setError('');
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewExpense(prev => ({ ...prev, [name]: value }));
  };

  const barChartData = {
    labels: expenses.map((e) => e.expenseName),
    datasets: [{
      label: 'Expense Amount',
      data: expenses.map((e) => e.amount),
      backgroundColor: 'rgba(54, 162, 235, 0.7)',
    }],
  };

  const pieChartData = {
    labels: [...new Set(expenses.map(e => e.category))],
    datasets: [{
      label: 'Expenses by Category',
      data: [...new Set(expenses.map(e => e.category))].map(cat =>
        expenses.filter(e => e.category === cat).reduce((sum, e) => sum + Number(e.amount), 0)
      ),
      backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#FF6384', '#C9CBCF'],
    }],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' },
      title: { display: true, text: 'Expense Breakdown' }
    }
  };

  if (loading) return <div className="page">Loading...</div>;

  return (
    <div className="page">
      <div className="header">
        <h2>Welcome Back, {user.firstname}!</h2>
        <div className="summary-card">
          <h3>Total Expenses</h3>
          <p className="total-amount">${totalExpenses.toFixed(2)}</p>
        </div>
        <div className="summary-card income-card">
          <h3>Total Income</h3>
          <p className="total-amount income-amount">${totalIncome.toFixed(2)}</p>
        </div>
      </div>

      {error && <p className="error-message">{error}</p>}

      {accounts.some(a => a.missingMonths && a.missingMonths.length > 0) && (
        <div className="missing-banner">
          <span>
            ⚠️ Some accounts have missing statements.{' '}
            <a href="/accounts" style={{color:'#f9e2af'}}>View Accounts →</a>
          </span>
        </div>
      )}

      <div className="charts-container">
        <div className="chart-wrapper">
          <Bar options={chartOptions} data={barChartData} />
        </div>
        <div className="chart-wrapper">
          <Pie data={pieChartData} options={chartOptions} />
        </div>
      </div>

      <div className="expense-section">
        <form onSubmit={handleSubmit} className="expense-form">
          <div className="expense-form-header">
            <h3>Add New Expense</h3>
            <button
              type="button"
              className="btn-import-statement"
              onClick={() => setShowImport(true)}
            >
              📄 Import Bank Statement
            </button>
          </div>
          <div className="form-row">
            <div className="input-group">
              <label>Expense Name</label>
              <input type="text" name="expenseName" value={newExpense.expenseName} onChange={handleInputChange} required />
            </div>
            <div className="input-group">
              <label>Amount ($)</label>
              <input type="number" name="amount" value={newExpense.amount} onChange={handleInputChange} step="0.01" required />
            </div>
            <div className="input-group">
              <label>Category</label>
              <select name="category" value={newExpense.category} onChange={handleInputChange}>
                <option value="FOOD">Food</option>
                <option value="TRANSPORT">Transport</option>
                <option value="UTILITIES">Utilities</option>
                <option value="SUBSCRIPTIONS">Subscriptions</option>
                <option value="ENTERTAINMENT">Entertainment</option>
                <option value="TRAVEL">Travel</option>
                <option value="HEALTH">Health</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <div className="input-group">
              <label>Date</label>
              <input type="date" name="expenseDate" value={newExpense.expenseDate} onChange={handleInputChange} required />
            </div>
            <div className="input-group">
              <label>Description</label>
              <input type="text" name="description" value={newExpense.description} onChange={handleInputChange} />
            </div>
            <button type="submit" className="add-button">Add Expense</button>
          </div>
        </form>

        <div className="expense-table">
          <h3>Recent Expenses</h3>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Amount</th>
                <th>Category</th>
                <th>Date</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((expense, index) => (
                <tr key={index}>
                  <td>{expense.expenseName}</td>
                  <td>${Number(expense.amount).toFixed(2)}</td>
                  <td>{expense.category}</td>
                  <td>{expense.expenseDate}</td>
                  <td>{expense.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {showImport && (
        <StatementImport
          memberId={user.memberid}
          accounts={accounts}
          onImportComplete={handleImportComplete}
          onClose={() => setShowImport(false)}
        />
      )}
    </div>
  );
};

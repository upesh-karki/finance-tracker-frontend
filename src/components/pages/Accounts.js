import React, { useState, useEffect } from 'react';
import { AuthData } from '../../auth/AuthWrapper';
import { API } from '../../api/config';

const ACCOUNT_TYPES = [
  { code: 'CHEQUING', label: 'Chequing Account' },
  { code: 'SAVINGS', label: 'Savings Account' },
  { code: 'CREDIT_CARD', label: 'Credit Card' },
  { code: 'INVESTMENT', label: 'Investment Account' },
];

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export const Accounts = () => {
  const { user, authFetch } = AuthData();
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [newAccount, setNewAccount] = useState({
    nickname: '',
    institutionName: '',
    accountTypeCode: 'CHEQUING',
    openedDate: '',
  });

  const fetchAccounts = async () => {
    try {
      const res = await authFetch(API.accounts(user.memberid));
      const result = await res.json();
      setAccounts(result.data || []);
    } catch (e) {
      setError('Failed to load accounts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user.memberid) fetchAccounts();
  }, [user.memberid]);

  const handleAddAccount = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const res = await authFetch(API.createAccount, {
        method: 'POST',
        body: JSON.stringify({
          memberId: user.memberid,
          nickname: newAccount.nickname,
          institutionName: newAccount.institutionName,
          accountTypeCode: newAccount.accountTypeCode,
          openedDate: newAccount.openedDate || null,
        }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || 'Failed to add account');
      setNewAccount({ nickname: '', institutionName: '', accountTypeCode: 'CHEQUING', openedDate: '' });
      setShowAddForm(false);
      await fetchAccounts();
    } catch (e) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (accountId) => {
    if (!window.confirm('Remove this account?')) return;
    try {
      await authFetch(API.deleteAccount(accountId), { method: 'DELETE' });
      await fetchAccounts();
    } catch (e) {
      setError('Failed to remove account');
    }
  };

  const totalMissing = accounts.reduce((sum, a) => sum + (a.missingMonths?.length || 0), 0);

  if (loading) return <div className="page">Loading...</div>;

  return (
    <div className="page">
      <div className="page-header">
        <h2>Financial Accounts</h2>
        <button className="btn-import-statement" onClick={() => setShowAddForm(!showAddForm)}>
          {showAddForm ? '✕ Cancel' : '+ Add Account'}
        </button>
      </div>

      {totalMissing > 0 && (
        <div className="missing-banner">
          <span>⚠️ You have <strong>{totalMissing}</strong> missing statement{totalMissing !== 1 ? 's' : ''}. Upload them from the Dashboard to keep your data complete.</span>
        </div>
      )}

      {error && <p className="error-message">{error}</p>}

      {showAddForm && (
        <form className="add-account-form" onSubmit={handleAddAccount}>
          <h3>Add New Account</h3>
          <div className="form-row">
            <div className="input-group">
              <label>Nickname</label>
              <input
                type="text"
                placeholder="e.g. TD Everyday Chequing"
                value={newAccount.nickname}
                onChange={e => setNewAccount(p => ({ ...p, nickname: e.target.value }))}
                required
              />
            </div>
            <div className="input-group">
              <label>Institution</label>
              <input
                type="text"
                placeholder="e.g. TD Bank"
                value={newAccount.institutionName}
                onChange={e => setNewAccount(p => ({ ...p, institutionName: e.target.value }))}
                required
              />
            </div>
            <div className="input-group">
              <label>Account Type</label>
              <select
                value={newAccount.accountTypeCode}
                onChange={e => setNewAccount(p => ({ ...p, accountTypeCode: e.target.value }))}
              >
                {ACCOUNT_TYPES.map(t => (
                  <option key={t.code} value={t.code}>{t.label}</option>
                ))}
              </select>
            </div>
            <div className="input-group">
              <label>Date Opened <span className="optional">(optional)</span></label>
              <input
                type="date"
                value={newAccount.openedDate}
                onChange={e => setNewAccount(p => ({ ...p, openedDate: e.target.value }))}
              />
            </div>
          </div>
          <p className="form-hint">
            💡 If opened before this year, we'll track statements from <strong>Jan {new Date().getFullYear()}</strong> onwards. You can optionally upload older statements too.
          </p>
          <div className="form-actions">
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? 'Adding...' : 'Add Account'}
            </button>
          </div>
        </form>
      )}

      {accounts.length === 0 && !showAddForm ? (
        <div className="empty-state">
          <p>🏦 No accounts added yet.</p>
          <p>Add your bank accounts and credit cards to start tracking your statements.</p>
          <button className="btn-primary" onClick={() => setShowAddForm(true)}>Add Your First Account</button>
        </div>
      ) : (
        <div className="accounts-list">
          {accounts.map(account => (
            <div key={account.id} className="account-card">
              <div className="account-card-header">
                <div className="account-info">
                  <h3>{account.nickname}</h3>
                  <span className="account-institution">{account.institutionName}</span>
                  <span className={`account-type-badge ${account.accountTypeCode.toLowerCase().replace('_','-')}`}>
                    {ACCOUNT_TYPES.find(t => t.code === account.accountTypeCode)?.label || account.accountTypeCode}
                  </span>
                </div>
                <div className="account-actions">
                  <button className="btn-delete-row" onClick={() => handleDelete(account.id)} title="Remove account">🗑</button>
                </div>
              </div>

              <div className="account-tracking-info">
                <span className="tracking-label">Tracking from: <strong>{account.trackingStartDate}</strong></span>
              </div>

              {account.missingMonths && account.missingMonths.length > 0 && (
                <div className="missing-months">
                  <p className="missing-months-label">⚠️ Missing statements:</p>
                  <div className="missing-months-pills">
                    {account.missingMonths.map(m => (
                      <span key={`${m.year}-${m.month}`} className="missing-pill">
                        {MONTH_NAMES[m.month - 1]} {m.year}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {(!account.missingMonths || account.missingMonths.length === 0) && (
                <div className="all-uploaded">
                  <span>✅ All statements uploaded</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

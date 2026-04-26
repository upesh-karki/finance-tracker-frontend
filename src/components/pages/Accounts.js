import React, { useState, useEffect } from 'react';
import { AuthData } from '../../auth/AuthWrapper';
import { API } from '../../api/config';
import { StatementImport } from './StatementImport';

const ACCOUNT_TYPES = [
  { code: 'CHEQUING',    label: 'Chequing',    color: '#89b4fa', icon: '🏦' },
  { code: 'SAVINGS',     label: 'Savings',     color: '#a6e3a1', icon: '💰' },
  { code: 'CREDIT_CARD', label: 'Credit Card', color: '#f38ba8', icon: '💳' },
  { code: 'INVESTMENT',  label: 'Investment',  color: '#f9e2af', icon: '📈' },
];

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export const Accounts = () => {
  const { user, authFetch } = AuthData();
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [importAccount, setImportAccount] = useState(null); // account to import statement for
  const [institutions, setInstitutions] = useState([]);
  const [newAccount, setNewAccount] = useState({
    nickname: '',
    institutionCode: '',
    institutionName: '',
    accountTypeCode: 'CHEQUING',
    openedDate: '',
  });

  const fetchInstitutions = async () => {
    try {
      const res = await fetch(API.institutions);
      const result = await res.json();
      setInstitutions(result.data || []);
    } catch (e) { /* silent */ }
  };

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

  useEffect(() => { if (user.memberid) { fetchAccounts(); fetchInstitutions(); } }, [user.memberid]);

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
      setNewAccount({ nickname: '', institutionCode: '', institutionName: '', accountTypeCode: 'CHEQUING', openedDate: '' });
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

  const handleImportComplete = async () => {
    setImportAccount(null);
    await fetchAccounts(); // refresh missing months
  };

  const totalMissing = accounts.reduce((sum, a) => sum + (a.missingMonths?.length || 0), 0);

  if (loading) return <div className="page"><div className="loading-state"><div className="spinner" /><p>Loading accounts...</p></div></div>;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2 style={{margin:0,color:'#cdd6f4'}}>Financial Accounts</h2>
          <p style={{margin:'4px 0 0',color:'#6c7086',fontSize:'0.85rem'}}>{accounts.length} account{accounts.length !== 1 ? 's' : ''} configured</p>
        </div>
        <button className="btn-import-statement" onClick={() => setShowAddForm(!showAddForm)}>
          {showAddForm ? '✕ Cancel' : '+ Add Account'}
        </button>
      </div>

      {totalMissing > 0 && (
        <div className="missing-banner">
          ⚠️ <strong>{totalMissing}</strong> missing statement{totalMissing !== 1 ? 's' : ''} across your accounts. Upload them below to keep your data complete.
        </div>
      )}

      {error && <p className="auth-error">{error}</p>}

      {showAddForm && (
        <form className="add-account-form" onSubmit={handleAddAccount}>
          <h3>Add New Account</h3>
          <div className="form-row">
            <div className="input-group">
              <label>Nickname</label>
              <input type="text" placeholder="e.g. TD Everyday Chequing"
                value={newAccount.nickname} onChange={e => setNewAccount(p => ({...p, nickname: e.target.value}))} required />
            </div>
            <div className="input-group">
              <label>Institution</label>
              <select
                value={newAccount.institutionCode}
                onChange={e => {
                  const inst = institutions.find(i => i.code === e.target.value);
                  setNewAccount(p => ({
                    ...p,
                    institutionCode: e.target.value,
                    institutionName: inst?.name || '',
                  }));
                }}
                required
              >
                <option value="">— Select institution —</option>
                {institutions.map(i => (
                  <option key={i.code} value={i.code}>{i.name}{i.country ? ` (${i.country})` : ''}</option>
                ))}
              </select>
            </div>
            <div className="input-group">
              <label>Account Type</label>
              <select value={newAccount.accountTypeCode} onChange={e => setNewAccount(p => ({...p, accountTypeCode: e.target.value}))}>
                {ACCOUNT_TYPES.map(t => <option key={t.code} value={t.code}>{t.icon} {t.label}</option>)}
              </select>
            </div>
            <div className="input-group">
              <label>Date Opened <span className="optional">(optional)</span></label>
              <input type="date" value={newAccount.openedDate} onChange={e => setNewAccount(p => ({...p, openedDate: e.target.value}))} />
            </div>
          </div>
          <p className="form-hint">💡 If opened before this year, we'll track statements from <strong>Jan {new Date().getFullYear()}</strong>. You can upload older statements anytime.</p>
          <div className="form-actions">
            <button type="submit" className="btn-primary" disabled={submitting}>{submitting ? 'Adding...' : 'Add Account'}</button>
          </div>
        </form>
      )}

      {accounts.length === 0 && !showAddForm ? (
        <div className="empty-state">
          <div style={{fontSize:'3rem',marginBottom:16}}>🏦</div>
          <h3 style={{color:'#cdd6f4',margin:'0 0 8px'}}>No accounts yet</h3>
          <p>Add your bank accounts and credit cards to start importing statements.</p>
          <button className="btn-primary" style={{marginTop:20}} onClick={() => setShowAddForm(true)}>Add Your First Account</button>
        </div>
      ) : (
        <div className="accounts-list">
          {accounts.map(account => {
            const typeInfo = ACCOUNT_TYPES.find(t => t.code === account.accountTypeCode) || ACCOUNT_TYPES[0];
            const hasMissing = account.missingMonths?.length > 0;
            return (
              <div key={account.id} className="account-card-v2">
                {/* Card header */}
                <div className="account-card-v2-header">
                  <div className="account-card-v2-icon" style={{background: `${typeInfo.color}18`, border: `1px solid ${typeInfo.color}30`}}>
                    <span>{typeInfo.icon}</span>
                  </div>
                  <div className="account-card-v2-info">
                    <div className="account-card-v2-name">{account.nickname}</div>
                    <div className="account-card-v2-institution">{account.institutionName}</div>
                  </div>
                  <div className="account-card-v2-right">
                    <span className="account-type-badge-v2" style={{background:`${typeInfo.color}18`, color: typeInfo.color, borderColor:`${typeInfo.color}30`}}>
                      {typeInfo.label}
                    </span>
                    <div className="account-card-v2-actions">
                      <button
                        className="btn-upload-statement"
                        onClick={() => setImportAccount(account)}
                        title="Upload Statement"
                      >
                        📄 Upload Statement
                      </button>
                      <button className="btn-delete-row" onClick={() => handleDelete(account.id)} title="Remove account">🗑</button>
                    </div>
                  </div>
                </div>

                {/* Tracking info */}
                <div className="account-card-v2-meta">
                  <span>Tracking from <strong>{account.trackingStartDate}</strong></span>
                </div>

                {/* Missing months */}
                {hasMissing ? (
                  <div className="account-missing-section">
                    <span className="missing-months-label">⚠️ Missing statements — click Upload Statement to add:</span>
                    <div className="missing-months-pills">
                      {account.missingMonths.map(m => (
                        <span
                          key={`${m.year}-${m.month}`}
                          className="missing-pill clickable-pill"
                          onClick={() => setImportAccount(account)}
                          title="Upload statement for this month"
                        >
                          {MONTH_NAMES[m.month - 1]} {m.year}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="account-all-good">
                    <span>✅ All statements uploaded — you're up to date</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Statement Import Modal — triggered per account */}
      {importAccount && (
        <StatementImport
          memberId={user.memberid}
          accounts={accounts}
          preSelectedAccountId={importAccount.id}
          onImportComplete={handleImportComplete}
          onClose={() => setImportAccount(null)}
        />
      )}
    </div>
  );
};

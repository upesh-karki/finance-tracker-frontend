import React, { useState, useRef } from 'react';
import { API } from '../../api/config';

const EXPENSE_CATEGORIES = ['FOOD', 'TRANSPORT', 'UTILITIES', 'SUBSCRIPTIONS', 'ENTERTAINMENT', 'TRAVEL', 'HEALTH', 'OTHER'];
const INCOME_CATEGORIES = ['SALARY', 'FREELANCE', 'REFUND', 'TRANSFER', 'OTHER'];

export const StatementImport = ({ memberId, accounts = [], onImportComplete, onClose }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null); // full response
  const [expenses, setExpenses] = useState([]);
  const [income, setIncome] = useState([]);
  const [step, setStep] = useState('upload'); // 'upload' | 'review' | 'importing'
  const [activeTab, setActiveTab] = useState('expenses');
  const [error, setError] = useState('');
  const [importProgress, setImportProgress] = useState({ done: 0, total: 0 });
  const fileInputRef = useRef(null);

  const selectedAccount = accounts.find(a => String(a.id) === String(selectedAccountId));

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file);
      setError('');
    } else {
      setError('Please select a PDF file.');
    }
  };

  const uploadAndExtract = async (file) => {
    setUploading(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('file', file);

      let url = API.statementUpload;
      if (selectedAccount?.accountTypeCode) {
        url += `?accountTypeCode=${selectedAccount.accountTypeCode}`;
      }

      const response = await fetch(url, { method: 'POST', body: formData });
      const data = await response.json();

      if (!response.ok || !data.data) {
        throw new Error(data.message || 'Failed to extract transactions');
      }

      const r = data.data;
      setResult(r);

      setExpenses((r.expenses || []).map((tx, idx) => ({
        ...tx, _id: `e-${idx}`, _selected: true,
        expenseName: tx.description || '',
        expenseDate: tx.date || new Date().toISOString().split('T')[0],
        category: tx.suggestedCategory || 'OTHER',
      })));

      setIncome((r.income || []).map((tx, idx) => ({
        ...tx, _id: `i-${idx}`, _selected: true,
        sourceName: tx.description || '',
        incomeDate: tx.date || new Date().toISOString().split('T')[0],
        incomeCategoryCode: tx.suggestedCategory || 'OTHER',
      })));

      setStep('review');
      setActiveTab((r.expenses || []).length > 0 ? 'expenses' : 'income');
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleUpload = () => { if (selectedFile) uploadAndExtract(selectedFile); };
  const handleRegenerate = () => { if (selectedFile) { setStep('upload'); uploadAndExtract(selectedFile); } };

  const updateExpense = (id, field, value) =>
    setExpenses(prev => prev.map(t => t._id === id ? { ...t, [field]: value } : t));
  const updateIncome = (id, field, value) =>
    setIncome(prev => prev.map(t => t._id === id ? { ...t, [field]: value } : t));
  const toggleExpense = (id) =>
    setExpenses(prev => prev.map(t => t._id === id ? { ...t, _selected: !t._selected } : t));
  const toggleIncome = (id) =>
    setIncome(prev => prev.map(t => t._id === id ? { ...t, _selected: !t._selected } : t));
  const deleteExpense = (id) => setExpenses(prev => prev.filter(t => t._id !== id));
  const deleteIncome = (id) => setIncome(prev => prev.filter(t => t._id !== id));
  const selectAllExpenses = (v) => setExpenses(prev => prev.map(t => ({ ...t, _selected: v })));
  const selectAllIncome = (v) => setIncome(prev => prev.map(t => ({ ...t, _selected: v })));

  const selectedExpenses = expenses.filter(t => t._selected);
  const selectedIncome = income.filter(t => t._selected);
  const totalSelected = selectedExpenses.length + selectedIncome.length;

  const handleConfirmImport = async () => {
    setStep('importing');
    setImportProgress({ done: 0, total: totalSelected });
    let done = 0;
    const failed = [];
    const accountId = selectedAccount?.id || null;

    for (const tx of selectedExpenses) {
      try {
        const res = await fetch(API.addExpense, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            memberId, accountId,
            expenseName: tx.expenseName,
            amount: parseFloat(tx.amount),
            category: tx.category,
            description: tx.description || '',
            expenseDate: tx.expenseDate,
          }),
        });
        if (!res.ok) throw new Error('Failed');
        done++;
        setImportProgress({ done, total: totalSelected });
      } catch { failed.push(tx.expenseName); }
    }

    for (const tx of selectedIncome) {
      try {
        const res = await fetch(API.addIncome, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            memberId, accountId,
            sourceName: tx.sourceName,
            amount: parseFloat(tx.amount),
            incomeCategoryCode: tx.incomeCategoryCode,
            incomeDate: tx.incomeDate,
            description: tx.description || '',
          }),
        });
        if (!res.ok) throw new Error('Failed');
        done++;
        setImportProgress({ done, total: totalSelected });
      } catch { failed.push(tx.sourceName); }
    }

    if (failed.length > 0) setError(`${done} imported. Failed: ${failed.join(', ')}`);
    onImportComplete(done);
  };

  return (
    <div className="modal-overlay" onClick={e => e.target.classList.contains('modal-overlay') && onClose()}>
      <div className="modal-container statement-import-modal">
        <div className="modal-header">
          <h3>📄 Import Bank Statement</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        {(step === 'upload' || uploading) && (
          <div className="modal-body upload-step">
            {!uploading ? (
              <>
                <p className="upload-hint">Upload a PDF bank statement. Your data stays local — processed by your on-device AI.</p>

                {accounts.length > 0 && (
                  <div className="input-group" style={{ marginBottom: 20 }}>
                    <label>Account <span className="optional">(optional — helps AI understand statement type)</span></label>
                    <select
                      value={selectedAccountId}
                      onChange={e => setSelectedAccountId(e.target.value)}
                      className="table-select"
                      style={{ width: '100%', padding: '8px 10px' }}
                    >
                      <option value="">— Select account (optional) —</option>
                      {accounts.map(a => (
                        <option key={a.id} value={a.id}>{a.nickname} ({a.institutionName})</option>
                      ))}
                    </select>
                  </div>
                )}

                <div
                  className="drop-zone"
                  onClick={() => fileInputRef.current.click()}
                  onDragOver={e => e.preventDefault()}
                  onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) { setSelectedFile(f); setError(''); } }}
                >
                  <div className="drop-zone-icon">📁</div>
                  <p>{selectedFile ? selectedFile.name : 'Click or drag & drop a PDF here'}</p>
                  <input ref={fileInputRef} type="file" accept="application/pdf" onChange={handleFileChange} style={{ display: 'none' }} />
                </div>

                {error && <p className="error-message">{error}</p>}
                <div className="modal-actions">
                  <button className="btn-secondary" onClick={onClose}>Cancel</button>
                  <button className="btn-primary" onClick={handleUpload} disabled={!selectedFile}>Extract Transactions</button>
                </div>
              </>
            ) : (
              <div className="loading-state">
                <div className="spinner" />
                <p>Extracting transactions with local AI...</p>
                <p className="loading-hint">This may take 30–60 seconds.</p>
              </div>
            )}
          </div>
        )}

        {step === 'review' && (
          <div className="modal-body review-step">
            <div className="review-header">
              <p className="review-summary">
                Found <strong>{result?.expenseCount || 0}</strong> expenses &nbsp;·&nbsp;
                <strong>{result?.incomeCount || 0}</strong> income &nbsp;·&nbsp;
                <strong>{result?.creditCardPaymentCount || 0}</strong> CC payments
                &nbsp;·&nbsp; <strong>{totalSelected}</strong> selected
              </p>
              <button className="btn-regenerate" onClick={handleRegenerate}>🔄 Regenerate</button>
            </div>

            <div className="review-tabs">
              <button
                className={`review-tab ${activeTab === 'expenses' ? 'active' : ''}`}
                onClick={() => setActiveTab('expenses')}
              >
                Expenses ({expenses.length})
              </button>
              <button
                className={`review-tab ${activeTab === 'income' ? 'active' : ''}`}
                onClick={() => setActiveTab('income')}
              >
                Income ({income.length})
              </button>
              {result?.creditCardPayments?.length > 0 && (
                <button
                  className={`review-tab ${activeTab === 'cc' ? 'active' : ''}`}
                  onClick={() => setActiveTab('cc')}
                >
                  CC Payments ({result.creditCardPayments.length})
                </button>
              )}
            </div>

            {error && <p className="error-message">{error}</p>}

            {activeTab === 'expenses' && (
              <div className="transactions-table-wrapper">
                <table className="transactions-table">
                  <thead>
                    <tr>
                      <th><input type="checkbox" checked={selectedExpenses.length === expenses.length && expenses.length > 0} onChange={e => selectAllExpenses(e.target.checked)} /></th>
                      <th>Description</th>
                      <th>Amount ($)</th>
                      <th>Category</th>
                      <th>Date</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {expenses.map(tx => (
                      <tr key={tx._id} className={!tx._selected ? 'row-deselected' : ''}>
                        <td><input type="checkbox" checked={tx._selected} onChange={() => toggleExpense(tx._id)} /></td>
                        <td><input type="text" value={tx.expenseName} onChange={e => updateExpense(tx._id, 'expenseName', e.target.value)} className="table-input" /></td>
                        <td><input type="number" value={tx.amount} onChange={e => updateExpense(tx._id, 'amount', e.target.value)} className="table-input amount-input" step="0.01" /></td>
                        <td>
                          <select value={tx.category} onChange={e => updateExpense(tx._id, 'category', e.target.value)} className="table-select">
                            {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                        </td>
                        <td><input type="date" value={tx.expenseDate} onChange={e => updateExpense(tx._id, 'expenseDate', e.target.value)} className="table-input" /></td>
                        <td><button className="btn-delete-row" onClick={() => deleteExpense(tx._id)}>✕</button></td>
                      </tr>
                    ))}
                    {expenses.length === 0 && <tr><td colSpan={6} style={{textAlign:'center', color:'#6c7086', padding:20}}>No expenses found</td></tr>}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'income' && (
              <div className="transactions-table-wrapper">
                <table className="transactions-table">
                  <thead>
                    <tr>
                      <th><input type="checkbox" checked={selectedIncome.length === income.length && income.length > 0} onChange={e => selectAllIncome(e.target.checked)} /></th>
                      <th>Source</th>
                      <th>Amount ($)</th>
                      <th>Category</th>
                      <th>Date</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {income.map(tx => (
                      <tr key={tx._id} className={!tx._selected ? 'row-deselected' : ''}>
                        <td><input type="checkbox" checked={tx._selected} onChange={() => toggleIncome(tx._id)} /></td>
                        <td><input type="text" value={tx.sourceName} onChange={e => updateIncome(tx._id, 'sourceName', e.target.value)} className="table-input" /></td>
                        <td><input type="number" value={tx.amount} onChange={e => updateIncome(tx._id, 'amount', e.target.value)} className="table-input amount-input" step="0.01" /></td>
                        <td>
                          <select value={tx.incomeCategoryCode} onChange={e => updateIncome(tx._id, 'incomeCategoryCode', e.target.value)} className="table-select">
                            {INCOME_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                        </td>
                        <td><input type="date" value={tx.incomeDate} onChange={e => updateIncome(tx._id, 'incomeDate', e.target.value)} className="table-input" /></td>
                        <td><button className="btn-delete-row" onClick={() => deleteIncome(tx._id)}>✕</button></td>
                      </tr>
                    ))}
                    {income.length === 0 && <tr><td colSpan={6} style={{textAlign:'center', color:'#6c7086', padding:20}}>No income found</td></tr>}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'cc' && (
              <div className="transactions-table-wrapper">
                <table className="transactions-table">
                  <thead>
                    <tr><th>Description</th><th>Amount ($)</th><th>Date</th><th>Note</th></tr>
                  </thead>
                  <tbody>
                    {(result?.creditCardPayments || []).map((tx, i) => (
                      <tr key={i}>
                        <td>{tx.description}</td>
                        <td>${parseFloat(tx.amount).toFixed(2)}</td>
                        <td>{tx.date}</td>
                        <td><span style={{color:'#6c7086', fontSize:'0.78rem'}}>Not imported — CC payment</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="modal-actions">
              <button className="btn-secondary" onClick={onClose}>Cancel</button>
              <button className="btn-primary" onClick={handleConfirmImport} disabled={totalSelected === 0}>
                Import {totalSelected} Record{totalSelected !== 1 ? 's' : ''}
              </button>
            </div>
          </div>
        )}

        {step === 'importing' && (
          <div className="modal-body loading-state">
            <div className="spinner" />
            <p>Importing {importProgress.done} / {importProgress.total}...</p>
            {error && <p className="error-message">{error}</p>}
          </div>
        )}
      </div>
    </div>
  );
};

import React, { useState, useRef } from 'react';
import { API } from '../../api/config';
import { AuthData } from '../../auth/AuthWrapper';

// Unified category list — all types in one dropdown
const ALL_CATEGORIES = [
  // Expenses
  { value: 'FOOD',          label: '🍔 Food & Dining',       group: 'Expense' },
  { value: 'TRANSPORT',     label: '🚗 Transport',           group: 'Expense' },
  { value: 'UTILITIES',     label: '💡 Utilities',           group: 'Expense' },
  { value: 'SUBSCRIPTIONS', label: '📱 Subscriptions',       group: 'Expense' },
  { value: 'ENTERTAINMENT', label: '🎬 Entertainment',       group: 'Expense' },
  { value: 'TRAVEL',        label: '✈️ Travel',              group: 'Expense' },
  { value: 'HEALTH',        label: '🏥 Health & Fitness',    group: 'Expense' },
  { value: 'OTHER',         label: '📦 Other Expense',       group: 'Expense' },
  // Income
  { value: 'SALARY',        label: '💼 Salary',              group: 'Income' },
  { value: 'FREELANCE',     label: '🧑‍💻 Freelance',          group: 'Income' },
  { value: 'REFUND',        label: '↩️ Refund',              group: 'Income' },
  { value: 'INCOME_OTHER',  label: '💰 Other Income',        group: 'Income' },
  // Neutral
  { value: 'TRANSFER',      label: '🔁 Transfer',            group: 'Neutral' },
  { value: 'CC_PAYMENT',    label: '💳 CC Payment',          group: 'Neutral' },
  // Investment (own section — these go to investments, never expense/income)
  { value: 'INVESTMENT',    label: '📈 Investment',          group: 'Investment' },
];

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

/** Returns the year/month that the majority of transactions fall in. */
const detectStatementMonth = (transactions) => {
  const counts = {};
  for (const tx of transactions) {
    const d = new Date(tx.expenseDate || tx.incomeDate || tx.date);
    if (isNaN(d)) continue;
    const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
    counts[key] = (counts[key] || 0) + 1;
  }
  const best = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  if (!best) return null;
  const [yr, mo] = best[0].split('-').map(Number);
  return { year: yr, month: mo };
};

/** Format amount for display based on displayType */
const formatAmount = (amount, displayType) => {
  const abs = Math.abs(parseFloat(amount) || 0).toFixed(2);
  if (displayType === 'INCOME')      return { text: `+$${abs}`,    cls: 'amount-positive' };
  if (displayType === 'EXPENSE')     return { text: `-$${abs}`,    cls: 'amount-negative' };
  if (displayType === 'NEUTRAL')     return { text: `($${abs})`,   cls: 'amount-neutral'  };
  if (displayType === 'INVESTMENT')  return { text: `$${abs}`,     cls: 'amount-investment' };
  return { text: `$${abs}`, cls: '' };
};

/** Map a raw ExtractedTransaction to our unified row shape */
const toRow = (tx, idx) => ({
  _id:          `tx-${idx}`,
  _selected:    tx.displayType !== 'NEUTRAL', // neutrals unchecked by default
  displayType:  tx.displayType || 'EXPENSE',
  date:         tx.date || new Date().toISOString().split('T')[0],
  description:  tx.description || '',
  amount:       Math.abs(parseFloat(tx.amount) || 0),
  category:     tx.suggestedCategory || (tx.displayType === 'INCOME' ? 'SALARY' : 'OTHER'),
  // keep originals for import routing
  transactionType: tx.transactionType,
  isTransfer:      tx.isTransfer,
  isCreditCardPayment: tx.isCreditCardPayment,
});

export const StatementImport = ({ memberId, accounts = [], preSelectedAccountId, onImportComplete, onClose }) => {
  const [selectedFile, setSelectedFile]           = useState(null);
  const [selectedAccountId, setSelectedAccountId] = useState(preSelectedAccountId ? String(preSelectedAccountId) : '');
  const [uploading, setUploading]                 = useState(false);
  const [result, setResult]                       = useState(null);
  const [rows, setRows]                           = useState([]);       // unified table
  const [investments, setInvestments]             = useState([]);       // investment section
  const [step, setStep]                           = useState('upload');
  const [showInvestments, setShowInvestments]     = useState(false);
  const [error, setError]                         = useState('');
  const [importProgress, setImportProgress]       = useState({ done: 0, total: 0 });
  const [alreadyUploaded, setAlreadyUploaded]     = useState(null);
  const fileInputRef = useRef(null);

  const { user, authFetch } = AuthData();
  const selectedAccount  = accounts.find(a => String(a.id) === String(selectedAccountId));
  const institutionName  = selectedAccount?.institutionName || selectedAccount?.institutionCode || null;

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type === 'application/pdf') { setSelectedFile(file); setError(''); }
    else setError('Please select a PDF file.');
  };

  const uploadAndExtract = async (file) => {
    setUploading(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      let url = API.statementUpload;
      if (selectedAccount?.accountTypeCode) url += `?accountTypeCode=${selectedAccount.accountTypeCode}`;

      const response = await fetch(url, {
        method: 'POST', body: formData,
        headers: user?.token ? { 'Authorization': `Bearer ${user.token}` } : {},
      });
      const data = await response.json();
      if (!response.ok || !data.data) throw new Error(data.message || 'Failed to extract transactions');

      const r = data.data;
      setResult(r);

      // Use new flat transactions list; fall back to building it from legacy lists
      const rawTxs = r.transactions?.length > 0
        ? r.transactions
        : [
            ...(r.expenses  || []).map(t => ({ ...t, displayType: 'EXPENSE'  })),
            ...(r.income    || []).map(t => ({ ...t, displayType: 'INCOME'   })),
            ...(r.transfers || []).map(t => ({ ...t, displayType: 'NEUTRAL'  })),
          ];

      setRows(rawTxs.map(toRow));
      setInvestments((r.investments || []).map((t, i) => toRow({ ...t, displayType: 'INVESTMENT' }, `inv-${i}`)));

      // Check already-uploaded status
      if (selectedAccount) {
        const allForDetect = rawTxs.map(t => ({ expenseDate: t.date }));
        const detected = detectStatementMonth(allForDetect);
        if (detected) {
          try {
            const params = new URLSearchParams({ accountId: selectedAccount.id, year: detected.year, month: detected.month });
            const statusRes = await fetch(`${API.statementStatus}?${params}`, {
              headers: user?.token ? { 'Authorization': `Bearer ${user.token}` } : {},
            });
            const statusData = await statusRes.json();
            if (statusData.data?.status === 'UPLOADED') {
              setAlreadyUploaded({ year: detected.year, month: detected.month, count: statusData.data.transactionCount });
            }
          } catch (e) { /* non-critical */ }
        }
      }

      setStep('review');
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleUpload      = () => { if (selectedFile) uploadAndExtract(selectedFile); };
  const handleRegenerate  = () => { if (selectedFile) { setStep('upload'); uploadAndExtract(selectedFile); } };

  const updateRow = (id, field, value) =>
    setRows(prev => prev.map(r => r._id === id ? { ...r, [field]: value } : r));
  const toggleRow = (id) =>
    setRows(prev => prev.map(r => r._id === id ? { ...r, _selected: !r._selected } : r));
  const deleteRow = (id) => setRows(prev => prev.filter(r => r._id !== id));
  const selectAll = (v)  => setRows(prev => prev.map(r => ({ ...r, _selected: v })));

  const selectedRows = rows.filter(r => r._selected);
  const totalSelected = selectedRows.length;

  // When user changes category to INVESTMENT, reclassify as displayType INVESTMENT
  const handleCategoryChange = (id, value) => {
    if (value === 'INVESTMENT') {
      // Move row to investments section
      const row = rows.find(r => r._id === id);
      if (row) {
        setInvestments(prev => [...prev, { ...row, category: 'INVESTMENT', displayType: 'INVESTMENT', _selected: true }]);
        setRows(prev => prev.filter(r => r._id !== id));
      }
    } else {
      // Reclassify displayType based on category group
      const cat = ALL_CATEGORIES.find(c => c.value === value);
      let displayType = 'EXPENSE';
      if (cat?.group === 'Income')   displayType = 'INCOME';
      if (cat?.group === 'Neutral')  displayType = 'NEUTRAL';
      updateRow(id, 'category', value);
      updateRow(id, 'displayType', displayType);
    }
  };

  const handleConfirmImport = async () => {
    setStep('importing');
    setImportProgress({ done: 0, total: totalSelected });
    let done = 0;
    const failed = [];
    const accountId = selectedAccount?.id || null;

    for (const tx of selectedRows) {
      try {
        if (tx.displayType === 'INCOME') {
          const res = await authFetch(API.addIncome, {
            method: 'POST',
            body: JSON.stringify({
              memberId, accountId, institutionName,
              sourceName:         tx.description,
              amount:             tx.amount,
              incomeCategoryCode: tx.category === 'INCOME_OTHER' ? 'OTHER' : tx.category,
              incomeDate:         tx.date,
              description:        tx.description || '',
            }),
          });
          if (!res.ok) throw new Error('Failed');
        } else if (tx.displayType === 'EXPENSE') {
          const res = await authFetch(API.addExpense, {
            method: 'POST',
            body: JSON.stringify({
              memberId, accountId, institutionName,
              expenseName:  tx.description,
              amount:       tx.amount,
              category:     tx.category,
              description:  tx.description || '',
              expenseDate:  tx.date,
            }),
          });
          if (!res.ok) throw new Error('Failed');
        }
        // NEUTRAL rows that are selected are skipped (not imported) — they just get marked
        done++;
        setImportProgress({ done, total: totalSelected });
      } catch { failed.push(tx.description); }
    }

    if (failed.length > 0) setError(`${done} imported. ${failed.length} failed: ${failed.join(', ')}`);

    // Always mark the statement month as uploaded
    if (selectedAccount) {
      const detected = detectStatementMonth(selectedRows);
      if (detected) {
        try {
          const params = new URLSearchParams({
            accountId: selectedAccount.id,
            year: detected.year, month: detected.month,
            transactionCount: done,
          });
          await fetch(`${API.markUploaded}?${params}`, {
            method: 'POST',
            headers: user?.token ? { 'Authorization': `Bearer ${user.token}` } : {},
          });
        } catch (e) { /* non-critical */ }
      }
    }

    onImportComplete(done);
  };

  const expenseTotal  = rows.filter(r => r._selected && r.displayType === 'EXPENSE') .reduce((s, r) => s + r.amount, 0);
  const incomeTotal   = rows.filter(r => r._selected && r.displayType === 'INCOME')  .reduce((s, r) => s + r.amount, 0);
  const neutralCount  = rows.filter(r => r.displayType === 'NEUTRAL').length;

  return (
    <div className="modal-overlay" onClick={e => e.target.classList.contains('modal-overlay') && onClose()}>
      <div className="modal-container statement-import-modal">
        <div className="modal-header">
          <h3>📄 Import Bank Statement</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        {/* ── UPLOAD STEP ── */}
        {(step === 'upload' || uploading) && (
          <div className="modal-body upload-step">
            {!uploading ? (
              <>
                <p className="upload-hint">Upload a PDF bank statement. Your data stays local — processed by your on-device AI.</p>
                {accounts.length > 0 && (
                  <div className="input-group" style={{ marginBottom: 20 }}>
                    <label>Account <span className="optional">(optional — helps AI understand statement type)</span></label>
                    <select value={selectedAccountId} onChange={e => setSelectedAccountId(e.target.value)}
                      className="table-select" style={{ width: '100%', padding: '8px 10px' }}>
                      <option value="">— Select account (optional) —</option>
                      {accounts.map(a => (
                        <option key={a.id} value={a.id}>{a.nickname} ({a.institutionName})</option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="drop-zone" onClick={() => fileInputRef.current.click()}
                  onDragOver={e => e.preventDefault()}
                  onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) { setSelectedFile(f); setError(''); } }}>
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

        {/* ── REVIEW STEP ── */}
        {step === 'review' && (
          <div className="modal-body review-step">
            {alreadyUploaded && (
              <div className="already-uploaded-banner">
                ⚠️ <strong>{MONTH_NAMES[alreadyUploaded.month - 1]} {alreadyUploaded.year}</strong> already has {alreadyUploaded.count} transactions.
                Proceeding will <strong>replace</strong> that data.
              </div>
            )}

            {institutionName && (
              <div className="institution-badge-banner">
                🏦 <strong>{institutionName}</strong> — will be tagged on each transaction
              </div>
            )}

            {/* Summary bar */}
            <div className="review-header">
              <div className="review-summary-row">
                <span className="summary-chip income-chip">+${incomeTotal.toFixed(2)} in</span>
                <span className="summary-chip expense-chip">-${expenseTotal.toFixed(2)} out</span>
                {neutralCount > 0 && <span className="summary-chip neutral-chip">({neutralCount}) neutral</span>}
                {investments.length > 0 && <span className="summary-chip investment-chip">📈 {investments.length} investments</span>}
                <span className="summary-chip">{totalSelected} selected</span>
              </div>
              <button className="btn-regenerate" onClick={handleRegenerate}>🔄 Regenerate</button>
            </div>

            {error && <p className="error-message">{error}</p>}

            {/* ── Unified transactions table ── */}
            <div className="transactions-table-wrapper">
              <table className="transactions-table">
                <thead>
                  <tr>
                    <th>
                      <input type="checkbox"
                        checked={rows.length > 0 && selectedRows.length === rows.length}
                        onChange={e => selectAll(e.target.checked)} />
                    </th>
                    <th>Date</th>
                    <th>Description</th>
                    <th>Amount</th>
                    <th>Category</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(tx => {
                    const { text: amtText, cls: amtCls } = formatAmount(tx.amount, tx.displayType);
                    return (
                      <tr key={tx._id} className={!tx._selected ? 'row-deselected' : ''}>
                        <td><input type="checkbox" checked={tx._selected} onChange={() => toggleRow(tx._id)} /></td>
                        <td>
                          <input type="date" value={tx.date}
                            onChange={e => updateRow(tx._id, 'date', e.target.value)}
                            className="table-input date-input" />
                        </td>
                        <td>
                          <input type="text" value={tx.description}
                            onChange={e => updateRow(tx._id, 'description', e.target.value)}
                            className="table-input desc-input" />
                        </td>
                        <td>
                          <span className={`amount-display ${amtCls}`}>{amtText}</span>
                        </td>
                        <td>
                          <select value={tx.category}
                            onChange={e => handleCategoryChange(tx._id, e.target.value)}
                            className="table-select">
                            {['Expense','Income','Neutral'].map(group => (
                              <optgroup key={group} label={group}>
                                {ALL_CATEGORIES.filter(c => c.group === group).map(c => (
                                  <option key={c.value} value={c.value}>{c.label}</option>
                                ))}
                              </optgroup>
                            ))}
                            <optgroup label="Investment">
                              <option value="INVESTMENT">📈 Investment</option>
                            </optgroup>
                          </select>
                        </td>
                        <td><button className="btn-delete-row" onClick={() => deleteRow(tx._id)}>✕</button></td>
                      </tr>
                    );
                  })}
                  {rows.length === 0 && (
                    <tr><td colSpan={6} style={{ textAlign: 'center', color: '#6c7086', padding: 20 }}>No transactions found</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* ── Investments section ── */}
            {investments.length > 0 && (
              <div className="investments-section">
                <button className="investments-toggle" onClick={() => setShowInvestments(v => !v)}>
                  📈 {investments.length} Investment transaction{investments.length !== 1 ? 's' : ''}
                  &nbsp;— tracked under statements only, not counted as expense or income
                  &nbsp;{showInvestments ? '▲' : '▼'}
                </button>
                {showInvestments && (
                  <table className="transactions-table investments-table">
                    <thead>
                      <tr><th>Date</th><th>Description</th><th>Amount</th></tr>
                    </thead>
                    <tbody>
                      {investments.map((tx, i) => (
                        <tr key={i}>
                          <td>{tx.date}</td>
                          <td>{tx.description}</td>
                          <td><span className="amount-display amount-investment">${parseFloat(tx.amount).toFixed(2)}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
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

        {/* ── IMPORTING STEP ── */}
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

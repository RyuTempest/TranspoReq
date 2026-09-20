import { useEffect, useMemo, useState } from 'react'
import {
  Archive, BarChart3, Check, ChevronDown, ClipboardList, Copy, FileDown,
  FilePlus2, Filter, LayoutDashboard, LogOut, Menu, Pencil, Plus, Printer, Search, Settings,
  SlidersHorizontal, TableProperties, Trash2, UserRound, Users, X, Zap,
} from 'lucide-react'
import Login, { AppUser, StoredUser } from './Login'

type Page = 'new' | 'records' | 'dashboard' | 'master'
type Row = { id: number; date: string; from: string; to: string; trips: string; mode: string; fare: string }
type RecordItem = { id: string; employee: string; department: string; date: string; total: number; status: string }
type RowError = { date?: string; from?: string; to?: string; trips?: string; mode?: string; fare?: string }
type FormDraft = { rows: Row[]; employee: string; department: string; position: string; purpose: string; dateFiled: string }

const initialMasterData: Record<string, string[]> = { Employees: ['Dulce Blanca D. Singatue', 'Cherry Ann Galvan', 'Nicole Carmina B. Gonzaga'], Departments: ['Operations', 'Finance', 'Administration', 'Human Resources'], Positions: ['Operations Officer', 'Finance Associate', 'Department Head'], Locations: ['Head Office', 'Cebu IT Park', 'SM City Cebu', 'Mactan Airport', 'Ayala Center', 'La Salle'], 'Transportation Modes': ['Jeepney', 'Tricycle', 'Taxi', 'Bus', 'Motorcycle', 'Private Vehicle', 'Other'], 'Fare Rates': ['Head Office → La Salle · Jeepney · ₱12.00', 'Head Office → Cebu IT Park · Taxi · ₱180.00', 'Head Office → Mactan Airport · Taxi · ₱280.00'] }
const initialUsers: StoredUser[] = [{ username: 'admin', name: 'Admin', password: 'admin123', role: 'ADMIN' }, { username: 'user', name: 'Staff User', password: 'user123', role: 'USER' }]
const employeeProfiles: Record<string, { position: string; department: string }> = { 'Dulce Blanca D. Singatue': { position: 'Operations Officer', department: 'Operations' }, 'Cherry Ann Galvan': { position: 'Finance Associate', department: 'Finance' }, 'Nicole Carmina B. Gonzaga': { position: 'Department Head', department: 'Administration' } }
const fares: Record<string, number> = { 'Head Office|La Salle|Jeepney': 12, 'Head Office|Cebu IT Park|Taxi': 180, 'Head Office|SM City Cebu|Jeepney': 15, 'Head Office|Mactan Airport|Taxi': 280, 'Ayala Center|Head Office|Jeepney': 12 }
const initialRows: Row[] = Array.from({ length: 5 }, (_, index) => index + 1).map((id) => ({ id, date: '', from: '', to: '', trips: '', mode: '', fare: '' }))
const maxRows = 16
const initialRecords: RecordItem[] = [
  { id: 'TFT-000124', employee: 'Dulce Blanca D. Singatue', department: 'Operations', date: '2026-09-18', total: 540, status: 'SUBMITTED' },
  { id: 'TFT-000123', employee: 'Cherry Ann Galvan', department: 'Finance', date: '2026-09-17', total: 240, status: 'APPROVED' },
  { id: 'TFT-000122', employee: 'Nicole Carmina B. Gonzaga', department: 'Administration', date: '2026-09-16', total: 960, status: 'CHECKED' },
]

const peso = (value: number) => `₱${value.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`
const today = new Date().toISOString().slice(0, 10)
const readStorage = <T,>(key: string, fallback: T): T => {
  try {
    const saved = localStorage.getItem(key)
    return saved ? JSON.parse(saved) as T : fallback
  } catch {
    localStorage.removeItem(key)
    return fallback
  }
}

function App() {
  const [user, setUser] = useState<AppUser | null>(() => readStorage<AppUser | null>('tft-session', null))
  const [savedDraft] = useState<FormDraft | null>(() => readStorage<FormDraft | null>('tft-form-draft', null))
  const [users, setUsers] = useState<StoredUser[]>(() => readStorage('tft-users', initialUsers))
  const [page, setPage] = useState<Page>('new')
  const [mobileNav, setMobileNav] = useState(false)
  const [rows, setRows] = useState<Row[]>(savedDraft?.rows?.length ? savedDraft.rows.slice(0, maxRows) : initialRows)
  const [fareHistory, setFareHistory] = useState<Record<string, string>>(() => readStorage('tft-fare-history', Object.fromEntries(Object.entries(fares).map(([key, value]) => [key, String(value)]))))
  const [records, setRecords] = useState<RecordItem[]>(() => readStorage('tft-records', initialRecords))
  const [employee, setEmployee] = useState(savedDraft?.employee ?? 'Dulce Blanca D. Singatue')
  const [department, setDepartment] = useState(savedDraft?.department ?? 'Operations')
  const [position, setPosition] = useState(savedDraft?.position ?? 'Operations Officer')
  const [purpose, setPurpose] = useState(savedDraft?.purpose ?? '')
  const [dateFiled, setDateFiled] = useState(savedDraft?.dateFiled ?? today)
  const [notice, setNotice] = useState('')
  const [formErrors, setFormErrors] = useState<{ employee?: string; dateFiled?: string; purpose?: string; rows: RowError[] }>({ rows: [] })
  const [masterData, setMasterData] = useState<Record<string, string[]>>(() => readStorage('tft-master-data', initialMasterData))

  useEffect(() => localStorage.setItem('tft-records', JSON.stringify(records)), [records])
  useEffect(() => localStorage.setItem('tft-form-draft', JSON.stringify({ rows, employee, department, position, purpose, dateFiled })), [rows, employee, department, position, purpose, dateFiled])
  useEffect(() => localStorage.setItem('tft-fare-history', JSON.stringify(fareHistory)), [fareHistory])
  useEffect(() => localStorage.setItem('tft-users', JSON.stringify(users)), [users])
  useEffect(() => localStorage.setItem('tft-master-data', JSON.stringify(masterData)), [masterData])
  useEffect(() => { if (user) localStorage.setItem('tft-session', JSON.stringify(user)); else localStorage.removeItem('tft-session') }, [user])

  const locationOptions = Array.from(new Set([...masterData.Locations, 'Other (type in)']))
  const modeOptions = Array.from(new Set([...masterData['Transportation Modes'], 'Jeepney', 'Bus', 'Taxi', 'Grab', 'Van', 'Motorcycle Taxi', 'Tricycle', 'Other']))
  const employeeOptions = masterData.Employees
  const positionOptions = masterData.Positions
  const departmentOptions = masterData.Departments

  const total = useMemo(() => rows.reduce((sum, row) => sum + (Number(row.trips) || 0) * (Number(row.fare) || 0), 0), [rows])
  const controlNumber = useMemo(() => `TFT-${String(records.length + 125).padStart(6, '0')}`, [records.length])

  const updateRow = (id: number, key: keyof Row, value: string) => {
    setRows((current) => current.map((row) => {
      if (row.id !== id) return row
      const next = { ...row, [key]: value }
      if (key === 'from' || key === 'to' || key === 'mode') {
        const fareKey = `${key === 'from' ? value : next.from}|${key === 'to' ? value : next.to}|${key === 'mode' ? value : next.mode}`
        const fare = fareHistory[fareKey]
        if (fare !== undefined) next.fare = fare
      }
      if (key === 'fare' && next.from && next.to && next.mode && value !== '') {
        setFareHistory((current) => ({ ...current, [`${next.from}|${next.to}|${next.mode}`]: value }))
      }
      return next
    }))
  }

  const addRow = () => setRows((current) => current.length >= maxRows ? current : [...current, { id: Date.now(), date: '', from: '', to: '', trips: '', mode: '', fare: '' }])
  const removeRow = (id: number) => setRows((current) => current.filter((row) => row.id !== id))
  const duplicateRow = (id: number) => setRows((current) => { if (current.length >= maxRows) return current; const index = current.findIndex((row) => row.id === id); if (index < 0) return current; const copy = { ...current[index], id: Date.now() }; return [...current.slice(0, index + 1), copy, ...current.slice(index + 1)] })
  const selectEmployee = (name: string) => { setEmployee(name); const profile = employeeProfiles[name]; if (profile) { setPosition(profile.position); setDepartment(profile.department) } }
  const validateForm = () => {
    const errors: { employee?: string; dateFiled?: string; purpose?: string; rows: RowError[] } = { rows: [] }
    if (!employee) errors.employee = 'Select an employee.'
    if (!dateFiled) errors.dateFiled = 'Date filed is required.'
    else if (dateFiled > today) errors.dateFiled = 'Date filed cannot be in the future.'
    if (!purpose.trim()) errors.purpose = 'Purpose is required.'
    rows.forEach((row, index) => {
      const hasValue = row.date || row.from || row.to || row.trips || row.mode || row.fare
      if (!hasValue) return
      const rowError: RowError = {}
      if (!row.date) rowError.date = 'Required'
      else if (row.date > today) rowError.date = 'No future dates'
      if (!row.from) rowError.from = 'Required'
      if (!row.to) rowError.to = 'Required'
      if (!row.mode) rowError.mode = 'Required'
      if (!row.trips || !/^\d+$/.test(row.trips) || Number(row.trips) < 1) rowError.trips = 'Use 1 or more'
      if (row.fare === '' || !/^\d+(\.\d{1,2})?$/.test(row.fare) || Number(row.fare) < 0) rowError.fare = 'Use a valid fare'
      errors.rows[index] = rowError
    })
    return errors
  }
  const saveDraft = () => {
    const errors = validateForm()
    setFormErrors(errors)
    const hasErrors = Boolean(errors.employee || errors.dateFiled || errors.purpose || errors.rows.some((row) => Object.keys(row).length))
    const completedRows = rows.filter((row) => row.date && row.from && row.to && row.mode && row.trips !== '' && Number(row.trips) > 0 && row.fare !== '' && Number(row.fare) >= 0)
    if (hasErrors) { setNotice('Please correct the highlighted fields before saving.'); return }
    if (!completedRows.length) { setNotice('Add at least one complete transportation detail before saving.'); return }
    const item: RecordItem = { id: controlNumber, employee, department, date: dateFiled, total, status: 'DRAFT' }
    setRecords((current) => [item, ...current])
    setNotice(`${item.id} saved successfully.`)
    localStorage.removeItem('tft-form-draft')
  }
  const printForm = () => { window.setTimeout(() => window.print(), 0) }
  const updateRecord = (id: string, changes: Partial<RecordItem>) => setRecords((current) => current.map((record) => record.id === id ? { ...record, ...changes } : record))
  const archiveRecord = (id: string) => setRecords((current) => current.filter((record) => record.id !== id))
  const duplicateRecord = (record: RecordItem) => setRecords((current) => [{ ...record, id: `TFT-${String(current.length + 125).padStart(6, '0')}`, status: 'DRAFT' }, ...current])
  const addMaster = (category: string) => { const value = window.prompt(`New ${category.slice(0, -1).toLowerCase()} name`); if (value?.trim()) setMasterData((current) => ({ ...current, [category]: [...current[category], value.trim()] })) }
  const editMaster = (category: string, index: number) => { const value = window.prompt(`Edit ${category.slice(0, -1).toLowerCase()}`, masterData[category][index]); if (value?.trim()) setMasterData((current) => ({ ...current, [category]: current[category].map((item, itemIndex) => itemIndex === index ? value.trim() : item) })) }
  const deleteMaster = (category: string, index: number) => setMasterData((current) => ({ ...current, [category]: current[category].filter((_, itemIndex) => itemIndex !== index) }))
  const addUser = () => { const username = window.prompt('Username'); const password = username && window.prompt('Password'); const name = username && window.prompt('Display name'); const role = username && window.prompt('Role: ADMIN or USER', 'USER'); if (username?.trim() && password && name?.trim() && (role === 'ADMIN' || role === 'USER')) setUsers((current) => [...current, { username: username.trim().toLowerCase(), password, name: name.trim(), role }]) }
  const editUser = (index: number) => { const current = users[index]; const name = window.prompt('Display name', current.name); const password = window.prompt('Password', current.password); const role = window.prompt('Role: ADMIN or USER', current.role); if (name?.trim() && password && (role === 'ADMIN' || role === 'USER')) setUsers((currentUsers) => currentUsers.map((item, itemIndex) => itemIndex === index ? { ...item, name: name.trim(), password, role } : item)) }
  const deleteUser = (index: number) => { if (users[index]?.username !== user?.username) setUsers((current) => current.filter((_, itemIndex) => itemIndex !== index)) }

  if (!user) return <Login users={users} onLogin={setUser} />

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileNav ? 'open' : ''}`}>
        <div className="brand"><div className="brand-mark"><Zap size={18} /></div><div><strong>tft<span>desk</span></strong><small>transport operations</small></div></div>
        <div className="workspace-label">WORKSPACE</div>
        <nav>
          <NavButton icon={<LayoutDashboard size={17} />} label="Dashboard" active={page === 'dashboard'} onClick={() => { setPage('dashboard'); setMobileNav(false) }} />
          <div className="nav-group-label">TRANSPORT REQUESTS</div>
          <NavButton icon={<FilePlus2 size={17} />} label="New TFT" active={page === 'new'} onClick={() => { setPage('new'); setMobileNav(false) }} />
          <NavButton icon={<ClipboardList size={17} />} label="TFT Records" active={page === 'records'} badge={records.length} onClick={() => { setPage('records'); setMobileNav(false) }} />
          <div className="nav-group-label">ADMINISTRATION</div>
          {user.role === 'ADMIN' && <NavButton icon={<TableProperties size={17} />} label="Master Data" active={page === 'master'} onClick={() => { setPage('master'); setMobileNav(false) }} />}
          <NavButton icon={<BarChart3 size={17} />} label="Reports" />
          <NavButton icon={<Settings size={17} />} label="Settings" />
        </nav>
        <div className="sidebar-footer"><div className="avatar">{user.name.slice(0, 2).toUpperCase()}</div><div><strong>{user.name}</strong><small>{user.role === 'ADMIN' ? 'Administrator' : 'Staff user'}</small></div><button className="logout-button" onClick={() => setUser(null)} title="Sign out"><LogOut size={15} /></button></div>
      </aside>
      {mobileNav && <button className="scrim" onClick={() => setMobileNav(false)} aria-label="Close navigation" />}
      <main className="main-content">
        <header className="topbar"><button className="icon-button mobile-menu" onClick={() => setMobileNav(true)} aria-label="Open navigation"><Menu size={20} /></button><div className="breadcrumb"><span>Workspace</span><span>/</span><strong>{page === 'new' ? 'New TFT' : page === 'records' ? 'TFT Records' : page === 'master' ? 'Master Data' : 'Dashboard'}</strong></div><div className="top-actions"><button className="icon-button" title="Search"><Search size={18} /></button><div className="top-avatar">{user.name.slice(0, 2).toUpperCase()}</div></div></header>
        <div className="content-wrap">
          {page === 'new' && <FormPage rows={rows} total={total} controlNumber={controlNumber} locations={locationOptions} modes={modeOptions} employees={employeeOptions} positions={positionOptions} departments={departmentOptions} employee={employee} setEmployee={selectEmployee} department={department} setDepartment={setDepartment} position={position} setPosition={setPosition} purpose={purpose} setPurpose={setPurpose} dateFiled={dateFiled} setDateFiled={setDateFiled} updateRow={updateRow} addRow={addRow} duplicateRow={duplicateRow} removeRow={removeRow} saveDraft={saveDraft} printForm={printForm} errors={formErrors} notice={notice} />}
          {page === 'records' && <RecordsPage records={records} onNew={() => setPage('new')} onArchive={archiveRecord} onDuplicate={duplicateRecord} onEdit={(record) => updateRecord(record.id, { status: record.status === 'DRAFT' ? 'SUBMITTED' : 'DRAFT' })} />}
          {page === 'dashboard' && <DashboardPage records={records} user={user} />}
          {page === 'master' && user.role === 'ADMIN' && <MasterPage data={{ ...masterData, Users: users.map((item) => `${item.name} · ${item.username} · ${item.role}`) }} onAdd={(category) => category === 'Users' ? addUser() : addMaster(category)} onEdit={(category, index) => category === 'Users' ? editUser(index) : editMaster(category, index)} onDelete={(category, index) => category === 'Users' ? deleteUser(index) : deleteMaster(category, index)} />}
        </div>
      </main>
    </div>
  )
}

function NavButton({ icon, label, active = false, badge, onClick = () => {} }: { icon: React.ReactNode; label: string; active?: boolean; badge?: number; onClick?: () => void }) {
  return <button className={`nav-button ${active ? 'active' : ''}`} onClick={onClick}>{icon}<span>{label}</span>{badge && <em>{badge}</em>}</button>
}

function FormPage(props: { rows: Row[]; total: number; controlNumber: string; locations: string[]; modes: string[]; employees: string[]; positions: string[]; departments: string[]; employee: string; setEmployee: (v: string) => void; department: string; setDepartment: (v: string) => void; position: string; setPosition: (v: string) => void; purpose: string; setPurpose: (v: string) => void; dateFiled: string; setDateFiled: (v: string) => void; updateRow: (id: number, key: keyof Row, value: string) => void; addRow: () => void; duplicateRow: (id: number) => void; removeRow: (id: number) => void; saveDraft: () => void; printForm: () => void; errors: { employee?: string; dateFiled?: string; purpose?: string; rows: RowError[] }; notice: string }) {
  const { rows, total, controlNumber, locations, modes, employees, positions, departments, employee, setEmployee, department, setDepartment, position, setPosition, purpose, setPurpose, dateFiled, setDateFiled, updateRow, addRow, duplicateRow, removeRow, saveDraft, printForm, errors, notice } = props
  const printableRows = [...rows, ...Array.from({ length: Math.max(0, maxRows - rows.length) }, (_, index) => ({ id: -(index + 1), date: '', from: '', to: '', trips: '', mode: '', fare: '' }))]
  return <>
    <div className="page-heading"><div><div className="eyebrow">TRANSPORT REQUESTS / CREATE</div><h1>New transportation request</h1><p>Complete the form, add each route, then print the final copy for physical signatures.</p></div><div className="heading-actions print-actions"><button className="secondary-button" onClick={printForm}><Printer size={16} /> Print form</button><button className="primary-button" onClick={saveDraft}><Check size={16} /> Save request</button></div></div>
    {notice && <div className="notice"><Check size={16} />{notice}<button onClick={() => {}} aria-label="Dismiss"><X size={15} /></button></div>}
    <section className="form-paper no-print">
      <div className="paper-header"><div className="paper-kicker">Control No. {controlNumber}</div><h2>TRANSPORTATION REQUEST FORM</h2><div className="paper-meta"><span className="screen-only-status">READY TO COMPLETE</span><span className="print-only-meta">Form 01 <span>•</span> Internal use</span></div></div>
      <div className="employee-grid">
        <Field label="Name of Employee" value={employee} onChange={setEmployee} options={employees} placeholder="Select employee" required error={errors.employee} />
        <Field label="Position" value={position} onChange={setPosition} options={positions} placeholder="Select position" />
        <Field label="Date Filed" type="date" value={dateFiled} onChange={setDateFiled} required error={errors.dateFiled} max={today} />
        <Field label="Department" value={department} onChange={setDepartment} options={departments} placeholder="Select department" />
        <div className="field purpose-field"><label htmlFor="purpose">Purpose <span className="required">*</span></label><input id="purpose" value={purpose} onChange={(e) => setPurpose(e.target.value)} placeholder="Reason for transportation request" aria-invalid={Boolean(errors.purpose)} />{errors.purpose && <span className="inline-error">{errors.purpose}</span>}</div>
      </div>
      <div className="table-toolbar"><div><strong>Transportation details</strong><span> {rows.length} of {maxRows} rows in use</span></div><div className="row-tools"><button className="text-button" onClick={addRow} disabled={rows.length >= maxRows}><Plus size={15} /> Add row</button>{rows.length > 0 && <button className="text-button" onClick={() => duplicateRow(rows[rows.length - 1].id)} disabled={rows.length >= maxRows}><Copy size={15} /> Duplicate previous</button>}</div></div>
      <div className="table-scroll"><table className="transport-table"><thead><tr><th className="date-col">DATE</th><th>FROM</th><th>TO</th><th className="trips-col">NO. OF<br />TRIPS</th><th className="mode-col">TRANSPORTATION<br />MODE</th><th className="fare-col">UNIT FARE<br /><span>(₱)</span></th><th className="amount-col">TOTAL AMOUNT<br /><span>(₱)</span></th><th className="remove-col"></th></tr></thead><tbody>{printableRows.map((row, index) => <TripRow key={row.id} row={row} error={errors.rows[index]} printOnly={index >= rows.length} maxDate={today} locations={locations} modes={modes} updateRow={updateRow} duplicateRow={duplicateRow} removeRow={removeRow} />)}</tbody></table></div>
      <div className="mobile-trip-list">{rows.map((row, index) => <TripCard key={row.id} row={row} error={errors.rows[index]} maxDate={today} locations={locations} modes={modes} updateRow={updateRow} duplicateRow={duplicateRow} removeRow={removeRow} />)}</div>
      <div className="paper-total"><span>GRAND TOTAL</span><strong>{peso(total)}</strong></div>
      <div className="signature-grid"><Signature title="Prepared by" name={employee || 'Prepared by'} /><Signature title="Signed by" name="Dulce Blanca D. Singatue" /><Signature title="Checked by" name="Cherry Ann Galvan" /><Signature title="President" name="Nicole Carmina B. Gonzaga" /></div>
      <div className="paper-footnote"><span>All fields marked with * are required.</span><span>Generated in tftdesk • {today}</span></div>
    </section>
    <div className="print-only print-output"><PrintForm rows={rows} employee={employee} position={position} department={department} purpose={purpose} dateFiled={dateFiled} controlNumber={controlNumber} /></div>
  </>
}

function PrintForm({ rows, employee, position, department, purpose, dateFiled, controlNumber }: { rows: Row[]; employee: string; position: string; department: string; purpose: string; dateFiled: string; controlNumber: string }) {
  const printableRows = rows.filter((row) => row.date || row.from || row.to || row.trips || row.mode || row.fare)
  const groups: Row[][] = []
  printableRows.forEach((row) => {
    const group = groups[groups.length - 1]
    if (group && row.date && group[0].date === row.date) group.push(row)
    else groups.push([row])
  })
  const total = printableRows.reduce((sum, row) => sum + (Number(row.trips) || 0) * (Number(row.fare) || 0), 0)
  const shortDate = (value: string) => value ? new Date(`${value}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ''
  return <article className="print-form-copy">
    <header className="print-header"><small>Control No. {controlNumber}</small><strong>TRANSPORTATION REQUEST FORM</strong></header>
    <div className="print-top-fields">
      {employee && <PrintField label="Name of Employee" value={employee} />}
      {dateFiled && <PrintField label="Date Filed" value={shortDate(dateFiled)} />}
      {position && <PrintField label="Position" value={position} />}
      {department && <PrintField label="Department" value={department} />}
    </div>
    {purpose && <div className="print-purpose-block"><span>Purpose</span><strong>{purpose}</strong></div>}
    <div className="print-section-title">Transportation details</div>
    <table className="print-table"><colgroup><col className="print-date" /><col className="print-from" /><col className="print-to" /><col className="print-trips" /><col className="print-mode" /><col className="print-fare" /><col className="print-total" /></colgroup><thead><tr><th>DATE</th><th>FROM</th><th>TO</th><th>TRIPS</th><th>MODE</th><th>UNIT FARE (₱)</th><th>TOTAL (₱)</th></tr></thead><tbody>{groups.length ? groups.flatMap((group) => group.map((row, index) => { const amount = (Number(row.trips) || 0) * (Number(row.fare) || 0); return <tr className={index === group.length - 1 ? 'date-group-end' : ''} key={row.id}>{index === 0 && <td rowSpan={group.length} className="print-date-value">{shortDate(row.date)}</td>}<td>{row.from}</td><td>{row.to}</td><td className="print-number">{row.trips}</td><td>{row.mode}</td><td className="print-number">{row.fare ? Number(row.fare).toFixed(2) : ''}</td><td className="print-number">{amount ? amount.toFixed(2) : ''}</td></tr> })) : <tr><td colSpan={7} className="print-empty-state">No transportation details entered.</td></tr>}</tbody></table>
    <div className="print-grand-total"><span>GRAND TOTAL</span><strong>₱{total.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</strong></div>
    <div className="print-signatures"><PrintSignature label="Prepared by" name={employee} /><PrintSignature label="Signed by" name="Dulce Blanca D. Sinangote" /><PrintSignature label="Checked by" name="Cherry Ann Galvan" /><PrintSignature label="President" name="Nicole Carmina B. Gonzaga" /></div>
  </article>
}
function PrintField({ label, value, wide = false }: { label: string; value: string; wide?: boolean }) { return <div className={`print-field ${wide ? 'wide' : ''}`}><span>{label}</span><strong>{value}</strong></div> }
function PrintSignature({ label, name }: { label: string; name: string }) { return <div className="print-signature"><div className="print-signature-line"></div>{name && <strong>{name}</strong>}<em>{label}</em></div> }

function FormPaper({ className, rows, total, locations, modes, employees, positions, departments, employee, position, department, purpose, dateFiled, errors, updateRow, duplicateRow, removeRow }: { className: string; rows: Row[]; total: number; locations: string[]; modes: string[]; employees: string[]; positions: string[]; departments: string[]; employee: string; position: string; department: string; purpose: string; dateFiled: string; errors: { rows: RowError[] }; updateRow: (id: number, key: keyof Row, value: string) => void; duplicateRow: (id: number) => void; removeRow: (id: number) => void }) { const printableRows = [...rows, ...Array.from({ length: Math.max(0, maxRows - rows.length) }, (_, index) => ({ id: -(index + 1), date: '', from: '', to: '', trips: '', mode: '', fare: '' }))]; return <section className={`form-paper ${className}`}><div className="paper-header"><h2>TRANSPORTATION REQUEST FORM</h2></div><div className="employee-grid"><Field label="Name of Employee" value={employee} onChange={() => {}} options={employees} /><Field label="Position" value={position} onChange={() => {}} options={positions} /><Field label="Date Filed" type="date" value={dateFiled} onChange={() => {}} max={today} /><Field label="Department" value={department} onChange={() => {}} options={departments} /><div className="field purpose-field"><label>Purpose</label><input value={purpose} readOnly /></div></div><div className="table-toolbar"><div><strong>Transportation details</strong></div></div><div className="table-scroll"><table className="transport-table"><thead><tr><th className="date-col">DATE</th><th>FROM</th><th>TO</th><th className="trips-col">NO. OF<br />TRIPS</th><th className="mode-col">TRANSPORTATION<br />MODE</th><th className="fare-col">UNIT FARE<br /><span>(₱)</span></th><th className="amount-col">TOTAL AMOUNT<br /><span>(₱)</span></th><th className="remove-col"></th></tr></thead><tbody>{printableRows.map((row, index) => <TripRow key={row.id} row={row} error={errors.rows[index]} printOnly={index >= rows.length} maxDate={today} locations={locations} modes={modes} updateRow={updateRow} duplicateRow={duplicateRow} removeRow={removeRow} />)}</tbody></table></div><div className="paper-total"><span>GRAND TOTAL</span><strong>{peso(total)}</strong></div><div className="signature-grid"><Signature title="Prepared by" name={employee || 'Prepared by'} /><Signature title="Signed by" name="Dulce Blanca D. Singatue" /><Signature title="Checked by" name="Cherry Ann Galvan" /><Signature title="President" name="Nicole Carmina B. Gonzaga" /></div></section> }

function Field({ label, value, onChange, type = 'text', required = false, options, placeholder, error, max }: { label: string; value: string; onChange: (v: string) => void; type?: string; required?: boolean; options?: string[]; placeholder?: string; error?: string; max?: string }) { const inputId = label.toLowerCase().replace(/[^a-z0-9]+/g, '-'); return <div className="field"><label htmlFor={inputId}>{label} {required && <span className="required">*</span>}</label>{options ? <Select value={value} options={options} onChange={onChange} placeholder={placeholder} /> : <input id={inputId} type={type} max={max} value={value} onChange={(e) => onChange(e.target.value)} aria-invalid={Boolean(error)} />}{error && <span className="inline-error">{error}</span>}</div> }
function RouteSelect({ value, options, onChange, error }: { value: string; options: string[]; onChange: (value: string) => void; error?: string }) { const isCustom = value === 'Other (type in)' || (Boolean(value) && !options.includes(value)); const selectOptions = isCustom && value !== 'Other (type in)' ? [value, ...options] : options; return <div><Select value={value} options={selectOptions} onChange={onChange} placeholder="Select" />{isCustom && <input className="other-location" value={value === 'Other (type in)' ? '' : value} onChange={(event) => onChange(event.target.value)} placeholder="Type location" />}{error && <span className="inline-error">{error}</span>}</div> }
function TripRow({ row, error, printOnly = false, maxDate, locations, modes, updateRow, duplicateRow, removeRow }: { row: Row; error?: RowError; printOnly?: boolean; maxDate: string; locations: string[]; modes: string[]; updateRow: (id: number, key: keyof Row, value: string) => void; duplicateRow: (id: number) => void; removeRow: (id: number) => void }) { const amount = Number(row.trips) * Number(row.fare); return <tr className={printOnly ? 'print-only-row' : ''}><td><input aria-label="Travel date" type="date" max={maxDate} value={row.date} onChange={(event) => updateRow(row.id, 'date', event.target.value)} />{error?.date && <span className="inline-error">{error.date}</span>}</td><td><RouteSelect value={row.from} options={locations} onChange={(value) => updateRow(row.id, 'from', value)} error={error?.from} /></td><td><RouteSelect value={row.to} options={locations} onChange={(value) => updateRow(row.id, 'to', value)} error={error?.to} /></td><td><input aria-label="Number of trips" className="number-input" type="number" min="1" step="1" value={row.trips} onChange={(event) => updateRow(row.id, 'trips', event.target.value.replace(/[^0-9]/g, ''))} placeholder="0" />{error?.trips && <span className="inline-error">{error.trips}</span>}</td><td><Select value={row.mode} options={modes} placeholder="Select" onChange={(value) => updateRow(row.id, 'mode', value)} />{error?.mode && <span className="inline-error">{error.mode}</span>}</td><td><div className="fare-input"><span>₱</span><input aria-label="Unit fare" type="number" min="0" step="0.01" value={row.fare} onChange={(event) => updateRow(row.id, 'fare', event.target.value)} placeholder="—" /></div>{error?.fare && <span className="inline-error">{error.fare}</span>}</td><td className="amount-cell">{amount > 0 ? peso(amount) : ''}</td><td><div className="row-actions"><button className="row-delete" onClick={() => duplicateRow(row.id)} title="Duplicate previous row"><Copy size={14} /></button><button className="row-delete" onClick={() => removeRow(row.id)} title="Remove row"><Trash2 size={14} /></button></div></td></tr> }
function TripCard({ row, error, maxDate, locations, modes, updateRow, duplicateRow, removeRow }: { row: Row; error?: RowError; maxDate: string; locations: string[]; modes: string[]; updateRow: (id: number, key: keyof Row, value: string) => void; duplicateRow: (id: number) => void; removeRow: (id: number) => void }) { const amount = Number(row.trips) * Number(row.fare); return <article className="trip-card"><div className="trip-card-heading"><strong>Route detail</strong><div><button className="icon-button" onClick={() => duplicateRow(row.id)} title="Duplicate row"><Copy size={16} /></button><button className="icon-button" onClick={() => removeRow(row.id)} title="Remove row"><Trash2 size={16} /></button></div></div><div className="trip-card-grid"><Field label="Date" type="date" max={maxDate} value={row.date} onChange={(value) => updateRow(row.id, 'date', value)} error={error?.date} /><div className="field"><label>From</label><RouteSelect value={row.from} options={locations} onChange={(value) => updateRow(row.id, 'from', value)} error={error?.from} /></div><div className="field"><label>To</label><RouteSelect value={row.to} options={locations} onChange={(value) => updateRow(row.id, 'to', value)} error={error?.to} /></div><Field label="No. of trips" type="number" value={row.trips} onChange={(value) => updateRow(row.id, 'trips', value.replace(/[^0-9]/g, ''))} error={error?.trips} /><Field label="Transportation mode" value={row.mode} onChange={(value) => updateRow(row.id, 'mode', value)} options={modes} placeholder="Select mode" error={error?.mode} /><Field label="Unit fare (₱)" type="number" value={row.fare} onChange={(value) => updateRow(row.id, 'fare', value)} error={error?.fare} /></div><div className="trip-card-total"><span>Total amount</span><strong>{amount > 0 ? peso(amount) : '—'}</strong></div></article> }
function Select({ value, options, onChange, placeholder = 'Select option' }: { value: string; options: string[]; onChange: (value: string) => void; placeholder?: string }) { return <div className="select-wrap"><select value={value} onChange={(e) => onChange(e.target.value)}><option value="">{placeholder}</option>{options.map((option) => <option key={option}>{option}</option>)}</select><ChevronDown size={14} /></div> }
function Signature({ title, name }: { title: string; name: string }) { return <div className="signature"><div className="signature-line"></div><strong>{name}</strong><span>{title}</span></div> }

function RecordsPage({ records, onNew, onArchive, onDuplicate, onEdit }: { records: RecordItem[]; onNew: () => void; onArchive: (id: string) => void; onDuplicate: (record: RecordItem) => void; onEdit: (record: RecordItem) => void }) { const [query, setQuery] = useState(''); const filteredRecords = records.filter((record) => `${record.id} ${record.employee} ${record.department} ${record.status}`.toLowerCase().includes(query.toLowerCase().trim())); return <><div className="page-heading"><div><div className="eyebrow">TRANSPORT REQUESTS / TRACKER</div><h1>Transportation request tracker</h1><p>Find, review, duplicate, archive, and print transportation requests.</p></div><button className="primary-button" onClick={onNew}><Plus size={16} /> New request</button></div><div className="stats-row"><Stat label="All requests" value={records.length} /><Stat label="Pending review" value={records.filter((r) => r.status === 'SUBMITTED' || r.status === 'CHECKED').length} accent="amber" /><Stat label="Approved value" value={peso(records.filter((r) => r.status === 'APPROVED').reduce((a, r) => a + r.total, 0))} accent="green" /></div><section className="data-panel"><div className="panel-toolbar"><div className="search-box"><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search TFT no. or employee" /></div><button className="secondary-button"><Filter size={15} /> Filters</button><button className="icon-button"><FileDown size={17} /></button></div><div className="records-table-wrap"><table className="records-table"><thead><tr><th>TFT NO.</th><th>EMPLOYEE</th><th>DATE FILED</th><th>DEPARTMENT</th><th>TOTAL</th><th>STATUS</th><th></th></tr></thead><tbody>{filteredRecords.map((record) => <tr key={record.id}><td><strong>{record.id}</strong></td><td>{record.employee}</td><td>{record.date}</td><td>{record.department}</td><td><strong>{peso(record.total)}</strong></td><td><span className={`status ${record.status.toLowerCase()}`}>{record.status}</span></td><td><div className="row-actions"><button title="View"><ClipboardList size={15} /></button><button title="Edit" onClick={() => onEdit(record)}><Pencil size={15} /></button><button title="Duplicate" onClick={() => onDuplicate(record)}><Copy size={15} /></button><button title="Archive" onClick={() => onArchive(record.id)}><Archive size={15} /></button></div></td></tr>)}</tbody></table></div></section></> }
function Stat({ label, value, accent = '' }: { label: string; value: string | number; accent?: string }) { return <div className={`stat-card ${accent}`}><span>{label}</span><strong>{value}</strong></div> }
function DashboardPage({ records, user }: { records: RecordItem[]; user: AppUser }) { const period = '2026-09'; const currentMonthRecords = records.filter((record) => record.date.startsWith(period)); const pending = records.filter((record) => record.status === 'SUBMITTED' || record.status === 'CHECKED'); const approved = records.filter((record) => record.status === 'APPROVED'); const currentMonthCost = currentMonthRecords.reduce((sum, record) => sum + record.total, 0); const monthData = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'].map((label, index) => { const month = String(index + 4).padStart(2, '0'); return { label, total: records.filter((record) => record.date.startsWith(`2026-${month}`)).reduce((sum, record) => sum + record.total, 0) } }); const maxMonthly = Math.max(...monthData.map((item) => item.total), 1); return <><div className="page-heading"><div><div className="eyebrow">OVERVIEW / SEPTEMBER 2026</div><h1>Good morning, {user.name}.</h1><p>Here is the current transportation request activity.</p></div><button className="secondary-button"><FileDown size={16} /> Export report</button></div><div className="stats-row dashboard-stats"><Stat label="Total TFT this month" value={currentMonthRecords.length} /><Stat label="Pending review" value={pending.length} accent="amber" /><Stat label="Approved" value={approved.length} accent="green" /><Stat label="Transport cost" value={peso(currentMonthCost)} accent="blue" /></div><div className="dashboard-grid"><section className="data-panel chart-panel"><div className="panel-title"><div><strong>Transportation cost</strong><span>Monthly spend overview</span></div><button className="icon-button"><SlidersHorizontal size={16} /></button></div><div className="bar-chart">{monthData.map((item) => <div className="bar-column" key={item.label}><div className="bar" style={{ height: `${Math.max((item.total / maxMonthly) * 84, item.total ? 18 : 4)}%` }}><span>{peso(item.total)}</span></div><small>{item.label}</small></div>)}</div></section><section className="data-panel recent-panel"><div className="panel-title"><div><strong>Recent requests</strong><span>Latest activity</span></div><button className="text-button">View all</button></div>{records.slice(0, 4).map((record) => <div className="recent-item" key={record.id}><div className="mini-icon"><UserRound size={15} /></div><div><strong>{record.employee}</strong><span>{record.id} • {record.date}</span></div><b>{peso(record.total)}</b></div>)}</section></div></> }
function MasterPage({ data, onAdd, onEdit, onDelete }: { data: Record<string, string[]>; onAdd: (category: string) => void; onEdit: (category: string, index: number) => void; onDelete: (category: string, index: number) => void }) { const [active, setActive] = useState('Transportation Modes'); const [query, setQuery] = useState(''); const filteredItems = data[active].map((item, index) => ({ item, index })).filter(({ item }) => item.toLowerCase().includes(query.toLowerCase().trim())); return <><div className="page-heading"><div><div className="eyebrow">ADMINISTRATION / MASTER DATA</div><h1>Master data</h1><p>Manage the selections and rates used across every TFT.</p></div><button className="primary-button" onClick={() => onAdd(active)}><Plus size={16} /> Add record</button></div><div className="master-layout"><div className="master-tabs">{Object.keys(data).map((item) => <button className={active === item ? 'active' : ''} onClick={() => { setActive(item); setQuery('') }} key={item}>{item}<ChevronDown size={14} /></button>)}</div><section className="data-panel master-panel"><div className="panel-toolbar"><div><strong>{active}</strong><span className="record-count">{data[active].length} records</span></div><div className="search-box compact"><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search records" /></div></div>{filteredItems.map(({ item, index }) => <div className="master-row" key={`${item}-${index}`}><div className="master-index">{String(index + 1).padStart(2, '0')}</div><strong>{item}</strong><span className="active-label">ACTIVE</span><div className="master-actions"><button onClick={() => onEdit(active, index)} title="Edit"><Pencil size={15} /></button><button onClick={() => onDelete(active, index)} title="Delete"><Trash2 size={15} /></button></div></div>)}</section></div></> }

export default App

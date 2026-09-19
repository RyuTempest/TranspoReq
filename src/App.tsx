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

const initialMasterData: Record<string, string[]> = { Employees: ['Dulce Blanca D. Singatue', 'Cherry Ann Galvan', 'Nicole Carmina B. Gonzaga'], Departments: ['Operations', 'Finance', 'Administration', 'Human Resources'], Positions: ['Operations Officer', 'Finance Associate', 'Department Head'], Locations: ['Head Office', 'Cebu IT Park', 'SM City Cebu', 'Mactan Airport', 'Ayala Center', 'La Salle'], 'Transportation Modes': ['Jeepney', 'Tricycle', 'Taxi', 'Bus', 'Motorcycle', 'Private Vehicle', 'Other'], 'Fare Rates': ['Head Office → La Salle · Jeepney · ₱12.00', 'Head Office → Cebu IT Park · Taxi · ₱180.00', 'Head Office → Mactan Airport · Taxi · ₱280.00'] }
const initialUsers: StoredUser[] = [{ username: 'admin', name: 'Admin', password: 'admin123', role: 'ADMIN' }, { username: 'user', name: 'Staff User', password: 'user123', role: 'USER' }]
const employeeProfiles: Record<string, { position: string; department: string }> = { 'Dulce Blanca D. Singatue': { position: 'Operations Officer', department: 'Operations' }, 'Cherry Ann Galvan': { position: 'Finance Associate', department: 'Finance' }, 'Nicole Carmina B. Gonzaga': { position: 'Department Head', department: 'Administration' } }
const fares: Record<string, number> = { 'Head Office|La Salle|Jeepney': 12, 'Head Office|Cebu IT Park|Taxi': 180, 'Head Office|SM City Cebu|Jeepney': 15, 'Head Office|Mactan Airport|Taxi': 280, 'Ayala Center|Head Office|Jeepney': 12 }
const initialRows: Row[] = Array.from({ length: 15 }, (_, index) => index + 1).map((id) => ({ id, date: '', from: '', to: '', trips: '', mode: '', fare: '' }))
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
  const [users, setUsers] = useState<StoredUser[]>(() => readStorage('tft-users', initialUsers))
  const [page, setPage] = useState<Page>('new')
  const [mobileNav, setMobileNav] = useState(false)
  const [rows, setRows] = useState<Row[]>(initialRows)
  const [records, setRecords] = useState<RecordItem[]>(() => readStorage('tft-records', initialRecords))
  const [employee, setEmployee] = useState('Dulce Blanca D. Singatue')
  const [department, setDepartment] = useState('Operations')
  const [position, setPosition] = useState('Operations Officer')
  const [purpose, setPurpose] = useState('Client and field coordination')
  const [dateFiled, setDateFiled] = useState(today)
  const [notice, setNotice] = useState('')
  const [masterData, setMasterData] = useState<Record<string, string[]>>(() => readStorage('tft-master-data', initialMasterData))

  useEffect(() => localStorage.setItem('tft-records', JSON.stringify(records)), [records])
  useEffect(() => localStorage.setItem('tft-users', JSON.stringify(users)), [users])
  useEffect(() => localStorage.setItem('tft-master-data', JSON.stringify(masterData)), [masterData])
  useEffect(() => { if (user) localStorage.setItem('tft-session', JSON.stringify(user)); else localStorage.removeItem('tft-session') }, [user])

  const locationOptions = masterData.Locations
  const modeOptions = masterData['Transportation Modes']
  const employeeOptions = masterData.Employees
  const positionOptions = masterData.Positions
  const departmentOptions = masterData.Departments

  const total = useMemo(() => rows.reduce((sum, row) => sum + (Number(row.trips) || 0) * (Number(row.fare) || 0), 0), [rows])

  const updateRow = (id: number, key: keyof Row, value: string) => {
    setRows((current) => current.map((row) => {
      if (row.id !== id) return row
      const next = { ...row, [key]: value }
      if (key === 'from' || key === 'to' || key === 'mode') {
        const fare = fares[`${key === 'from' ? value : next.from}|${key === 'to' ? value : next.to}|${key === 'mode' ? value : next.mode}`]
        if (fare) next.fare = String(fare)
      }
      return next
    }))
  }

  const addRow = () => setRows((current) => [...current, { id: Date.now(), date: '', from: '', to: '', trips: '', mode: '', fare: '' }])
  const removeRow = (id: number) => setRows((current) => current.filter((row) => row.id !== id))
  const selectEmployee = (name: string) => { setEmployee(name); const profile = employeeProfiles[name]; if (profile) { setPosition(profile.position); setDepartment(profile.department) } }
  const saveDraft = () => {
    const completedRows = rows.filter((row) => row.date && row.from && row.to && row.mode && row.trips !== '' && Number(row.trips) > 0 && row.fare !== '' && Number(row.fare) >= 0)
    if (!employee || !dateFiled || !purpose) { setNotice('Complete the employee, date, and purpose fields first.'); return }
    if (!completedRows.length) { setNotice('Add at least one complete transportation detail before saving.'); return }
    const item: RecordItem = { id: `TFT-${String(records.length + 125).padStart(6, '0')}`, employee, department, date: dateFiled, total, status: 'DRAFT' }
    setRecords((current) => [item, ...current])
    setNotice(`${item.id} saved successfully.`)
  }
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
          {page === 'new' && <FormPage rows={rows} total={total} locations={locationOptions} modes={modeOptions} employees={employeeOptions} positions={positionOptions} departments={departmentOptions} employee={employee} setEmployee={selectEmployee} department={department} setDepartment={setDepartment} position={position} setPosition={setPosition} purpose={purpose} setPurpose={setPurpose} dateFiled={dateFiled} setDateFiled={setDateFiled} updateRow={updateRow} addRow={addRow} removeRow={removeRow} saveDraft={saveDraft} notice={notice} />}
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

function FormPage(props: { rows: Row[]; total: number; locations: string[]; modes: string[]; employees: string[]; positions: string[]; departments: string[]; employee: string; setEmployee: (v: string) => void; department: string; setDepartment: (v: string) => void; position: string; setPosition: (v: string) => void; purpose: string; setPurpose: (v: string) => void; dateFiled: string; setDateFiled: (v: string) => void; updateRow: (id: number, key: keyof Row, value: string) => void; addRow: () => void; removeRow: (id: number) => void; saveDraft: () => void; notice: string }) {
  const { rows, total, locations, modes, employees, positions, departments, employee, setEmployee, department, setDepartment, position, setPosition, purpose, setPurpose, dateFiled, setDateFiled, updateRow, addRow, removeRow, saveDraft, notice } = props
  return <>
    <div className="page-heading"><div><div className="eyebrow">TRANSPORT REQUESTS / CREATE</div><h1>New transportation request</h1><p>Complete the form, add each route, then print the final copy for physical signatures.</p></div><div className="heading-actions"><button className="secondary-button" onClick={() => window.print()}><Printer size={16} /> Print final form</button><button className="primary-button" onClick={saveDraft}><Check size={16} /> Save request</button></div></div>
    {notice && <div className="notice"><Check size={16} />{notice}<button onClick={() => {}} aria-label="Dismiss"><X size={15} /></button></div>}
    <section className="form-paper">
      <div className="paper-header"><div className="paper-kicker">TFT • 2026</div><h2>TRANSPORTATION REQUEST FORM</h2><div className="paper-meta">Form 01 <span>•</span> Internal use</div></div>
      <div className="employee-grid">
        <Field label="Name of Employee" value={employee} onChange={setEmployee} options={employees} placeholder="Select employee" required />
        <Field label="Position" value={position} onChange={setPosition} options={positions} placeholder="Select position" />
        <Field label="Date Filed" type="date" value={dateFiled} onChange={setDateFiled} required />
        <Field label="Department" value={department} onChange={setDepartment} options={departments} placeholder="Select department" />
        <div className="field purpose-field"><label>Purpose <span className="required">*</span></label><input value={purpose} onChange={(e) => setPurpose(e.target.value)} placeholder="Reason for transportation request" /></div>
      </div>
      <div className="table-toolbar"><div><strong>Transportation details</strong><span> Add each route used for this request</span></div><button className="text-button" onClick={addRow}><Plus size={15} /> Add row</button></div>
      <div className="table-scroll"><table className="transport-table"><thead><tr><th className="date-col">DATE</th><th>FROM</th><th>TO</th><th className="trips-col">NO. OF<br />TRIPS</th><th className="mode-col">TRANSPORTATION<br />MODE</th><th className="fare-col">UNIT FARE<br /><span>(₱)</span></th><th className="amount-col">TOTAL AMOUNT<br /><span>(₱)</span></th><th className="remove-col"></th></tr></thead><tbody>{rows.map((row) => { const amount = Number(row.trips) * Number(row.fare); return <tr key={row.id}><td><input type="date" value={row.date} onChange={(e) => updateRow(row.id, 'date', e.target.value)} /></td><td><Select value={row.from} options={locations} placeholder="Select" onChange={(v) => updateRow(row.id, 'from', v)} /></td><td><Select value={row.to} options={locations} placeholder="Select" onChange={(v) => updateRow(row.id, 'to', v)} /></td><td><input className="number-input" type="number" min="1" value={row.trips} onChange={(e) => updateRow(row.id, 'trips', e.target.value)} placeholder="0" /></td><td><Select value={row.mode} options={modes} placeholder="Select" onChange={(v) => updateRow(row.id, 'mode', v)} /></td><td><div className="fare-input"><span>₱</span><input type="number" min="0" step="0.01" value={row.fare} onChange={(e) => updateRow(row.id, 'fare', e.target.value)} placeholder="—" /></div></td><td className="amount-cell">{amount > 0 ? peso(amount) : ''}</td><td><button className="row-delete" onClick={() => removeRow(row.id)} title="Remove row"><Trash2 size={14} /></button></td></tr> })}</tbody></table></div>
      <div className="paper-total"><span>GRAND TOTAL</span><strong>{peso(total)}</strong></div>
      <div className="signature-grid"><Signature title="Prepared by" name="Dulce Blanca D. Singatue" /><Signature title="Signed by" name="Dulce Blanca D. Singatue" /><Signature title="Checked by" name="Cherry Ann Galvan" /><Signature title="President" name="Nicole Carmina B. Gonzaga" /></div>
      <div className="paper-footnote"><span>All fields marked with * are required.</span><span>Generated in tftdesk • {today}</span></div>
    </section>
  </>
}

function Field({ label, value, onChange, type = 'text', required = false, options, placeholder }: { label: string; value: string; onChange: (v: string) => void; type?: string; required?: boolean; options?: string[]; placeholder?: string }) { return <div className="field"><label>{label} {required && <span className="required">*</span>}</label>{options ? <Select value={value} options={options} onChange={onChange} placeholder={placeholder} /> : <input type={type} value={value} onChange={(e) => onChange(e.target.value)} />}</div> }
function Select({ value, options, onChange, placeholder = 'Select option' }: { value: string; options: string[]; onChange: (value: string) => void; placeholder?: string }) { return <div className="select-wrap"><select value={value} onChange={(e) => onChange(e.target.value)}><option value="">{placeholder}</option>{options.map((option) => <option key={option}>{option}</option>)}</select><ChevronDown size={14} /></div> }
function Signature({ title, name }: { title: string; name: string }) { return <div className="signature"><div className="signature-line"></div><strong>{name}</strong><span>{title}</span></div> }

function RecordsPage({ records, onNew, onArchive, onDuplicate, onEdit }: { records: RecordItem[]; onNew: () => void; onArchive: (id: string) => void; onDuplicate: (record: RecordItem) => void; onEdit: (record: RecordItem) => void }) { const [query, setQuery] = useState(''); const filteredRecords = records.filter((record) => `${record.id} ${record.employee} ${record.department} ${record.status}`.toLowerCase().includes(query.toLowerCase().trim())); return <><div className="page-heading"><div><div className="eyebrow">TRANSPORT REQUESTS / TRACKER</div><h1>Transportation request tracker</h1><p>Find, review, duplicate, archive, and print transportation requests.</p></div><button className="primary-button" onClick={onNew}><Plus size={16} /> New request</button></div><div className="stats-row"><Stat label="All requests" value={records.length} /><Stat label="Pending review" value={records.filter((r) => r.status === 'SUBMITTED' || r.status === 'CHECKED').length} accent="amber" /><Stat label="Approved value" value={peso(records.filter((r) => r.status === 'APPROVED').reduce((a, r) => a + r.total, 0))} accent="green" /></div><section className="data-panel"><div className="panel-toolbar"><div className="search-box"><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search TFT no. or employee" /></div><button className="secondary-button"><Filter size={15} /> Filters</button><button className="icon-button"><FileDown size={17} /></button></div><div className="records-table-wrap"><table className="records-table"><thead><tr><th>TFT NO.</th><th>EMPLOYEE</th><th>DATE FILED</th><th>DEPARTMENT</th><th>TOTAL</th><th>STATUS</th><th></th></tr></thead><tbody>{filteredRecords.map((record) => <tr key={record.id}><td><strong>{record.id}</strong></td><td>{record.employee}</td><td>{record.date}</td><td>{record.department}</td><td><strong>{peso(record.total)}</strong></td><td><span className={`status ${record.status.toLowerCase()}`}>{record.status}</span></td><td><div className="row-actions"><button title="View"><ClipboardList size={15} /></button><button title="Edit" onClick={() => onEdit(record)}><Pencil size={15} /></button><button title="Duplicate" onClick={() => onDuplicate(record)}><Copy size={15} /></button><button title="Archive" onClick={() => onArchive(record.id)}><Archive size={15} /></button></div></td></tr>)}</tbody></table></div></section></> }
function Stat({ label, value, accent = '' }: { label: string; value: string | number; accent?: string }) { return <div className={`stat-card ${accent}`}><span>{label}</span><strong>{value}</strong></div> }
function DashboardPage({ records, user }: { records: RecordItem[]; user: AppUser }) { const period = '2026-09'; const currentMonthRecords = records.filter((record) => record.date.startsWith(period)); const pending = records.filter((record) => record.status === 'SUBMITTED' || record.status === 'CHECKED'); const approved = records.filter((record) => record.status === 'APPROVED'); const currentMonthCost = currentMonthRecords.reduce((sum, record) => sum + record.total, 0); const monthData = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'].map((label, index) => { const month = String(index + 4).padStart(2, '0'); return { label, total: records.filter((record) => record.date.startsWith(`2026-${month}`)).reduce((sum, record) => sum + record.total, 0) } }); const maxMonthly = Math.max(...monthData.map((item) => item.total), 1); return <><div className="page-heading"><div><div className="eyebrow">OVERVIEW / SEPTEMBER 2026</div><h1>Good morning, {user.name}.</h1><p>Here is the current transportation request activity.</p></div><button className="secondary-button"><FileDown size={16} /> Export report</button></div><div className="stats-row dashboard-stats"><Stat label="Total TFT this month" value={currentMonthRecords.length} /><Stat label="Pending review" value={pending.length} accent="amber" /><Stat label="Approved" value={approved.length} accent="green" /><Stat label="Transport cost" value={peso(currentMonthCost)} accent="blue" /></div><div className="dashboard-grid"><section className="data-panel chart-panel"><div className="panel-title"><div><strong>Transportation cost</strong><span>Monthly spend overview</span></div><button className="icon-button"><SlidersHorizontal size={16} /></button></div><div className="bar-chart">{monthData.map((item) => <div className="bar-column" key={item.label}><div className="bar" style={{ height: `${Math.max((item.total / maxMonthly) * 84, item.total ? 18 : 4)}%` }}><span>{peso(item.total)}</span></div><small>{item.label}</small></div>)}</div></section><section className="data-panel recent-panel"><div className="panel-title"><div><strong>Recent requests</strong><span>Latest activity</span></div><button className="text-button">View all</button></div>{records.slice(0, 4).map((record) => <div className="recent-item" key={record.id}><div className="mini-icon"><UserRound size={15} /></div><div><strong>{record.employee}</strong><span>{record.id} • {record.date}</span></div><b>{peso(record.total)}</b></div>)}</section></div></> }
function MasterPage({ data, onAdd, onEdit, onDelete }: { data: Record<string, string[]>; onAdd: (category: string) => void; onEdit: (category: string, index: number) => void; onDelete: (category: string, index: number) => void }) { const [active, setActive] = useState('Transportation Modes'); const [query, setQuery] = useState(''); const filteredItems = data[active].map((item, index) => ({ item, index })).filter(({ item }) => item.toLowerCase().includes(query.toLowerCase().trim())); return <><div className="page-heading"><div><div className="eyebrow">ADMINISTRATION / MASTER DATA</div><h1>Master data</h1><p>Manage the selections and rates used across every TFT.</p></div><button className="primary-button" onClick={() => onAdd(active)}><Plus size={16} /> Add record</button></div><div className="master-layout"><div className="master-tabs">{Object.keys(data).map((item) => <button className={active === item ? 'active' : ''} onClick={() => { setActive(item); setQuery('') }} key={item}>{item}<ChevronDown size={14} /></button>)}</div><section className="data-panel master-panel"><div className="panel-toolbar"><div><strong>{active}</strong><span className="record-count">{data[active].length} records</span></div><div className="search-box compact"><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search records" /></div></div>{filteredItems.map(({ item, index }) => <div className="master-row" key={`${item}-${index}`}><div className="master-index">{String(index + 1).padStart(2, '0')}</div><strong>{item}</strong><span className="active-label">ACTIVE</span><div className="master-actions"><button onClick={() => onEdit(active, index)} title="Edit"><Pencil size={15} /></button><button onClick={() => onDelete(active, index)} title="Delete"><Trash2 size={15} /></button></div></div>)}</section></div></> }

export default App

# PayRoller Modern Dark Refactoring & UI Style Guide
# Modeled on: KokonutUI Layout with Sidebar Tab Navigation

You are a precise frontend UI refactoring agent. Your sole responsibility is to transform the layout of `AdminDashboard.jsx` into a premium, responsive, KokonutUI-styled dashboard. 

---

## 🚨 THE GOLDEN RULE (DO NOT VIOLATE)
- **DO NOT** modify, remove, or rename any JavaScript/React state variables, functions, API calls, props, or hooks.
- **DO NOT** alter how your state variables change tabs (e.g., do not touch your `activeTab` state or whatever state variable dictates which view is currently rendering). 
- **ONLY** alter `className` attributes and structural HTML/JSX wrappers.
- **PORTING THE TABS:** Convert the existing horizontal tab buttons into the left sidebar navigation items. Map their `onClick` handlers exactly to the corresponding sidebar buttons.

---

## 📐 Responsive Sidebar Layout with Tab Menu

Structure the layout of the page using this main layout wrapper:

```jsx
// 1. Ensure you preserve/add the mobile drawer state at the top:
// const [sidebarOpen, setSidebarOpen] = React.useState(false);

<div className="flex min-h-screen bg-[#09090b] text-[#e4e4e7] font-sans antialiased overflow-x-hidden">
  
  {/* MOBILE BACKDROP OVERLAY */}
  {sidebarOpen && (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden transition-opacity"
      onClick={() => setSidebarOpen(false)}
    />
  )}

  {/* LEFT SIDEBAR (Sticky Desktop, Sliding Drawer on Mobile) */}
  <aside className={`
    fixed inset-y-0 left-0 z-50 w-64 border-r border-[#1f1f23] bg-[#09090b] flex flex-col justify-between p-5 shrink-0
    transition-transform duration-300 ease-in-out md:translate-x-0 md:sticky md:top-0 md:h-screen md:flex
    ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
  `}>
    <div className="space-y-6">
      {/* Brand Header */}
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-md bg-emerald-500 flex items-center justify-center text-black font-bold text-xs">P</div>
          <span className="font-bold text-white tracking-tight text-sm">PayRoller Admin</span>
        </div>
        <button onClick={() => setSidebarOpen(false)} className="p-1 text-zinc-450 hover:text-white md:hidden">
          {/* Close Icon (X) */}
        </button>
      </div>

      {/* 4 Main Sidebar Tabs */}
      <div className="space-y-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 block px-2 mb-2">Workspace</span>
          <nav className="space-y-1">
            
            {/* TAB 1: OVERVIEW */}
            <button 
              onClick={() => { /* Apply your actual state handler for "Overview" here */ }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'Overview' // Match your actual state variable & value
                  ? 'text-white bg-[#121214] border border-[#1f1f23]' 
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900/40'
              }`}
            >
              {/* Home/Dashboard Icon */}
              Overview
            </button>

            {/* TAB 2: EMPLOYEE DIRECTORY */}
            <button 
              onClick={() => { /* Apply your actual state handler for "Employee Directory" here */ }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'Employee Directory'
                  ? 'text-white bg-[#121214] border border-[#1f1f23]' 
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900/40'
              }`}
            >
              {/* Directory/Users Icon */}
              Employee Directory
            </button>

            {/* TAB 3: PAYROLL HUB */}
            <button 
              onClick={() => { /* Apply your actual state handler for "Payroll Hub" here */ }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'Payroll Hub'
                  ? 'text-white bg-[#121214] border border-[#1f1f23]' 
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900/40'
              }`}
            >
              {/* Coins/Wallet Icon */}
              Payroll Hub
            </button>

            {/* TAB 4: ONBOARDING PORTAL */}
            <button 
              onClick={() => { /* Apply your actual state handler for "Onboarding Portal" here */ }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'Onboarding Portal'
                  ? 'text-white bg-[#121214] border border-[#1f1f23]' 
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900/40'
              }`}
            >
              {/* Mail/User Plus Icon */}
              Onboarding Portal
            </button>

          </nav>
        </div>
      </div>
    </div>

    {/* Footer Link / Profile / Refresh Base button */}
    <div className="border-t border-[#1f1f23] pt-4">
      {/* Insert your "Refresh Live Database" action button here */}
    </div>
  </aside>

  {/* RIGHT MAIN AREA */}
  <div className="flex-1 flex flex-col min-h-screen min-w-0">
    
    {/* Header bar (Visible on mobile for hamburger trigger, clean breadcrumb on desktop) */}
    <header className="h-14 border-b border-[#1f1f23] flex items-center justify-between px-4 md:px-8 bg-[#09090b] sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <button onClick={() => setSidebarOpen(true)} className="p-2 text-zinc-400 hover:text-white rounded-lg border border-[#1f1f23] bg-[#121214] md:hidden">
          {/* Hamburger Icon */}
        </button>
        <span className="text-xs text-zinc-500 font-mono">payroller &gt; {activeTab.toLowerCase()}</span>
      </div>
    </header>

    {/* MAIN ACTIVE VIEW SPACE */}
    <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto space-y-6 md:space-y-8 overflow-y-auto">
      {/* 
        This is where you render the active tab views. 
        Leave the existing conditional render logic untouched! 
      */}
    </main>

  </div>
</div>
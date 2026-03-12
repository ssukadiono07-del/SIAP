import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, 
  Trash2, 
  Download, 
  Upload, 
  ExternalLink, 
  LayoutDashboard,
  Settings,
  X,
  Save
} from 'lucide-react';

interface AppLink {
  id: string;
  name: string;
  url: string;
}

const DEFAULT_APPS: AppLink[] = [
  { id: '1', name: 'Wikipedia', url: 'https://en.wikipedia.org' },
  { id: '2', name: 'Example', url: 'https://example.com' },
];

export default function App() {
  const [apps, setApps] = useState<AppLink[]>([]);
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [newAppName, setNewAppName] = useState('');
  const [newAppUrl, setNewAppUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load apps from local storage on initial render
  useEffect(() => {
    const savedApps = localStorage.getItem('dashboard_apps');
    if (savedApps) {
      try {
        const parsed = JSON.parse(savedApps);
        setApps(parsed);
        if (parsed.length > 0) {
          setSelectedAppId(parsed[0].id);
        }
      } catch (e) {
        console.error('Failed to parse saved apps', e);
        setApps(DEFAULT_APPS);
        setSelectedAppId(DEFAULT_APPS[0].id);
      }
    } else {
      setApps(DEFAULT_APPS);
      setSelectedAppId(DEFAULT_APPS[0].id);
    }
  }, []);

  // Save apps to local storage whenever they change
  useEffect(() => {
    if (apps.length > 0) {
      localStorage.setItem('dashboard_apps', JSON.stringify(apps));
    } else {
      localStorage.removeItem('dashboard_apps');
    }
  }, [apps]);

  const handleAddApp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAppName.trim() || !newAppUrl.trim()) return;

    let formattedUrl = newAppUrl.trim();
    if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
      formattedUrl = 'https://' + formattedUrl;
    }

    const newApp: AppLink = {
      id: Date.now().toString(),
      name: newAppName.trim(),
      url: formattedUrl,
    };

    setApps([...apps, newApp]);
    setNewAppName('');
    setNewAppUrl('');
    setIsAdding(false);
    setSelectedAppId(newApp.id);
  };

  const handleDeleteApp = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updatedApps = apps.filter(app => app.id !== id);
    setApps(updatedApps);
    if (selectedAppId === id) {
      setSelectedAppId(updatedApps.length > 0 ? updatedApps[0].id : null);
    }
  };

  const handleBackup = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(apps, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "dashboard_backup.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleRestoreClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed) && parsed.every(item => item.id && item.name && item.url)) {
          setApps(parsed);
          if (parsed.length > 0) {
            setSelectedAppId(parsed[0].id);
          }
          alert('Backup restored successfully!');
        } else {
          alert('Invalid backup file format.');
        }
      } catch (error) {
        alert('Error reading backup file.');
        console.error(error);
      }
    };
    reader.readAsText(file);
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const selectedApp = apps.find(app => app.id === selectedAppId);

  return (
    <div className="flex h-screen w-full bg-slate-100 font-sans overflow-hidden">
      {/* Sidebar */}
      <div className="w-80 bg-slate-800 flex flex-col h-full shadow-2xl z-10 border-r border-slate-700">
        {/* Sidebar Header */}
        <div className="p-6 bg-slate-900 border-b border-slate-700 flex items-center gap-3">
          <div className="bg-indigo-500 p-2 rounded-lg shadow-[0_4px_0_rgb(67,56,202)]">
            <LayoutDashboard className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">App Hub</h1>
        </div>

        {/* Action Buttons */}
        <div className="p-4 grid grid-cols-2 gap-3 border-b border-slate-700 bg-slate-800/50">
          <button
            onClick={handleBackup}
            className="flex items-center justify-center gap-2 py-2.5 px-3 bg-slate-700 text-slate-200 rounded-xl font-medium text-sm transition-all duration-150 border-2 border-slate-600 shadow-[0_4px_0_rgb(71,85,105)] hover:bg-slate-600 active:shadow-[0_0px_0_rgb(71,85,105)] active:translate-y-1"
          >
            <Download className="w-4 h-4" />
            Backup
          </button>
          <button
            onClick={handleRestoreClick}
            className="flex items-center justify-center gap-2 py-2.5 px-3 bg-slate-700 text-slate-200 rounded-xl font-medium text-sm transition-all duration-150 border-2 border-slate-600 shadow-[0_4px_0_rgb(71,85,105)] hover:bg-slate-600 active:shadow-[0_0px_0_rgb(71,85,105)] active:translate-y-1"
          >
            <Upload className="w-4 h-4" />
            Restore
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".json"
            className="hidden"
          />
        </div>

        {/* App List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
          {apps.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <p>No apps added yet.</p>
              <p className="text-sm mt-1">Click "Add New App" to start.</p>
            </div>
          ) : (
            apps.map(app => (
              <div key={app.id} className="relative group">
                <button
                  onClick={() => setSelectedAppId(app.id)}
                  className={`w-full text-left px-4 py-3.5 rounded-xl font-semibold transition-all duration-150 border-2 flex items-center justify-between
                    ${selectedAppId === app.id 
                      ? 'bg-indigo-500 border-indigo-600 text-white shadow-[0_4px_0_rgb(79,70,229)] active:shadow-[0_0px_0_rgb(79,70,229)] active:translate-y-1' 
                      : 'bg-slate-700 border-slate-600 text-slate-200 shadow-[0_4px_0_rgb(71,85,105)] hover:bg-slate-600 active:shadow-[0_0px_0_rgb(71,85,105)] active:translate-y-1'
                    }`}
                >
                  <span className="truncate pr-8">{app.name}</span>
                </button>
                <button
                  onClick={(e) => handleDeleteApp(app.id, e)}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-all duration-150
                    ${selectedAppId === app.id 
                      ? 'text-indigo-200 hover:text-white hover:bg-indigo-600' 
                      : 'text-slate-400 hover:text-red-400 hover:bg-slate-600 opacity-0 group-hover:opacity-100'
                    }`}
                  title="Delete App"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Add App Section */}
        <div className="p-4 bg-slate-900 border-t border-slate-700">
          {isAdding ? (
            <form onSubmit={handleAddApp} className="space-y-3 bg-slate-800 p-4 rounded-2xl border border-slate-700 shadow-inner">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-sm font-semibold text-slate-200">Add New App</h3>
                <button 
                  type="button" 
                  onClick={() => setIsAdding(false)}
                  className="text-slate-400 hover:text-slate-200 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <input
                type="text"
                placeholder="App Name (e.g. Wikipedia)"
                value={newAppName}
                onChange={(e) => setNewAppName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm"
                autoFocus
              />
              <input
                type="text"
                placeholder="URL (e.g. wikipedia.org)"
                value={newAppUrl}
                onChange={(e) => setNewAppUrl(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm"
              />
              <button
                type="submit"
                disabled={!newAppName.trim() || !newAppUrl.trim()}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-emerald-500 text-white rounded-xl font-bold text-sm transition-all duration-150 border-2 border-emerald-600 shadow-[0_4px_0_rgb(5,150,105)] hover:bg-emerald-400 active:shadow-[0_0px_0_rgb(5,150,105)] active:translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:translate-y-0 disabled:active:shadow-[0_4px_0_rgb(5,150,105)]"
              >
                <Save className="w-4 h-4" />
                Save App
              </button>
            </form>
          ) : (
            <button
              onClick={() => setIsAdding(true)}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-indigo-500 text-white rounded-xl font-bold transition-all duration-150 border-2 border-indigo-600 shadow-[0_4px_0_rgb(67,56,202)] hover:bg-indigo-400 active:shadow-[0_0px_0_rgb(67,56,202)] active:translate-y-1"
            >
              <Plus className="w-5 h-5" />
              Add New App
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col bg-slate-200 relative">
        {selectedApp ? (
          <>
            {/* Top Bar */}
            <div className="h-14 bg-white border-b border-slate-300 flex items-center justify-between px-6 shadow-sm z-10">
              <div className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)] animate-pulse"></div>
                <h2 className="font-semibold text-slate-800">{selectedApp.name}</h2>
                <span className="text-xs text-slate-400 font-mono bg-slate-100 px-2 py-1 rounded-md border border-slate-200">
                  {selectedApp.url}
                </span>
              </div>
              <a
                href={selectedApp.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors border border-indigo-100"
              >
                Open in new tab
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
            
            {/* Iframe Container */}
            <div className="flex-1 p-4 lg:p-6 overflow-hidden">
              <div className="w-full h-full bg-white rounded-2xl shadow-xl border border-slate-300 overflow-hidden relative group">
                {/* Browser-like header for the iframe */}
                <div className="h-8 bg-slate-100 border-b border-slate-200 flex items-center px-4 gap-2">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-400"></div>
                    <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                    <div className="w-3 h-3 rounded-full bg-emerald-400"></div>
                  </div>
                  <div className="mx-auto flex-1 max-w-md bg-white h-5 rounded text-[10px] text-center text-slate-400 flex items-center justify-center border border-slate-200 font-mono truncate px-2">
                    {selectedApp.url}
                  </div>
                </div>
                <iframe
                  src={selectedApp.url}
                  title={selectedApp.name}
                  className="w-full h-[calc(100%-2rem)] border-none bg-white"
                  sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
                />
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
            <div className="w-24 h-24 mb-6 rounded-3xl bg-slate-300 flex items-center justify-center shadow-inner">
              <LayoutDashboard className="w-10 h-10 text-slate-400" />
            </div>
            <h2 className="text-xl font-semibold text-slate-600 mb-2">No App Selected</h2>
            <p className="text-slate-500 max-w-sm text-center">
              Select an app from the sidebar or add a new one to view it here.
            </p>
          </div>
        )}
      </div>
      
      {/* Global Styles for Custom Scrollbar */}
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #475569;
          border-radius: 20px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: #64748b;
        }
      `}} />
    </div>
  );
}

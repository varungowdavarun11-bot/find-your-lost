import React, { useState, useEffect, useRef } from 'react';
import { User, FoundItem, ViewState } from './types';
import { analyzeItemImage } from './services/geminiService';
import { Button } from './components/Button';
import { ItemCard } from './components/ItemCard';
import { 
  Search, 
  Plus, 
  LogOut, 
  Camera, 
  Upload, 
  ArrowLeft, 
  MapPin, 
  Calendar,
  Sparkles,
  School,
  X,
  User as UserIcon,
  Clock,
  CheckCircle,
  ShieldCheck,
  GraduationCap,
  ChevronRight
} from 'lucide-react';

// --- MOCK DATA SEED ---
const MOCK_ITEMS: FoundItem[] = [
  {
    id: '1',
    collegeId: 'MIT',
    finderId: 'Alex Rivera',
    image: 'https://images.unsplash.com/photo-1602143399344-185f8376228f?auto=format&fit=crop&q=80&w=400',
    name: 'Blue Hydroflask',
    description: 'Found a blue 32oz Hydroflask with stickers on the side. Left near the library entrance.',
    dateFound: new Date().toISOString(),
    location: 'Hayden Library',
    status: 'Unclaimed',
    tags: ['bottle', 'blue', 'water']
  },
  {
    id: '2',
    collegeId: 'MIT',
    finderId: 'Sarah Jenkins',
    image: 'https://images.unsplash.com/photo-1587145820266-a5951ee6f620?auto=format&fit=crop&q=80&w=400',
    name: 'Graphing Calculator',
    description: 'TI-84 Plus CE, silver edition. Found in Room 2-105 after calculus class.',
    dateFound: new Date(Date.now() - 86400000).toISOString(),
    location: 'Building 2',
    status: 'Unclaimed',
    tags: ['electronics', 'calculator', 'math']
  },
    {
    id: '3',
    collegeId: 'STANFORD',
    finderId: 'Jordan Smith',
    image: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&q=80&w=400',
    name: 'Red Hoodie',
    description: 'Generic red hoodie, size M. Found on the oval.',
    dateFound: new Date().toISOString(),
    location: 'The Oval',
    status: 'Unclaimed',
    tags: ['clothing', 'red', 'hoodie']
  }
];

const App = () => {
  // --- STATE ---
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState<ViewState>('LOGIN');
  const [loginStep, setLoginStep] = useState<'SELECT' | 'FORM'>('SELECT');
  const [loginRole, setLoginRole] = useState<'student' | 'college' | null>(null);
  
  const [items, setItems] = useState<FoundItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<FoundItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Login Form State
  const [collegeCodeInput, setCollegeCodeInput] = useState('');
  const [userNameInput, setUserNameInput] = useState('');

  // Upload Form State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [uploadImage, setUploadImage] = useState<string | null>(null);
  const [newItemName, setNewItemName] = useState('');
  const [newItemDesc, setNewItemDesc] = useState('');
  const [newItemDate, setNewItemDate] = useState(new Date().toISOString().split('T')[0]);
  const [newItemLocation, setNewItemLocation] = useState('');
  const [newItemTags, setNewItemTags] = useState<string[]>([]);
  
  // Profile View State
  const [profileTab, setProfileTab] = useState<'found' | 'claimed'>('found');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- EFFECTS ---
  useEffect(() => {
    const storedItems = localStorage.getItem('campusfind_items');
    if (storedItems) {
      setItems(JSON.parse(storedItems));
    } else {
      setItems(MOCK_ITEMS);
    }
  }, []);

  useEffect(() => {
    if (items.length > 0) {
      localStorage.setItem('campusfind_items', JSON.stringify(items));
    }
  }, [items]);

  // --- HANDLERS ---
  const handleRoleSelect = (role: 'student' | 'college') => {
    setLoginRole(role);
    setLoginStep('FORM');
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (collegeCodeInput && (loginRole === 'college' || userNameInput)) {
      setUser({
        collegeId: collegeCodeInput.toUpperCase(),
        studentId: loginRole === 'college' ? `${collegeCodeInput.toUpperCase()} Admin` : userNameInput
      });
      setView('DASHBOARD');
    }
  };

  const handleLogout = () => {
    setUser(null);
    setView('LOGIN');
    setLoginStep('SELECT');
    setLoginRole(null);
    setCollegeCodeInput('');
    setUserNameInput('');
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      setUploadImage(base64);
      
      setIsAnalyzing(true);
      try {
        const analysis = await analyzeItemImage(base64);
        setNewItemName(analysis.name);
        setNewItemDesc(analysis.description);
        setNewItemTags(analysis.tags);
        if(analysis.suggestedLocation) {
            if(!newItemLocation) setNewItemLocation(analysis.suggestedLocation);
        }
      } catch (err) {
        console.error("Analysis failed", err);
      } finally {
        setIsAnalyzing(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !uploadImage) return;

    const newItem: FoundItem = {
      id: Date.now().toString(),
      collegeId: user.collegeId,
      finderId: user.studentId,
      image: uploadImage,
      name: newItemName,
      description: newItemDesc,
      dateFound: newItemDate,
      location: newItemLocation,
      status: 'Unclaimed',
      tags: newItemTags
    };

    setItems(prev => [newItem, ...prev]);
    resetUploadForm();
    setView('DASHBOARD');
  };

  const handleClaimItem = () => {
    if (!selectedItem || !user) return;
    
    const updatedItems = items.map(i => {
      if (i.id === selectedItem.id) {
        return { 
          ...i, 
          status: 'Pending' as const, 
          claimerId: user.studentId 
        };
      }
      return i;
    });

    setItems(updatedItems);
    setSelectedItem({ 
      ...selectedItem, 
      status: 'Pending', 
      claimerId: user.studentId 
    });
  };

  const resetUploadForm = () => {
    setUploadImage(null);
    setNewItemName('');
    setNewItemDesc('');
    setNewItemDate(new Date().toISOString().split('T')[0]);
    setNewItemLocation('');
    setNewItemTags([]);
    setIsAnalyzing(false);
  };

  const filteredItems = items.filter(item => {
    const matchesCollege = user ? item.collegeId === user.collegeId : false;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCollege && matchesSearch;
  });

  const myFoundItems = items.filter(item => user && item.finderId === user.studentId);
  const myClaimedItems = items.filter(item => user && item.claimerId === user.studentId);

  // --- VIEWS ---

  if (view === 'LOGIN') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-indigo-50 via-white to-slate-100">
        <div className="w-full max-w-lg space-y-8">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-indigo-600 text-white mb-4 shadow-2xl shadow-indigo-200">
              <School size={40} />
            </div>
            <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">CampusFind</h1>
            <p className="text-slate-500 text-lg">Connecting lost items with their owners.</p>
          </div>

          {loginStep === 'SELECT' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in zoom-in-95 duration-500">
              <button 
                onClick={() => handleRoleSelect('student')}
                className="group p-8 bg-white rounded-[2rem] border-2 border-slate-100 shadow-xl shadow-slate-200/50 hover:border-indigo-500 hover:shadow-indigo-100 transition-all flex flex-col items-center text-center gap-6"
              >
                <div className="w-20 h-20 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-300">
                  <GraduationCap size={40} />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-2">Student</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">Join your campus community to find or report lost items.</p>
                </div>
                <div className="mt-auto flex items-center gap-2 font-bold text-indigo-600 group-hover:translate-x-1 transition-transform">
                  Enter Portal <ChevronRight size={18} />
                </div>
              </button>

              <button 
                onClick={() => handleRoleSelect('college')}
                className="group p-8 bg-white rounded-[2rem] border-2 border-slate-100 shadow-xl shadow-slate-200/50 hover:border-indigo-500 hover:shadow-indigo-100 transition-all flex flex-col items-center text-center gap-6"
              >
                <div className="w-20 h-20 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-300">
                  <ShieldCheck size={40} />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-2 text-nowrap">College or School</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">Establish and manage an official lost & found portal for your institution.</p>
                </div>
                <div className="mt-auto flex items-center gap-2 font-bold text-indigo-600 group-hover:translate-x-1 transition-transform">
                  Register Portal <ChevronRight size={18} />
                </div>
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 p-10 space-y-8 animate-in slide-in-from-bottom-4 fade-in duration-500">
              <div className="flex items-center justify-between">
                 <button 
                    onClick={() => setLoginStep('SELECT')}
                    className="flex items-center text-slate-400 hover:text-indigo-600 font-bold transition-colors"
                  >
                    <ArrowLeft size={18} className="mr-2" /> Back
                  </button>
                  <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-500 text-xs font-bold uppercase tracking-widest">
                    {loginRole === 'college' ? 'College/School' : 'Student'} Login
                  </span>
              </div>

              <div className="space-y-1">
                <h2 className="text-3xl font-bold text-slate-900">
                  {loginRole === 'college' ? 'Create your College or School ID' : 'Enter your College or School ID'}
                </h2>
                <p className="text-slate-500">
                  {loginRole === 'college' 
                    ? 'Define your official institution identifier.' 
                    : 'Access the official portal for your institution.'}
                </p>
              </div>

              <form onSubmit={handleLogin} className="space-y-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">College/School ID / Access Code</label>
                  <input
                    type="text"
                    required
                    placeholder="Enter unique ID"
                    className="w-full px-5 py-4 rounded-2xl border-2 border-slate-100 bg-slate-50 focus:bg-white focus:border-indigo-500 outline-none transition-all font-bold uppercase placeholder:normal-case"
                    value={collegeCodeInput}
                    onChange={(e) => setCollegeCodeInput(e.target.value)}
                  />
                </div>

                {loginRole === 'student' && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Your Full Name</label>
                    <input
                      type="text"
                      required
                      placeholder="Enter full name"
                      className="w-full px-5 py-4 rounded-2xl border-2 border-slate-100 bg-slate-50 focus:bg-white focus:border-indigo-500 outline-none transition-all font-bold"
                      value={userNameInput}
                      onChange={(e) => setUserNameInput(e.target.value)}
                    />
                  </div>
                )}

                <Button type="submit" className="w-full py-5 text-xl font-bold shadow-xl shadow-indigo-100 mt-4">
                  {loginRole === 'college' ? 'Set up Portal' : 'Access Portal'}
                </Button>
              </form>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-slate-50">
      <header className="flex-none bg-white border-b border-slate-200 px-4 py-3 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setView('DASHBOARD')}>
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-200">
              <School size={20} />
            </div>
            <div>
              <h1 className="font-bold text-slate-900 leading-tight">CampusFind</h1>
              <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full uppercase tracking-tighter">
                {user?.collegeId}
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="hidden sm:block text-right">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter leading-none mb-1">Signed in as</p>
                <p className="text-sm font-semibold text-slate-800 leading-none">{user?.studentId}</p>
            </div>
            <div className="w-px h-6 bg-slate-200 mx-1 hidden sm:block"></div>
            <button 
              onClick={() => setView('PROFILE')}
              className={`p-2 rounded-full transition-colors ${view === 'PROFILE' ? 'bg-indigo-100 text-indigo-600' : 'text-slate-400 hover:text-indigo-600 hover:bg-indigo-50'}`}
              title="My Activity"
            >
              <UserIcon size={20} />
            </button>
            <button 
              onClick={handleLogout}
              className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
              title="Logout"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto no-scrollbar relative">
        <div className="max-w-5xl mx-auto p-4 pb-24">
          
          {view === 'DASHBOARD' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="sticky top-0 z-20 pt-2 pb-4 bg-slate-50/95 backdrop-blur-sm">
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                  </div>
                  <input
                    type="text"
                    className="block w-full pl-11 pr-4 py-3.5 rounded-2xl border-none ring-1 ring-slate-200 shadow-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 transition-shadow bg-white font-medium"
                    placeholder="Search current lost items"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              {filteredItems.length === 0 ? (
                <div className="text-center py-20 px-4">
                  <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                    <Search size={32} />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900">No items found</h3>
                  <p className="text-slate-500 max-w-xs mx-auto mt-2">
                    {searchQuery 
                      ? `No matches for your search in the current portal.` 
                      : `The portal for ${user?.collegeId} is currently empty.`}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {filteredItems.map(item => (
                    <ItemCard 
                      key={item.id} 
                      item={item} 
                      onClick={(i) => {
                        setSelectedItem(i);
                        setView('ITEM_DETAIL');
                      }} 
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {view === 'PROFILE' && (
            <div className="animate-in fade-in duration-300 space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">{user?.studentId}</h2>
                  <p className="text-slate-500">History of your contributions and claims.</p>
                </div>
                <div className="bg-slate-100 p-1 rounded-xl inline-flex">
                  <button 
                    onClick={() => setProfileTab('found')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      profileTab === 'found' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    Found ({myFoundItems.length})
                  </button>
                  <button 
                    onClick={() => setProfileTab('claimed')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      profileTab === 'claimed' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    Claimed ({myClaimedItems.length})
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {profileTab === 'found' ? (
                  myFoundItems.length > 0 ? (
                    myFoundItems.map(item => (
                      <ItemCard 
                        key={item.id} 
                        item={item} 
                        onClick={(i) => {
                          setSelectedItem(i);
                          setView('ITEM_DETAIL');
                        }} 
                      />
                    ))
                  ) : (
                    <div className="col-span-full py-16 text-center text-slate-400 bg-white rounded-2xl border border-dashed border-slate-200">
                      <Camera size={48} className="mx-auto mb-3 opacity-20" />
                      <p>You have not reported any items.</p>
                      <Button variant="outline" className="mt-4" onClick={() => setView('UPLOAD')}>Report Found Item</Button>
                    </div>
                  )
                ) : (
                  myClaimedItems.length > 0 ? (
                    myClaimedItems.map(item => (
                      <ItemCard 
                        key={item.id} 
                        item={item} 
                        onClick={(i) => {
                          setSelectedItem(i);
                          setView('ITEM_DETAIL');
                        }} 
                      />
                    ))
                  ) : (
                    <div className="col-span-full py-16 text-center text-slate-400 bg-white rounded-2xl border border-dashed border-slate-200">
                      <CheckCircle size={48} className="mx-auto mb-3 opacity-20" />
                      <p>You have not claimed any items.</p>
                    </div>
                  )
                )}
              </div>
            </div>
          )}

          {view === 'ITEM_DETAIL' && selectedItem && (
            <div className="animate-in slide-in-from-right-10 duration-300">
              <Button 
                variant="ghost" 
                onClick={() => setView(user?.studentId === selectedItem.finderId || user?.studentId === selectedItem.claimerId ? 'PROFILE' : 'DASHBOARD')}
                className="mb-4 pl-0 hover:bg-transparent hover:text-indigo-600"
              >
                <ArrowLeft size={18} className="mr-2" /> Back
              </Button>

              <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="aspect-video w-full bg-slate-100 relative">
                  <img 
                    src={selectedItem.image} 
                    alt={selectedItem.name} 
                    className="w-full h-full object-contain"
                  />
                </div>
                
                <div className="p-6 md:p-8 space-y-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">
                        {selectedItem.name}
                      </h2>
                      <div className="flex flex-wrap gap-2">
                        {selectedItem.tags.map(tag => (
                          <span key={tag} className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 text-[10px] font-bold uppercase tracking-wider">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                    <span className={`px-4 py-1.5 rounded-full text-sm font-bold border ${
                      selectedItem.status === 'Claimed' 
                        ? 'bg-green-50 text-green-700 border-green-200' 
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>
                      {selectedItem.status}
                    </span>
                  </div>

                  <div className="prose prose-slate max-w-none">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Description</h3>
                    <p className="text-slate-700 leading-relaxed text-lg">
                      {selectedItem.description}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-6 border-t border-slate-100">
                    <div className="bg-slate-50 p-4 rounded-2xl space-y-1">
                      <div className="flex items-center text-slate-400 text-[10px] font-bold uppercase tracking-widest gap-2">
                        <Calendar size={12} /> Date Found
                      </div>
                      <div className="font-semibold text-slate-900 text-sm">
                        {new Date(selectedItem.dateFound).toLocaleDateString(undefined, {
                          weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                        })}
                      </div>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-2xl space-y-1">
                      <div className="flex items-center text-slate-400 text-[10px] font-bold uppercase tracking-widest gap-2">
                        <MapPin size={12} /> Location
                      </div>
                      <div className="font-semibold text-slate-900 text-sm">
                        {selectedItem.location || 'Not specified'}
                      </div>
                    </div>
                  </div>

                  <div className="pt-6">
                    {user?.studentId === selectedItem.finderId ? (
                         <div className="w-full py-4 text-center bg-slate-100 text-slate-600 rounded-xl border border-slate-200 font-bold text-sm">
                            You reported this item
                        </div>
                    ) : user?.studentId === selectedItem.claimerId ? (
                        <div className="w-full py-4 flex flex-col items-center justify-center gap-1 bg-amber-50 text-amber-800 rounded-xl border border-amber-200 font-bold">
                            <span className="flex items-center gap-2"><Clock size={18} /> Claim Pending</span>
                            <span className="text-[10px] opacity-75 font-medium">Verification in progress.</span>
                        </div>
                    ) : selectedItem.status === 'Unclaimed' ? (
                        <>
                            <Button 
                                onClick={handleClaimItem}
                                className="w-full py-4 text-lg font-bold shadow-xl shadow-indigo-100"
                            >
                                This is mine
                            </Button>
                            <p className="text-center text-[11px] text-slate-400 mt-3">
                                Reported by {selectedItem.finderId}.
                            </p>
                        </>
                    ) : (
                        <div className="w-full py-4 text-center bg-slate-50 text-slate-400 rounded-xl border border-slate-200 text-sm font-medium">
                            This item is no longer available
                        </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {view === 'UPLOAD' && (
            <div className="animate-in slide-in-from-bottom-10 duration-300 max-w-2xl mx-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-slate-900">Report Found Item</h2>
                <Button 
                    variant="ghost" 
                    onClick={() => {
                        resetUploadForm();
                        setView('DASHBOARD');
                    }}
                    className="text-slate-400"
                >
                    <X size={24} />
                </Button>
              </div>

              <form onSubmit={handleSubmitItem} className="space-y-6">
                <div className="relative group">
                    <input 
                        type="file" 
                        ref={fileInputRef}
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden" 
                    />
                    
                    {!uploadImage ? (
                        <div 
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full aspect-[4/3] rounded-3xl border-2 border-dashed border-slate-300 bg-slate-50 hover:bg-white hover:border-indigo-400 hover:shadow-lg transition-all cursor-pointer flex flex-col items-center justify-center gap-3 group-hover:scale-[1.01]"
                        >
                            <div className="p-4 bg-indigo-50 text-indigo-600 rounded-full group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                <Camera size={32} />
                            </div>
                            <div className="text-center px-4">
                                <p className="font-bold text-slate-700">Take photo or upload image</p>
                                <p className="text-sm text-slate-400">Gemini AI will identify the item automatically</p>
                            </div>
                        </div>
                    ) : (
                        <div className="w-full aspect-[4/3] rounded-3xl overflow-hidden relative shadow-lg bg-black">
                            <img src={uploadImage} alt="Preview" className={`w-full h-full object-contain ${isAnalyzing ? 'opacity-50' : 'opacity-100'}`} />
                            
                            {isAnalyzing && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                                    <Sparkles className="animate-spin mb-2" size={32} />
                                    <span className="font-bold text-lg animate-pulse">Analyzing...</span>
                                </div>
                            )}
                            
                            {!isAnalyzing && (
                                <button
                                    type="button" 
                                    onClick={() => setUploadImage(null)}
                                    className="absolute top-4 right-4 p-2 bg-black/50 text-white rounded-full hover:bg-red-500 backdrop-blur-md transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            )}
                        </div>
                    )}
                </div>

                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-4">
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Item Name *</label>
                        <input
                            type="text"
                            required
                            placeholder="Enter item name"
                            value={newItemName}
                            onChange={(e) => setNewItemName(e.target.value)}
                            className="w-full px-4 py-3.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Date Found *</label>
                            <input
                                type="date"
                                required
                                value={newItemDate}
                                onChange={(e) => setNewItemDate(e.target.value)}
                                className="w-full px-4 py-3.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium"
                            />
                        </div>
                         <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Location Details</label>
                            <input
                                type="text"
                                placeholder="Enter specific location"
                                value={newItemLocation}
                                onChange={(e) => setNewItemLocation(e.target.value)}
                                className="w-full px-4 py-3.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium"
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Item Description</label>
                        <textarea
                            rows={3}
                            placeholder="Provide any identifying features"
                            value={newItemDesc}
                            onChange={(e) => setNewItemDesc(e.target.value)}
                            className="w-full px-4 py-3.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none font-medium"
                        />
                    </div>
                </div>

                <div className="pb-8">
                     <Button 
                        type="submit" 
                        disabled={!uploadImage || isAnalyzing}
                        className="w-full py-4 text-lg font-bold shadow-xl shadow-indigo-100"
                    >
                        Publish Finding
                    </Button>
                </div>
              </form>
            </div>
          )}
        </div>
      </main>

      {view === 'DASHBOARD' && (
        <div className="absolute bottom-6 right-6 z-40">
          <button 
            onClick={() => setView('UPLOAD')}
            className="group flex items-center justify-center w-14 h-14 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-300 hover:scale-110 hover:shadow-indigo-400 transition-all text-white"
          >
            <Plus size={28} className="transition-transform group-hover:rotate-90" />
          </button>
        </div>
      )}
    </div>
  );
};

export default App;
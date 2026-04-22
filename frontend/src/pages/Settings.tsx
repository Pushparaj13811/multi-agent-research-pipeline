import { useState, useEffect } from 'react';
import { User, KeyRound, SlidersHorizontal, Eye, EyeOff, Loader2, Trash2, Plus, AlertCircle, Check, LogOut, Mail, Calendar, Shield } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useSettingsStore } from '../store/settingsStore';
import { storeAPIKey, listAPIKeys, deleteAPIKey } from '../api/client';
import { useNavigate } from 'react-router-dom';
import type { LLMProvider } from '../types';

type SettingsTab = 'profile' | 'keys' | 'preferences';

interface ProviderConfig {
  id: LLMProvider;
  name: string;
  color: string;
  gradient: string;
  keyPlaceholder: string;
  description: string;
  docsUrl: string;
}

const PROVIDERS: ProviderConfig[] = [
  {
    id: 'openai',
    name: 'OpenAI',
    color: 'emerald',
    gradient: 'from-emerald-500/10 to-emerald-600/5',
    keyPlaceholder: 'sk-proj-...',
    description: 'Access GPT-4o and other OpenAI models',
    docsUrl: 'https://platform.openai.com/api-keys',
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    color: 'orange',
    gradient: 'from-orange-500/10 to-orange-600/5',
    keyPlaceholder: 'sk-ant-...',
    description: 'Access Claude and other Anthropic models',
    docsUrl: 'https://console.anthropic.com/settings/keys',
  },
  {
    id: 'bedrock',
    name: 'AWS Bedrock',
    color: 'amber',
    gradient: 'from-amber-500/10 to-amber-600/5',
    keyPlaceholder: 'Enter your Bedrock API key',
    description: 'Access Claude via AWS Bedrock runtime',
    docsUrl: 'https://docs.aws.amazon.com/bedrock/',
  },
];

const SIDEBAR_ITEMS: { id: SettingsTab; label: string; icon: typeof User; description: string }[] = [
  { id: 'profile', label: 'Profile', icon: User, description: 'Account information' },
  { id: 'keys', label: 'API Keys', icon: KeyRound, description: 'Provider credentials' },
  { id: 'preferences', label: 'Preferences', icon: SlidersHorizontal, description: 'Defaults & limits' },
];

// ============================================
// Profile Tab
// ============================================
function ProfileTab() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) return null;

  const initials = (user.full_name || user.email)
    .split(' ')
    .map(s => s[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold text-white mb-1">Profile</h2>
        <p className="text-sm text-gray-500">Manage your account information</p>
      </div>

      {/* Avatar + Name */}
      <div className="flex items-center gap-5 p-6 bg-gray-800/20 border border-gray-700/30 rounded-2xl">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xl font-bold text-white shadow-lg shadow-indigo-500/20">
          {initials}
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white">{user.full_name || 'No name set'}</h3>
          <p className="text-sm text-gray-400">{user.email}</p>
        </div>
      </div>

      {/* Account Details */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider">Account Details</h3>
        <div className="grid gap-3">
          <div className="flex items-center justify-between p-4 bg-gray-800/20 border border-gray-700/30 rounded-xl">
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-gray-500" />
              <div>
                <p className="text-xs text-gray-500">Email</p>
                <p className="text-sm text-white">{user.email}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between p-4 bg-gray-800/20 border border-gray-700/30 rounded-xl">
            <div className="flex items-center gap-3">
              <Shield className="h-4 w-4 text-gray-500" />
              <div>
                <p className="text-xs text-gray-500">Account Status</p>
                <p className="text-sm text-white flex items-center gap-2">
                  <span className={`inline-block w-2 h-2 rounded-full ${user.is_active ? 'bg-emerald-400' : 'bg-red-400'}`} />
                  {user.is_active ? 'Active' : 'Inactive'}
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between p-4 bg-gray-800/20 border border-gray-700/30 rounded-xl">
            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-gray-500" />
              <div>
                <p className="text-xs text-gray-500">Member Since</p>
                <p className="text-sm text-white">Account created</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="pt-6 border-t border-gray-800/50">
        <h3 className="text-sm font-medium text-red-400/80 uppercase tracking-wider mb-4">Session</h3>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-2.5 text-red-400 bg-red-500/5 hover:bg-red-500/10 border border-red-500/10 hover:border-red-500/20 rounded-xl transition-all text-sm"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </div>
    </div>
  );
}

// ============================================
// API Keys Tab
// ============================================
function APIKeysTab() {
  const { storedKeys, setStoredKeys, addStoredKey, removeStoredKey } = useSettingsStore();
  const [newKey, setNewKey] = useState<Record<string, string>>({});
  const [showKey, setShowKey] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listAPIKeys()
      .then(data => setStoredKeys(data.keys))
      .catch(() => setError('Failed to load API keys'))
      .finally(() => setLoading(false));
  }, [setStoredKeys]);

  const handleSave = async (provider: ProviderConfig) => {
    const key = newKey[provider.id];
    if (!key) return;
    setSaving(provider.id);
    setError(null);
    setSuccess(null);
    try {
      const saved = await storeAPIKey(provider.id, key, `${provider.name} API Key`);
      addStoredKey(saved);
      setNewKey(prev => ({ ...prev, [provider.id]: '' }));
      setSuccess(`${provider.name} key saved and encrypted`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.detail || `Failed to save ${provider.name} key`);
    }
    setSaving(null);
  };

  const handleDelete = async (keyId: string, providerName: string) => {
    setDeleting(keyId);
    setError(null);
    try {
      await deleteAPIKey(keyId);
      removeStoredKey(keyId);
      setSuccess(`${providerName} key removed`);
      setTimeout(() => setSuccess(null), 3000);
    } catch {
      setError('Failed to delete key');
    }
    setDeleting(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-5 w-5 text-indigo-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold text-white mb-1">API Keys</h2>
        <p className="text-sm text-gray-500">Manage your LLM provider credentials. Keys are encrypted with AES-256 before storage.</p>
      </div>

      {error && (
        <div className="flex items-center gap-2.5 p-3.5 bg-red-500/5 border border-red-500/15 rounded-xl animate-in">
          <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0" />
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2.5 p-3.5 bg-emerald-500/5 border border-emerald-500/15 rounded-xl">
          <Check className="h-4 w-4 text-emerald-400 flex-shrink-0" />
          <p className="text-sm text-emerald-400">{success}</p>
        </div>
      )}

      <div className="space-y-4">
        {PROVIDERS.map((provider) => {
          const stored = storedKeys.find(k => k.provider === provider.id);

          return (
            <div
              key={provider.id}
              className={`rounded-2xl border transition-all overflow-hidden ${
                stored
                  ? `bg-gradient-to-r ${provider.gradient} border-${provider.color}-500/15`
                  : 'bg-gray-800/20 border-gray-700/30 hover:border-gray-600/40'
              }`}
            >
              <div className="p-5">
                {/* Provider Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl bg-${provider.color}-500/10 border border-${provider.color}-500/20 flex items-center justify-center`}>
                      <div className={`w-2.5 h-2.5 rounded-full bg-${provider.color}-400`} />
                    </div>
                    <div>
                      <h3 className="font-medium text-white">{provider.name}</h3>
                      <p className="text-xs text-gray-500">{provider.description}</p>
                    </div>
                  </div>
                  {stored && (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      <span className="text-xs text-emerald-400 font-medium">Active</span>
                    </div>
                  )}
                </div>

                {/* Key Content */}
                {stored ? (
                  <div className="flex items-center justify-between p-3.5 bg-black/20 rounded-xl">
                    <div className="flex items-center gap-3">
                      <KeyRound className="h-4 w-4 text-gray-500" />
                      <div>
                        <p className="text-sm text-gray-300 font-medium">{stored.label || `${provider.name} Key`}</p>
                        <p className="text-xs text-gray-600 mt-0.5">Added {new Date(stored.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDelete(stored.id, provider.name)}
                      disabled={deleting === stored.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-400 hover:text-red-400 bg-gray-800/50 hover:bg-red-500/10 border border-gray-700/30 hover:border-red-500/20 rounded-lg transition-all"
                    >
                      {deleting === stored.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="relative">
                      <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-600" />
                      <input
                        type={showKey[provider.id] ? 'text' : 'password'}
                        value={newKey[provider.id] || ''}
                        onChange={(e) => setNewKey(prev => ({ ...prev, [provider.id]: e.target.value }))}
                        placeholder={provider.keyPlaceholder}
                        className="w-full pl-10 pr-10 py-3 bg-black/20 border border-gray-700/40 rounded-xl text-sm text-white placeholder-gray-600 focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/30 transition-all"
                      />
                      {newKey[provider.id] && (
                        <button
                          onClick={() => setShowKey(prev => ({ ...prev, [provider.id]: !prev[provider.id] }))}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                        >
                          {showKey[provider.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <a
                        href={provider.docsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-gray-500 hover:text-indigo-400 transition-colors"
                      >
                        Get an API key →
                      </a>
                      <button
                        onClick={() => handleSave(provider)}
                        disabled={!newKey[provider.id] || saving === provider.id}
                        className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-700 disabled:text-gray-500 text-white text-sm font-medium rounded-lg transition-all"
                      >
                        {saving === provider.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                        Save Key
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================
// Preferences Tab
// ============================================
function PreferencesTab() {
  const { defaultProvider, setDefaultProvider, storedKeys } = useSettingsStore();

  const providerOptions: { id: LLMProvider; name: string; available: boolean }[] = [
    { id: 'openai', name: 'OpenAI (GPT-4o)', available: storedKeys.some(k => k.provider === 'openai') },
    { id: 'anthropic', name: 'Anthropic (Claude)', available: storedKeys.some(k => k.provider === 'anthropic') },
    { id: 'bedrock', name: 'AWS Bedrock', available: storedKeys.some(k => k.provider === 'bedrock') },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold text-white mb-1">Preferences</h2>
        <p className="text-sm text-gray-500">Configure default behavior for new research runs</p>
      </div>

      {/* Default Provider */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider">Default LLM Provider</h3>
        <div className="grid gap-2">
          {providerOptions.map((opt) => (
            <button
              key={opt.id}
              onClick={() => setDefaultProvider(opt.id)}
              disabled={!opt.available}
              className={`flex items-center justify-between p-4 rounded-xl border transition-all text-left ${
                defaultProvider === opt.id
                  ? 'bg-indigo-500/5 border-indigo-500/20'
                  : opt.available
                    ? 'bg-gray-800/20 border-gray-700/30 hover:border-gray-600/40'
                    : 'bg-gray-800/10 border-gray-800/20 opacity-50 cursor-not-allowed'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${
                  defaultProvider === opt.id ? 'border-indigo-400' : 'border-gray-600'
                }`}>
                  {defaultProvider === opt.id && <div className="w-2 h-2 rounded-full bg-indigo-400" />}
                </div>
                <span className={`text-sm font-medium ${defaultProvider === opt.id ? 'text-white' : 'text-gray-400'}`}>
                  {opt.name}
                </span>
              </div>
              {!opt.available && (
                <span className="text-xs text-gray-600">No key configured</span>
              )}
              {opt.available && defaultProvider === opt.id && (
                <span className="text-xs text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full">Default</span>
              )}
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-600">Only providers with configured API keys can be set as default.</p>
      </div>

      {/* Budget Defaults Info */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider">Budget Defaults</h3>
        <div className="p-4 bg-gray-800/20 border border-gray-700/30 rounded-xl">
          <p className="text-sm text-gray-400">
            Budget limits can be configured per research run. Server defaults are:
          </p>
          <div className="grid grid-cols-2 gap-4 mt-3">
            <div className="p-3 bg-black/20 rounded-lg">
              <p className="text-xs text-gray-500">Max Tokens</p>
              <p className="text-lg font-semibold text-white">100,000</p>
            </div>
            <div className="p-3 bg-black/20 rounded-lg">
              <p className="text-xs text-gray-500">Max Cost</p>
              <p className="text-lg font-semibold text-white">$1.00</p>
            </div>
          </div>
          <p className="text-xs text-gray-600 mt-3">Override these on the New Research page per run.</p>
        </div>
      </div>
    </div>
  );
}

// ============================================
// Main Settings Page
// ============================================
export default function Settings() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your account, API keys, and preferences</p>
      </div>

      <div className="flex gap-8">
        {/* Sidebar */}
        <div className="w-56 flex-shrink-0">
          <nav className="space-y-1 sticky top-20">
            {SIDEBAR_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-left transition-all ${
                    isActive
                      ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/15'
                      : 'text-gray-400 hover:text-white hover:bg-gray-800/30 border border-transparent'
                  }`}
                >
                  <Icon className={`h-4 w-4 ${isActive ? 'text-indigo-400' : 'text-gray-500'}`} />
                  <div>
                    <p className={`text-sm font-medium ${isActive ? 'text-indigo-400' : ''}`}>{item.label}</p>
                    <p className="text-xs text-gray-600">{item.description}</p>
                  </div>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="p-6 bg-gray-800/10 border border-gray-700/20 rounded-2xl">
            {activeTab === 'profile' && <ProfileTab />}
            {activeTab === 'keys' && <APIKeysTab />}
            {activeTab === 'preferences' && <PreferencesTab />}
          </div>
        </div>
      </div>
    </div>
  );
}

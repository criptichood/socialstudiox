import React from 'react';
import { Settings, Plus, Key, Edit3, Trash2, Globe, CheckCircle2 } from 'lucide-react';
import { PublishEndpointConfig } from '../../../types';

interface WebhookSettingsTabProps {
  publishEndpoints: PublishEndpointConfig[];
  selectedEndpointId: string;
  setSelectedEndpointId: (id: string) => void;
  setEditingEndpoint: (ep: PublishEndpointConfig | null) => void;
  setIsEndpointModalOpen: (open: boolean) => void;
  handleDeleteEndpoint: (id: string) => void;
  handleSaveEndpointsList: (newList: PublishEndpointConfig[]) => Promise<any>;
}

export const WebhookSettingsTab: React.FC<WebhookSettingsTabProps> = ({
  publishEndpoints,
  selectedEndpointId,
  setSelectedEndpointId,
  setEditingEndpoint,
  setIsEndpointModalOpen,
  handleDeleteEndpoint,
  handleSaveEndpointsList,
}) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Settings className="w-4 h-4 text-purple-500" />
            <span>Multi-Endpoint Webhook Configuration & Bearer Keys</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Configure external publishing endpoints, header authorization names, and Bearer secret keys.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setEditingEndpoint({
              id: `ep_${Date.now()}`,
              name: '',
              endpointUrl: 'https://',
              secretKey: '',
              headerName: 'Authorization',
              enabled: true,
              isDefault: false
            });
            setIsEndpointModalOpen(true);
          }}
          className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>+ Add Webhook Endpoint</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {publishEndpoints.map(ep => (
          <div
            key={ep.id}
            className={`p-4 bg-white dark:bg-slate-950 border rounded-2xl space-y-3 transition-all ${
              selectedEndpointId === ep.id
                ? 'border-purple-500 ring-2 ring-purple-500/20 shadow-md'
                : 'border-slate-200 dark:border-slate-800 hover:border-purple-300 dark:hover:border-purple-700'
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-900 dark:text-white font-display">
                    {ep.name}
                  </span>
                  {ep.isDefault && (
                    <span className="px-2 py-0.5 bg-purple-500/10 text-purple-600 dark:text-purple-300 rounded-md text-[10px] font-mono font-bold">
                      Default
                    </span>
                  )}
                </div>

                <p className="text-xs font-mono text-slate-500 dark:text-slate-400 break-all">
                  {ep.endpointUrl}
                </p>
                {ep.blogBaseUrl && (
                  <p className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 break-all">
                    Backlinks: {ep.blogBaseUrl}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => {
                    setEditingEndpoint(ep);
                    setIsEndpointModalOpen(true);
                  }}
                  className="p-1.5 text-slate-400 hover:text-purple-600 dark:hover:text-purple-300 rounded-lg transition-colors"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>

                {publishEndpoints.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleDeleteEndpoint(ep.id)}
                    className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-900 flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 text-slate-500 font-mono text-[11px]">
                <Key className="w-3 h-3 text-amber-500" />
                <span>Header: {ep.headerName || 'Authorization'}</span>
                <span>• Key: {ep.secretKey ? '••••••••' : 'None'}</span>
              </div>

              <button
                type="button"
                onClick={async () => {
                  setSelectedEndpointId(ep.id);
                  const updated = publishEndpoints.map(item => ({
                    ...item,
                    isDefault: item.id === ep.id
                  }));
                  await handleSaveEndpointsList(updated);
                }}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                  selectedEndpointId === ep.id
                    ? 'bg-purple-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-purple-50'
                }`}
              >
                {selectedEndpointId === ep.id ? 'Active Target' : 'Set Active'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

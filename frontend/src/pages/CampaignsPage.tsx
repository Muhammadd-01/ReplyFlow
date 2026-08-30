import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Play, Pause, Square, Edit3, Trash2, RotateCcw, Plus, Eye, EyeOff, MessageSquare } from 'lucide-react';
import { campaignsApi } from '../api/campaigns';
import { socket } from '../lib/socket';
import { toast } from 'sonner';
import { Card } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import Badge from '../components/ui/Badge';
import EmptyState from '../components/ui/EmptyState';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import type React from 'react';

export function CampaignsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'templates' | 'history'>('templates');
  const [expandedPreviewId, setExpandedPreviewId] = useState<string | null>(null);
  const [campaignToDelete, setCampaignToDelete] = useState<any>(null);
  
  // Edit Modal State
  const [editingCampaign, setEditingCampaign] = useState<any>(null);
  const [editName, setEditName] = useState('');
  const [editTemplate, setEditTemplate] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['campaigns'],
    queryFn: () => campaignsApi.getCampaigns(1, 100),
  });

  useEffect(() => {
    const handleUpdate = () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
    };
    socket.on('campaignUpdate' as any, handleUpdate);
    return () => {
      socket.off('campaignUpdate' as any, handleUpdate);
    };
  }, [queryClient]);

  const campaignsList = data?.items || [];
  const templates = campaignsList.filter(c => !c.parentCampaignId && !c.name.includes('(Custom Send)') && !c.name.includes('(Quick Send)'));
  const history = campaignsList.filter(c => !!c.parentCampaignId || c.name.includes('(Custom Send)') || c.name.includes('(Quick Send)'));
  const displayedCampaigns = activeTab === 'templates' ? templates : history;

  const startMutation = useMutation({
    mutationFn: campaignsApi.startCampaign,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['campaigns'] }),
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to start campaign'),
  });

  const pauseMutation = useMutation({
    mutationFn: campaignsApi.pauseCampaign,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['campaigns'] }),
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to pause campaign'),
  });

  const stopMutation = useMutation({
    mutationFn: campaignsApi.stopCampaign,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['campaigns'] }),
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to stop campaign'),
  });

  const deleteMutation = useMutation({
    mutationFn: campaignsApi.deleteCampaign,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['campaigns'] }),
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to delete campaign'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string, data: any }) => campaignsApi.updateCampaign(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      setEditingCampaign(null);
    }
  });

  const handleOpenEdit = (campaign: any) => {
    setEditingCampaign(campaign);
    setEditName(campaign.name);
    setEditTemplate(campaign.messageTemplate);
  };

  const handleSaveEdit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingCampaign) return;
    updateMutation.mutate({
      id: editingCampaign.id,
      data: {
        name: editName,
        messageTemplate: editTemplate,
      }
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'RUNNING': return <Badge variant="info">Running</Badge>;
      case 'PAUSED': return <Badge variant="warning">Paused</Badge>;
      case 'COMPLETED': return <Badge variant="success">Completed</Badge>;
      case 'FAILED': return <Badge variant="danger">Failed</Badge>;
      case 'STOPPED': return <Badge variant="danger">Stopped</Badge>;
      case 'DRAFT': return <Badge variant="default">Draft</Badge>;
      default: return <Badge variant="default">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Campaigns</h1>
          <p className="text-slate-500 dark:text-slate-400">Manage, preview, edit and run your WhatsApp messaging campaigns.</p>
        </div>
        <Button onClick={() => navigate('/campaigns/new')} leftIcon={<Plus size={18} />}>
          New Campaign
        </Button>
      </div>

      <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg w-full max-w-sm">
        <button
          onClick={() => setActiveTab('templates')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
            activeTab === 'templates' 
              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow' 
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
          }`}
        >
          Templates ({templates.length})
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
            activeTab === 'history' 
              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow' 
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
          }`}
        >
          Sent History ({history.length})
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-slate-500">Loading campaigns...</div>
      ) : displayedCampaigns.length === 0 ? (
        <EmptyState 
          icon={Play}
          title={activeTab === 'templates' ? 'No templates found' : 'No campaign history'}
          description={activeTab === 'templates' ? "Create a new campaign template to get started." : "Sent campaigns will appear here."}
          actionLabel="Create Campaign"
          onAction={() => navigate('/campaigns/new')}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-6">
          {displayedCampaigns.map((campaign: any) => {
            const isExpanded = expandedPreviewId === campaign.id;
            const progress = campaign.totalContacts > 0 
              ? Math.round((campaign.sentCount / campaign.totalContacts) * 100) 
              : 0;

            return (
              <Card key={campaign.id} className="flex flex-col overflow-hidden transition-all duration-300 hover:border-cyan-500/60 shadow-[0_4px_20px_rgba(0,0,0,0.2)] dark:shadow-[0_0_15px_rgba(6,182,212,0.15)] group relative bg-slate-900/40 backdrop-blur-md">
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                <div className="p-6 flex-1 relative z-10">
                  <div className="flex justify-between items-start mb-3">
                    <h3 
                      className="text-lg font-bold text-slate-800 dark:text-slate-100 line-clamp-1 hover:text-cyan-500 cursor-pointer transition-colors"
                      onClick={() => navigate(`/campaigns/${campaign.id}`)}
                    >
                      {campaign.name}
                    </h3>
                    {getStatusBadge(campaign.status)}
                  </div>
                  
                  {activeTab === 'history' && (
                    <div className="space-y-3 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500 dark:text-slate-400">Progress</span>
                        <span className="font-medium text-slate-800 dark:text-slate-200">
                          {campaign.sentCount} / {campaign.totalContacts}
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2 dark:bg-slate-800/50 overflow-hidden shadow-inner">
                        <div 
                          className="bg-gradient-to-r from-cyan-400 to-pink-500 h-2 rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(6,182,212,0.6)]" 
                          style={{ width: `${Math.max(0, Math.min(100, (campaign.sentCount / (campaign.totalContacts || 1)) * 100))}%` }}
                        ></div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 pt-3 border-t border-cyan-500/10">
                        <div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">Replied</p>
                          <p className="text-lg font-semibold text-cyan-600 dark:text-cyan-400">{campaign.repliedCount}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">Failed</p>
                          <p className="text-lg font-semibold text-pink-600 dark:text-pink-400">{campaign.failedCount}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Smooth Inline Message Preview */}
                  <div 
                    className={`transition-all duration-300 ease-in-out overflow-hidden ${
                      (isExpanded || activeTab === 'templates') ? 'max-h-96 opacity-100 mt-4 pt-4 border-t border-cyan-500/10' : 'max-h-0 opacity-0'
                    }`}
                  >
                    <p className="text-xs font-semibold text-cyan-600 dark:text-cyan-400 mb-2 flex items-center gap-1.5">
                      <MessageSquare size={14} /> Message Preview (WhatsApp)
                    </p>
                    <div className="bg-slate-100 dark:bg-[#0b141a]/80 p-3.5 rounded-xl border border-cyan-500/20 shadow-inner">
                      <div className="bg-white dark:bg-slate-800/90 p-3 rounded-lg shadow-sm text-slate-800 dark:text-slate-200 text-xs whitespace-pre-wrap font-sans leading-relaxed border-l-4 border-cyan-500">
                        {campaign.messageTemplate}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Actions Bar */}
                <div className="bg-slate-50/50 dark:bg-slate-900/60 p-4 border-t border-cyan-500/10 flex justify-between items-center relative z-10 backdrop-blur-sm">
                  <div className="text-xs text-slate-400 font-medium">
                    {activeTab === 'history' ? (
                      <>Sent on {new Date(campaign.createdAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</>
                    ) : (
                      <>
                        Created {new Date(campaign.createdAt).toLocaleDateString()}
                        {history.filter((h: any) => h.parentCampaignId === campaign.id).length > 0 && (
                          <>
                            <span className="mx-2 text-cyan-500/40">•</span>
                            <span className="text-cyan-600 dark:text-cyan-400">
                              Sent {history.filter((h: any) => h.parentCampaignId === campaign.id).length} time(s)
                            </span>
                          </>
                        )}
                      </>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-1.5">
                    {/* Toggle Preview Button */}
                    {activeTab === 'history' && (
                      <button 
                        onClick={() => setExpandedPreviewId(isExpanded ? null : campaign.id)}
                        className={`p-2 rounded-lg transition-colors ${
                          isExpanded 
                            ? 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300' 
                            : 'text-slate-500 hover:bg-cyan-50 dark:text-slate-400 dark:hover:bg-cyan-900/20'
                        }`}
                        title={isExpanded ? "Hide Preview" : "Preview Message Below"}
                      >
                        {isExpanded ? <EyeOff size={17} /> : <Eye size={17} />}
                      </button>
                    )}

                    {/* View Details Button */}
                    <button 
                      onClick={() => navigate(`/campaigns/${campaign.id}`)}
                      className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg dark:text-indigo-400 dark:hover:bg-indigo-900/30 transition-colors"
                      title="View Details & Recipients"
                    >
                      <Eye size={17} />
                    </button>

                    {/* Edit Button */}
                    <button 
                      onClick={() => handleOpenEdit(campaign)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg dark:text-blue-400 dark:hover:bg-blue-900/30 transition-colors"
                      title="Edit Campaign"
                    >
                      <Edit3 size={17} />
                    </button>

                    {/* Delete Button */}
                    <button 
                      onClick={() => setCampaignToDelete(campaign)}
                      className="p-2 text-pink-500 hover:bg-pink-50 rounded-lg dark:text-pink-400 dark:hover:bg-pink-900/30 transition-colors"
                      title="Delete Campaign"
                    >
                      <Trash2 size={17} />
                    </button>
                    
                    {/* Start / Restart Action for all non-running statuses */}
                    {campaign.status !== 'RUNNING' && (
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => startMutation.mutate(campaign.id)}
                        isLoading={startMutation.isPending}
                        leftIcon={campaign.status === 'COMPLETED' || campaign.status === 'STOPPED' ? <RotateCcw size={14} /> : <Play size={14} />}
                        className="ml-1 text-xs py-1.5 px-3 bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-400 hover:to-cyan-500 border-none shadow-[0_0_10px_rgba(6,182,212,0.3)]"
                      >
                        {campaign.status === 'COMPLETED' || campaign.status === 'STOPPED' ? 'Restart' : 'Start'}
                      </Button>
                    )}

                    {campaign.status === 'RUNNING' && (
                      <div className="flex gap-1">
                        <button 
                          onClick={() => pauseMutation.mutate(campaign.id)}
                          className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg dark:text-yellow-400 dark:hover:bg-yellow-900/30 transition-colors"
                          title="Pause"
                        >
                          <Pause size={17} />
                        </button>
                        <button 
                          onClick={() => stopMutation.mutate(campaign.id)}
                          className="p-2 text-pink-600 hover:bg-pink-50 rounded-lg dark:text-pink-400 dark:hover:bg-pink-900/30 transition-colors"
                          title="Stop"
                        >
                          <Square size={17} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Edit Campaign Modal */}
      <Modal 
        isOpen={!!editingCampaign} 
        onClose={() => setEditingCampaign(null)} 
        title="Edit SRO Campaign"
      >
        {editingCampaign && (
          <form onSubmit={handleSaveEdit} className="space-y-4">
            <Input
              label="Campaign Name"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              required
            />

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Message Template
              </label>
              <textarea
                value={editTemplate}
                onChange={(e) => setEditTemplate(e.target.value)}
                rows={5}
                required
                className="w-full rounded-xl border border-cyan-500/20 bg-slate-100 dark:bg-slate-900/60 p-3 text-sm text-slate-900 dark:text-white focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500 backdrop-blur-sm"
                placeholder="Dear {{name}}, this is a message from SRO office..."
              />
              <p className="text-xs text-slate-400 mt-1">
                You can use dynamic placeholders like <code className="text-cyan-500">{'{name}'}</code>, <code className="text-cyan-500">{'{phone}'}</code>, <code className="text-cyan-500">{'{id}'}</code>, <code className="text-cyan-500">{'{date}'}</code>.
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-cyan-500/10">
              <Button type="button" variant="outline" onClick={() => setEditingCampaign(null)}>
                Cancel
              </Button>
              <Button type="submit" isLoading={updateMutation.isPending} className="bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-400 hover:to-cyan-500">
                Save Changes
              </Button>
            </div>
          </form>
        )}
      </Modal>

      <ConfirmDialog
        isOpen={!!campaignToDelete}
        onClose={() => setCampaignToDelete(null)}
        onConfirm={() => {
          if (campaignToDelete) {
            deleteMutation.mutate(campaignToDelete.id);
            setCampaignToDelete(null);
          }
        }}
        title="Delete Campaign"
        message={`Are you sure you want to delete "${campaignToDelete?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
export default CampaignsPage;

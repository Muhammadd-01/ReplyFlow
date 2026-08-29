import fs from 'fs';

const filePath = 'src/pages/CampaignsPage.tsx';
let code = fs.readFileSync(filePath, 'utf8');

// Replace the entire grid
const renderStart = code.indexOf('<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">');
const renderEnd = code.indexOf(')}', renderStart) + 2; // to include the closing ')}' for the map

const newCardRender = `<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data?.items.map(campaign => {
            const isExpanded = expandedPreviewId === campaign.id;

            return (
              <Card key={campaign.id} className="flex flex-col overflow-hidden transition-all duration-300 hover:border-cyan-500/60 shadow-[0_4px_20px_rgba(0,0,0,0.2)] dark:shadow-[0_0_15px_rgba(6,182,212,0.15)] group relative">
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                <div className="p-6 flex-1 relative z-10">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 line-clamp-1">{campaign.name}</h3>
                    {getStatusBadge(campaign.status)}
                  </div>
                  
                  <div className="space-y-3 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500 dark:text-slate-400">Progress</span>
                      <span className="font-medium text-slate-800 dark:text-slate-200">
                        {campaign.sentCount} / {campaign.totalContacts}
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2 dark:bg-slate-800 overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-cyan-400 to-pink-500 h-2 rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(6,182,212,0.6)]" 
                        style={{ width: \`\${Math.max(0, Math.min(100, (campaign.sentCount / (campaign.totalContacts || 1)) * 100))}\%\` }}
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

                  {/* Smooth Inline Message Preview */}
                  <div 
                    className={\`transition-all duration-300 ease-in-out overflow-hidden \${
                      isExpanded ? 'max-h-96 opacity-100 mt-4 pt-4 border-t border-cyan-500/10' : 'max-h-0 opacity-0'
                    }\`}
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
                  <div className="text-xs text-slate-400">
                    {new Date(campaign.createdAt).toLocaleDateString()}
                  </div>
                  
                  <div className="flex items-center space-x-1.5">
                    {/* Toggle Preview Button */}
                    <button 
                      onClick={() => setExpandedPreviewId(isExpanded ? null : campaign.id)}
                      className={\`p-2 rounded-lg transition-colors \${
                        isExpanded 
                          ? 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300' 
                          : 'text-slate-500 hover:bg-cyan-50 dark:text-slate-400 dark:hover:bg-cyan-900/20'
                      }\`}
                      title={isExpanded ? "Hide Preview" : "Preview Message Below"}
                    >
                      {isExpanded ? <EyeOff size={17} /> : <Eye size={17} />}
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
                      onClick={() => {
                        if (confirm(\`Delete "\${campaign.name}"?\`)) {
                          deleteMutation.mutate(campaign.id);
                        }
                      }}
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
          })}`;

code = code.substring(0, renderStart) + newCardRender + code.substring(renderEnd);
fs.writeFileSync(filePath, code);

import React, { useState } from 'react';
import { X, Search, Package, Plus, Minus, Sparkles } from 'lucide-react';
import { MinecraftItem, Player } from '../types';
import { POPULAR_ITEMS } from '../data/mockData';
import { playSound } from '../utils/audio';

interface GiveItemModalProps {
  player: Player;
  isOpen: boolean;
  onClose: () => void;
  onGiveItem: (playerUsername: string, itemId: string, amount: number) => void;
}

export const GiveItemModal: React.FC<GiveItemModalProps> = ({
  player,
  isOpen,
  onClose,
  onGiveItem,
}) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedItem, setSelectedItem] = useState<MinecraftItem>(POPULAR_ITEMS[0]);
  const [customItemId, setCustomItemId] = useState('');
  const [amount, setAmount] = useState<number>(1);

  if (!isOpen) return null;

  const categories = [
    { id: 'all', label: 'All' },
    { id: 'weapons', label: 'Weapons' },
    { id: 'tools', label: 'Tools' },
    { id: 'armor', label: 'Armor' },
    { id: 'minerals', label: 'Minerals' },
    { id: 'food', label: 'Food' },
    { id: 'utility', label: 'Utility' },
    { id: 'redstone', label: 'Redstone' },
  ];

  const filteredItems = POPULAR_ITEMS.filter((item) => {
    const matchesCat = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesSearch =
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.id.toLowerCase().includes(search.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const handleSelectPredefined = (item: MinecraftItem) => {
    setSelectedItem(item);
    setCustomItemId('');
    setAmount(item.defaultAmount || 1);
    playSound('pop');
  };

  const handleGive = () => {
    const finalItemId = customItemId.trim()
      ? customItemId.trim().replace(/^minecraft:/, '')
      : selectedItem.id;

    if (!finalItemId) return;
    onGiveItem(player.username, finalItemId, Math.max(1, Math.min(amount, 64)));
    playSound('success');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#161b22] border border-[#21262d] rounded-xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-[#21262d] flex items-center justify-between bg-[#1b212c]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Give Item</h3>
              <p className="text-xs text-slate-400 font-mono">
                Target: <span className="text-emerald-400 font-semibold">{player.username}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#21262d] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* Search & Categories */}
          <div className="space-y-2">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search Minecraft items..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-[#0d1117] border border-[#21262d] rounded-lg pl-9 pr-3 py-2 text-xs font-mono text-white placeholder:text-slate-600 focus:outline-none focus:border-[#388bfd]"
              />
            </div>

            {/* Category tabs */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 no-scrollbar">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-2.5 py-1 text-xs rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                    selectedCategory === cat.id
                      ? 'bg-[#1f6feb] text-white font-medium'
                      : 'bg-[#0d1117] text-slate-400 hover:text-slate-200 border border-[#21262d]'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Items Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-1 bg-[#0d1117] rounded-lg border border-[#21262d]">
            {filteredItems.map((item) => {
              const isSelected = !customItemId && selectedItem.id === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelectPredefined(item)}
                  className={`p-2 rounded-lg text-left flex items-center gap-2 transition-all cursor-pointer border ${
                    isSelected
                      ? 'bg-emerald-950/40 border-emerald-500/60 text-white'
                      : 'bg-[#161b22] border-[#21262d] hover:border-[#30363d] text-slate-300'
                  }`}
                >
                  <span className="text-xl shrink-0 select-none">{item.iconEmoji}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium truncate">{item.name}</p>
                    <p className="text-[10px] font-mono text-slate-500 truncate">{item.id}</p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Or Custom Item ID */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              Custom Item ID (optional)
            </label>
            <input
              type="text"
              placeholder="e.g. enchanted_golden_apple, beacon, wither_skeleton_skull"
              value={customItemId}
              onChange={(e) => setCustomItemId(e.target.value)}
              className="w-full bg-[#0d1117] border border-[#21262d] rounded-lg px-3 py-2 text-xs font-mono text-white placeholder:text-slate-600 focus:outline-none focus:border-[#388bfd]"
            />
          </div>

          {/* Quantity Stepper */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-[#0d1117] border border-[#21262d]">
            <div>
              <span className="text-xs font-medium text-slate-300 block">Quantity Stack</span>
              <span className="text-[10px] text-slate-500 font-mono">Max 64 per command</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setAmount((prev) => Math.max(1, prev - 1))}
                className="w-7 h-7 rounded bg-[#21262d] hover:bg-[#30363d] text-white flex items-center justify-center cursor-pointer"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <input
                type="number"
                min={1}
                max={64}
                value={amount}
                onChange={(e) => setAmount(Math.max(1, Math.min(64, parseInt(e.target.value) || 1)))}
                className="w-12 text-center bg-[#161b22] border border-[#30363d] rounded py-1 text-sm font-mono text-white font-bold"
              />
              <button
                onClick={() => setAmount((prev) => Math.min(64, prev + 1))}
                className="w-7 h-7 rounded bg-[#21262d] hover:bg-[#30363d] text-white flex items-center justify-center cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Quick presets */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-mono">Presets:</span>
            {[1, 16, 32, 64].map((cnt) => (
              <button
                key={cnt}
                onClick={() => setAmount(cnt)}
                className={`px-2 py-0.5 rounded text-xs font-mono cursor-pointer border ${
                  amount === cnt
                    ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800'
                    : 'bg-[#0d1117] text-slate-400 border-[#21262d] hover:border-[#30363d]'
                }`}
              >
                {cnt}
              </button>
            ))}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3.5 border-t border-[#21262d] bg-[#12161f] flex items-center justify-between">
          <div className="text-xs font-mono text-slate-400 truncate max-w-[200px]">
            give {player.username} minecraft:{customItemId.trim() || selectedItem.id} {amount}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleGive}
              className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Give Item
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

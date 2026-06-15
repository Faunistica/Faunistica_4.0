import { useState } from 'react';
import { Plus, Edit, Trash2, Award, Flag, X, Upload, CheckCircle, Lock } from 'lucide-react';
import type { Badge, Marathon } from '../Profile';

interface AdminPanelProps {
  badges: Badge[];
  marathons: Marathon[];
  setBadges: (badges: Badge[]) => void;
  setMarathons: (marathons: Marathon[]) => void;
}

export function AdminPanel({ badges, marathons, setBadges, setMarathons }: AdminPanelProps) {
  const [showBadgeModal, setShowBadgeModal] = useState(false);
  const [showMarathonModal, setShowMarathonModal] = useState(false);
  const [editingBadge, setEditingBadge] = useState<Badge | null>(null);
  const [editingMarathon, setEditingMarathon] = useState<Marathon | null>(null);
  
  const [badgeForm, setBadgeForm] = useState({ 
    name: '', 
    description: '', 
    icon: '🏅', 
    imageUrl: '',
    condition: '',
    conditionValue: 0
  });
  const [marathonForm, setMarathonForm] = useState({ name: '', rule: '', icon: '🏃', imageUrl: '', goal: 10 });

  // Переключение статуса значка
  const toggleBadgeStatus = (id: string) => {
    setBadges(badges.map(b => 
      b.id === id ? { ...b, earned: !b.earned } : b
    ));
  };

  // CRUD для значков
  const addBadge = () => {
    if (!badgeForm.name) {
      alert('Введите название значка');
      return;
    }
    const newBadge: Badge = {
      id: Date.now().toString(),
      name: badgeForm.name,
      description: badgeForm.description,
      icon: badgeForm.icon || '🏅',
      imageUrl: badgeForm.imageUrl,
      earned: false,
      condition: badgeForm.condition || null,
      conditionValue: badgeForm.condition ? (badgeForm.conditionValue || 0) : null,
    };
    setBadges([...badges, newBadge]);
    setBadgeForm({ name: '', description: '', icon: '🏅', imageUrl: '', condition: '', conditionValue: 0 });
    setShowBadgeModal(false);
  };

  const updateBadge = () => {
    if (!editingBadge || !badgeForm.name) return;
    setBadges(badges.map(b => b.id === editingBadge.id ? { 
      ...b, 
      name: badgeForm.name, 
      description: badgeForm.description,
      icon: badgeForm.icon, 
      imageUrl: badgeForm.imageUrl,
      condition: badgeForm.condition || null,
      conditionValue: badgeForm.condition ? (badgeForm.conditionValue || 0) : null,
    } : b));
    setEditingBadge(null);
    setBadgeForm({ name: '', description: '', icon: '🏅', imageUrl: '', condition: '', conditionValue: 0 });
    setShowBadgeModal(false);
  };

  const deleteBadge = (id: string) => {
    if (confirm('Удалить значок?')) {
      setBadges(badges.filter(b => b.id !== id));
    }
  };

  const openBadgeModal = (badge?: Badge) => {
    if (badge) {
      setEditingBadge(badge);
      setBadgeForm({ 
        name: badge.name, 
        description: badge.description || '', 
        icon: badge.icon, 
        imageUrl: badge.imageUrl || '',
        condition: badge.condition || '',
        conditionValue: badge.conditionValue || 0,
      });
    } else {
      setEditingBadge(null);
      setBadgeForm({ name: '', description: '', icon: '🏅', imageUrl: '', condition: '', conditionValue: 0 });
    }
    setShowBadgeModal(true);
  };

  // CRUD для марафонов
  const addMarathon = () => {
    if (!marathonForm.name || !marathonForm.rule) {
      alert('Введите название и правило марафона');
      return;
    }
    const newMarathon: Marathon = {
      id: Date.now().toString(),
      name: marathonForm.name,
      rule: marathonForm.rule,
      icon: marathonForm.icon || '🏃',
      imageUrl: marathonForm.imageUrl,
      current: 0,
      goal: marathonForm.goal,
    };
    setMarathons([...marathons, newMarathon]);
    setMarathonForm({ name: '', rule: '', icon: '🏃', imageUrl: '', goal: 10 });
    setShowMarathonModal(false);
  };

  const updateMarathon = () => {
    if (!editingMarathon || !marathonForm.name || !marathonForm.rule) return;
    setMarathons(marathons.map(m => m.id === editingMarathon.id ? { 
      ...m, 
      name: marathonForm.name, 
      rule: marathonForm.rule, 
      icon: marathonForm.icon,
      imageUrl: marathonForm.imageUrl, 
      goal: marathonForm.goal 
    } : m));
    setEditingMarathon(null);
    setMarathonForm({ name: '', rule: '', icon: '🏃', imageUrl: '', goal: 10 });
    setShowMarathonModal(false);
  };

  const deleteMarathon = (id: string) => {
    if (confirm('Удалить марафон?')) {
      setMarathons(marathons.filter(m => m.id !== id));
    }
  };

  const openMarathonModal = (marathon?: Marathon) => {
    if (marathon) {
      setEditingMarathon(marathon);
      setMarathonForm({ 
        name: marathon.name, 
        rule: marathon.rule, 
        icon: marathon.icon || '🏃',
        imageUrl: marathon.imageUrl || '', 
        goal: marathon.goal 
      });
    } else {
      setEditingMarathon(null);
      setMarathonForm({ name: '', rule: '', icon: '🏃', imageUrl: '', goal: 10 });
    }
    setShowMarathonModal(true);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'badge' | 'marathon') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (type === 'badge') {
          setBadgeForm({ ...badgeForm, imageUrl: reader.result as string });
        } else {
          setMarathonForm({ ...marathonForm, imageUrl: reader.result as string });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="bg-gradient-to-br from-[#1a2332] to-[#2a3442] rounded-xl shadow-md p-6 text-white">
      <h2 className="text-white text-xl font-semibold mb-6">Панель администратора</h2>

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        {/* Управление значками */}
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-[#2bb3d9]" />
              <h3 className="text-white font-medium">Управление значками</h3>
            </div>
            <button onClick={() => openBadgeModal()} className="flex items-center gap-2 px-4 py-2 bg-[#2bb3d9] hover:bg-[#2bb3d9]/90 text-white rounded-lg transition-colors">
              <Plus className="w-4 h-4" />
              <span>Добавить</span>
            </button>
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {badges.map((badge) => (
              <div key={badge.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                <div className="flex items-center gap-3">
                  {badge.imageUrl ? (
                    <img src={badge.imageUrl} alt={badge.name} className="w-8 h-8 rounded-full object-cover" />
                  ) : (
                    <span className="text-2xl">{badge.icon}</span>
                  )}
                  <div>
                    <div className="font-medium">{badge.name}</div>
                    {badge.description && <div className="text-xs text-gray-300">{badge.description}</div>}
                    {badge.condition && (
                      <div className="text-xs text-[#2bb3d9] mt-0.5">
                        Авто: {badge.condition} = {badge.conditionValue}
                      </div>
                    )}
                    <div className="text-xs mt-0.5">
                      {badge.earned ? (
                        <span className="text-green-400">✓ Получен</span>
                      ) : (
                        <span className="text-gray-400">○ Не получен</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button 
                    onClick={() => toggleBadgeStatus(badge.id)} 
                    className={`p-2 rounded transition-colors ${badge.earned ? 'text-green-400 hover:text-green-300' : 'text-gray-400 hover:text-white'}`}
                    title={badge.earned ? 'Отметить как не полученный' : 'Отметить как полученный'}
                  >
                    {badge.earned ? <CheckCircle className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                  </button>
                  <button onClick={() => openBadgeModal(badge)} className="p-2 hover:bg-white/10 rounded transition-colors">
                    <Edit className="w-4 h-4" />
                  </button>
                  <button onClick={() => deleteBadge(badge.id)} className="p-2 hover:bg-white/10 rounded transition-colors">
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </button>
                </div>
              </div>
            ))}
            {badges.length === 0 && (
              <div className="text-center text-gray-400 py-4">Нет значков. Нажмите «Добавить»</div>
            )}
          </div>
        </div>

        {/* Управление марафонами */}
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Flag className="w-5 h-5 text-[#4ade80]" />
              <h3 className="text-white font-medium">Управление марафонами</h3>
            </div>
            <button onClick={() => openMarathonModal()} className="flex items-center gap-2 px-4 py-2 bg-[#4ade80] hover:bg-[#4ade80]/90 text-white rounded-lg transition-colors">
              <Plus className="w-4 h-4" />
              <span>Создать</span>
            </button>
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {marathons.map((marathon) => (
              <div key={marathon.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                <div className="flex items-center gap-3">
                  {marathon.imageUrl ? (
                    <img src={marathon.imageUrl} alt={marathon.name} className="w-10 h-10 rounded-lg object-cover" />
                  ) : (
                    <span className="text-2xl">{marathon.icon || '🏃'}</span>
                  )}
                  <div>
                    <div className="font-medium">{marathon.name}</div>
                    <div className="text-xs text-gray-300">{marathon.rule}</div>
                    <div className="text-xs text-gray-400 mt-0.5">Прогресс: {marathon.current}/{marathon.goal}</div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => openMarathonModal(marathon)} className="p-2 hover:bg-white/10 rounded transition-colors">
                    <Edit className="w-4 h-4" />
                  </button>
                  <button onClick={() => deleteMarathon(marathon.id)} className="p-2 hover:bg-white/10 rounded transition-colors">
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </button>
                </div>
              </div>
            ))}
            {marathons.length === 0 && (
              <div className="text-center text-gray-400 py-4">Нет марафонов. Нажмите «Создать»</div>
            )}
          </div>
        </div>
      </div>

      {/* Модальное окно для значка */}
      {showBadgeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowBadgeModal(false)}>
          <div className="bg-[#1a2332] rounded-xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-white text-lg font-semibold">{editingBadge ? 'Редактировать значок' : 'Новый значок'}</h3>
              <button onClick={() => setShowBadgeModal(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-300 mb-1">Название значка *</label>
                <input 
                  type="text" 
                  value={badgeForm.name} 
                  onChange={(e) => setBadgeForm({ ...badgeForm, name: e.target.value })} 
                  className="w-full px-4 py-2 bg-white/10 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-[#2bb3d9]" 
                  placeholder="Например: Мастер определений" 
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Определение / Описание</label>
                <textarea 
                  value={badgeForm.description} 
                  onChange={(e) => setBadgeForm({ ...badgeForm, description: e.target.value })} 
                  className="w-full px-4 py-2 bg-white/10 border border-gray-600 rounded-lg text-white resize-none focus:outline-none focus:border-[#2bb3d9]" 
                  rows={3}
                  placeholder="За что даётся этот значок?" 
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Иконка (эмодзи)</label>
                <input 
                  type="text" 
                  value={badgeForm.icon} 
                  onChange={(e) => setBadgeForm({ ...badgeForm, icon: e.target.value })} 
                  className="w-full px-4 py-2 bg-white/10 border border-gray-600 rounded-lg text-white" 
                  placeholder="🏅" 
                  maxLength={2} 
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Изображение (опционально)</label>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 px-4 py-2 bg-white/10 border border-gray-600 rounded-lg cursor-pointer hover:bg-white/20">
                    <Upload className="w-4 h-4" />
                    <span className="text-sm">Загрузить</span>
                    <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'badge')} className="hidden" />
                  </label>
                  {badgeForm.imageUrl && <img src={badgeForm.imageUrl} alt="preview" className="w-10 h-10 rounded-full object-cover" />}
                </div>
              </div>
              
              {/* Условие получения */}
              <div>
                <label className="block text-sm text-gray-300 mb-1">Условие получения</label>
                <select 
                  value={badgeForm.condition}
                  onChange={(e) => setBadgeForm({ ...badgeForm, condition: e.target.value, conditionValue: 0 })}
                  className="w-full px-4 py-2 bg-white/10 border border-gray-600 rounded-lg text-white"
                >
                  <option value="">Ручное (админ назначает)</option>
                  <option value="activity_days">Активность (дней)</option>
                  <option value="rating_top">Топ рейтинга (место)</option>
                  <option value="findings_count">Количество находок</option>
                  <option value="species_count">Количество видов</option>
                </select>
              </div>
              
              {badgeForm.condition && (
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Значение для получения</label>
                  <input 
                    type="number" 
                    value={badgeForm.conditionValue} 
                    onChange={(e) => setBadgeForm({ ...badgeForm, conditionValue: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2 bg-white/10 border border-gray-600 rounded-lg text-white"
                    placeholder="Например: 30"
                  />
                </div>
              )}
              
              <button onClick={editingBadge ? updateBadge : addBadge} className="w-full py-2 bg-[#2bb3d9] hover:bg-[#2bb3d9]/90 rounded-lg transition-colors mt-4">
                {editingBadge ? 'Сохранить' : 'Создать'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно для марафона */}
      {showMarathonModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowMarathonModal(false)}>
          <div className="bg-[#1a2332] rounded-xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-white text-lg font-semibold">{editingMarathon ? 'Редактировать марафон' : 'Новый марафон'}</h3>
              <button onClick={() => setShowMarathonModal(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-300 mb-1">Название марафона *</label>
                <input 
                  type="text" 
                  value={marathonForm.name} 
                  onChange={(e) => setMarathonForm({ ...marathonForm, name: e.target.value })} 
                  className="w-full px-4 py-2 bg-white/10 border border-gray-600 rounded-lg text-white" 
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Логотип марафона (эмодзи)</label>
                <input 
                  type="text" 
                  value={marathonForm.icon} 
                  onChange={(e) => setMarathonForm({ ...marathonForm, icon: e.target.value })} 
                  className="w-full px-4 py-2 bg-white/10 border border-gray-600 rounded-lg text-white" 
                  placeholder="🏃" 
                  maxLength={2} 
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Правило / Условие *</label>
                <textarea 
                  value={marathonForm.rule} 
                  onChange={(e) => setMarathonForm({ ...marathonForm, rule: e.target.value })} 
                  className="w-full px-4 py-2 bg-white/10 border border-gray-600 rounded-lg text-white resize-none" 
                  rows={3} 
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Цель (количество находок)</label>
                <input 
                  type="number" 
                  value={marathonForm.goal} 
                  onChange={(e) => setMarathonForm({ ...marathonForm, goal: parseInt(e.target.value) || 0 })} 
                  className="w-full px-4 py-2 bg-white/10 border border-gray-600 rounded-lg text-white" 
                  min="1" 
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Фото / картинка (опционально)</label>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 px-4 py-2 bg-white/10 border border-gray-600 rounded-lg cursor-pointer hover:bg-white/20">
                    <Upload className="w-4 h-4" />
                    <span className="text-sm">Загрузить</span>
                    <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'marathon')} className="hidden" />
                  </label>
                  {marathonForm.imageUrl && <img src={marathonForm.imageUrl} alt="preview" className="w-12 h-12 rounded-lg object-cover" />}
                </div>
              </div>
              <button onClick={editingMarathon ? updateMarathon : addMarathon} className="w-full py-2 bg-[#4ade80] hover:bg-[#4ade80]/90 rounded-lg transition-colors mt-4">
                {editingMarathon ? 'Сохранить' : 'Создать'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
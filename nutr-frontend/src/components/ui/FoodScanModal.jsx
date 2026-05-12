import { useState } from 'react';
import { Search, X, Plus, CheckCircle2 } from 'lucide-react';
import { nutritionService } from '../../services/nutrition.service';

const PRIMARY = '#2E7D32';

export default function FoodScanModal({ isOpen, onClose, onAddFood }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [selected, setSelected] = useState({});
  const [quantities, setQuantities] = useState({});
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState('');

  const reset = () => {
    setQuery('');
    setResults([]);
    setSelected({});
    setQuantities({});
    setSearched(false);
    setError('');
  };

  const handleClose = () => { reset(); onClose(); };

  const doSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setError('');
    try {
      const res = await nutritionService.searchFoods(query.trim());
      const foods = res.data?.data?.foods ?? res.data?.foods ?? [];
      setResults(foods);
      const initQ = {};
      foods.forEach((f) => { initQ[f.id] = '100'; });
      setQuantities(initQ);
      setSelected({});
      setSearched(true);
    } catch (err) {
      setError(err.message || 'Search failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleSelect = (id) => {
    setSelected((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleAddSelected = () => {
    results.filter((f) => selected[f.id]).forEach((food) => {
      onAddFood({ food_item: food.id, quantity_grams: parseFloat(quantities[food.id]) || 100, food });
    });
    handleClose();
  };

  const anySelected = Object.values(selected).some(Boolean);

  if (!isOpen) return null;

  return (
    <div style={s.overlay} onClick={(e) => e.target === e.currentTarget && handleClose()}>
      <div style={s.modal}>
        {/* Header */}
        <div style={s.header}>
          <div>
            <h2 style={s.title}>Find Food</h2>
            <p style={s.subtitle}>Search and add food items to your meal</p>
          </div>
          <button onClick={handleClose} style={s.closeBtn}><X size={18} /></button>
        </div>

        {/* Search form */}
        <div style={s.searchWrap}>
          <form onSubmit={doSearch} style={s.searchRow}>
            <div style={s.searchInputWrap}>
              <Search size={15} color="#9ca3af" style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)' }} />
              <input
                autoFocus
                style={s.searchInput}
                placeholder="e.g. chicken, rice, banana…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <button type="submit" style={s.searchBtn} disabled={loading || !query.trim()}>
              {loading ? '…' : 'Search'}
            </button>
          </form>
        </div>

        {error && <div style={s.error}>⚠ {error}</div>}

        {/* Results */}
        <div style={s.body}>
          {!searched ? (
            <div style={s.hint}>
              <Search size={32} color="#d1d5db" style={{ marginBottom: 8 }} />
              <p style={{ margin: 0, color: '#9ca3af', fontSize: 13 }}>Type a food name above to search</p>
            </div>
          ) : results.length === 0 ? (
            <div style={s.hint}>
              <p style={{ margin: 0, color: '#9ca3af', fontSize: 13 }}>No foods found for "{query}". Try a different term.</p>
            </div>
          ) : (
            <>
              <p style={s.resultCount}>{results.length} result{results.length !== 1 ? 's' : ''} for "{query}"</p>
              <div style={s.resultList}>
                {results.map((food) => (
                  <div
                    key={food.id}
                    style={{ ...s.resultItem, ...(selected[food.id] ? s.resultItemSelected : {}) }}
                  >
                    <button
                      onClick={() => toggleSelect(food.id)}
                      style={{ ...s.checkBox, ...(selected[food.id] ? s.checkBoxSelected : {}) }}
                    >
                      {selected[food.id] && <CheckCircle2 size={15} color="#fff" />}
                    </button>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={s.foodName}>{food.name}</p>
                      <p style={s.foodMeta}>
                        {Math.round(food.calories_per_100g)} kcal · {food.protein_per_100g}g P ·{' '}
                        {food.carbohydrates_per_100g}g C · {food.fat_per_100g}g F
                      </p>
                    </div>
                    <div style={s.qtyWrap}>
                      <input
                        type="number" min="1" step="1"
                        value={quantities[food.id] ?? '100'}
                        onChange={(e) => setQuantities((prev) => ({ ...prev, [food.id]: e.target.value }))}
                        style={s.qtyInput}
                        title="Quantity in grams"
                      />
                      <span style={s.qtyUnit}>g</span>
                    </div>
                  </div>
                ))}
              </div>

              <div style={s.actions}>
                <button onClick={reset} style={s.clearBtn}>Clear</button>
                <button
                  onClick={handleAddSelected}
                  disabled={!anySelected}
                  style={{ ...s.addBtn, opacity: anySelected ? 1 : 0.45, cursor: anySelected ? 'pointer' : 'not-allowed' }}
                >
                  <Plus size={15} />
                  Add {Object.values(selected).filter(Boolean).length || ''} Selected
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

const s = {
  overlay: {
    position: 'fixed', inset: 0, zIndex: 1000,
    background: 'rgba(0,0,0,.5)', backdropFilter: 'blur(4px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
  },
  modal: {
    width: '100%', maxWidth: 520, background: '#fff', borderRadius: 20,
    overflow: 'hidden', boxShadow: '0 25px 60px rgba(0,0,0,.2)',
    fontFamily: "'DM Sans', sans-serif", display: 'flex', flexDirection: 'column',
    maxHeight: '85vh',
  },
  header: {
    display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
    padding: '18px 20px', borderBottom: '1px solid #f0f4f0', flexShrink: 0,
  },
  title: { margin: '0 0 2px', fontSize: 16, fontWeight: 700, color: '#111' },
  subtitle: { margin: 0, fontSize: 12, color: '#888' },
  closeBtn: {
    background: '#f5f5f5', border: 'none', borderRadius: 8, width: 32, height: 32,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', color: '#555', flexShrink: 0,
  },
  searchWrap: { padding: '14px 20px', borderBottom: '1px solid #f0f4f0', flexShrink: 0 },
  searchRow: { display: 'flex', gap: 8 },
  searchInputWrap: { position: 'relative', flex: 1 },
  searchInput: {
    width: '100%', padding: '9px 12px 9px 34px', fontSize: 14,
    border: '1.5px solid #d1d5db', borderRadius: 10, color: '#111',
    fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none',
  },
  searchBtn: {
    padding: '9px 18px', background: PRIMARY, color: '#fff',
    border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 600,
    cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0,
  },
  error: {
    margin: '8px 20px 0', padding: '10px 14px', background: '#fef2f2',
    border: '1px solid #fecaca', borderRadius: 8, fontSize: 13, color: '#991b1b',
    flexShrink: 0,
  },
  body: { padding: '14px 20px 20px', overflowY: 'auto', flex: 1 },
  hint: { textAlign: 'center', padding: '32px 0', display: 'flex', flexDirection: 'column', alignItems: 'center' },
  resultCount: { margin: '0 0 10px', fontSize: 12, color: '#9ca3af' },
  resultList: { display: 'flex', flexDirection: 'column', gap: 8 },
  resultItem: {
    display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px',
    border: '1.5px solid #e5e7eb', borderRadius: 12, transition: 'all .15s',
  },
  resultItemSelected: { borderColor: PRIMARY, background: '#f0faf0' },
  checkBox: {
    width: 24, height: 24, borderRadius: 6, border: '2px solid #d1d5db',
    background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0, cursor: 'pointer',
  },
  checkBoxSelected: { background: PRIMARY, borderColor: PRIMARY },
  foodName: { margin: '0 0 2px', fontSize: 13, fontWeight: 500, color: '#111' },
  foodMeta: { margin: 0, fontSize: 11, color: '#9ca3af' },
  qtyWrap: { display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 },
  qtyInput: {
    width: 62, padding: '5px 8px', border: '1.5px solid #d1d5db',
    borderRadius: 8, fontSize: 13, textAlign: 'right', fontFamily: 'inherit', color: '#111',
  },
  qtyUnit: { fontSize: 12, color: '#888' },
  actions: { display: 'flex', gap: 10, marginTop: 16 },
  clearBtn: {
    padding: '10px 16px', background: '#f3f4f6', border: '1px solid #e5e7eb',
    borderRadius: 10, fontSize: 13, cursor: 'pointer', color: '#374151', fontFamily: 'inherit',
  },
  addBtn: {
    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
    padding: '10px 16px', background: PRIMARY, color: '#fff',
    border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, fontFamily: 'inherit',
  },
};

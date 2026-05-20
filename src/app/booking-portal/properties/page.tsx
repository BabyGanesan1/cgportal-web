'use client';
import React, { useEffect, useState, useCallback, useMemo, useRef, Suspense } from 'react';
import { io } from 'socket.io-client';
import { Search, MapPin, RefreshCw, ChevronRight, Building2, Home, ChevronLeft, ChevronRight as ChevronRightIcon, Filter, X, Video, CalendarCheck, BookOpen } from 'lucide-react';
import { useSearchParams, useRouter } from 'next/navigation';
import api from '../../../lib/api';
import AppLayout from '../../../components/layout/AppLayout';
import BookingUnitsModal from '../../../components/portal/BookingUnitsModal';
import CostSheetModal from '../../../components/portal/CostSheetModal';
import BookNowModal from '../../../components/portal/BookNowModal';
import VirtualTourModal from '../../../components/portal/VirtualTourModal';
import SiteVisitModal from '../../../components/portal/SiteVisitModal';

// ── Searchable single-select ──────────────────────────────────────────────────
function SearchableDropdown({ options, value, onChange, placeholder, disabled }: {
  options: { label: string; value: string }[];
  value: string; onChange: (v: string) => void;
  placeholder: string; disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  const filtered = options.filter(o => o.label.toLowerCase().includes(search.toLowerCase()));
  const selected = options.find(o => o.value === value);
  return (
    <div ref={ref} className="relative">
      <button type="button" disabled={disabled} onClick={() => !disabled && setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-semibold text-left"
        style={{ background: disabled ? '#f1f5f9' : '#f8fafc', border: '1.5px solid ' + (value ? '#f59e0b' : '#e2e8f0'), color: value ? '#1e293b' : '#59616c', cursor: disabled ? 'not-allowed' : 'pointer' }}>
        <span className="truncate">{selected?.label || placeholder}</span>
        <ChevronRight className="w-4 h-4 flex-shrink-0" style={{ transform: open ? 'rotate(90deg)' : '', color: '#59616c' }} />
      </button>
      {open && (
        <div className="absolute top-full left-0 right-0 mt-2 rounded-2xl shadow-2xl z-50 overflow-hidden" style={{ background: '#fff', border: '1.5px solid #e2e8f0' }}>
          <div className="p-2 border-b" style={{ borderColor: '#f1f5f9' }}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#59616c' }} />
              <input autoFocus type="text" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm rounded-xl outline-none" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }} />
            </div>
          </div>
          <div className="max-h-48 overflow-y-auto">
            {value && (
              <button onClick={() => { onChange(''); setOpen(false); setSearch(''); }}
                className="w-full text-left px-4 py-3 text-sm font-medium flex items-center gap-2" style={{ color: '#ef4444' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#fef2f2')}
                onMouseLeave={e => (e.currentTarget.style.background = '')}>
                <X className="w-4 h-4" /> Reset
              </button>
            )}
            {filtered.map(o => (
              <button key={o.value} onClick={() => { onChange(o.value); setOpen(false); setSearch(''); }}
                className="w-full text-left px-4 py-3 text-sm font-medium transition-colors"
                style={{ color: o.value === value ? '#f59e0b' : '#334155', background: o.value === value ? '#fffbeb' : 'transparent' }}
                onMouseEnter={e => { if (o.value !== value) (e.currentTarget.style.background = '#f8fafc'); }}
                onMouseLeave={e => { if (o.value !== value) (e.currentTarget.style.background = 'transparent'); }}>
                {o.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Multi-select Dropdown ─────────────────────────────────────────────────────
function MultiSelectDropdown({ options, value, onChange, placeholder, disabled }: {
  options: { label: string; value: string }[];
  value: string[]; onChange: (v: string[]) => void; placeholder: string; disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  const filtered = options.filter(o => o.label.toLowerCase().includes(search.toLowerCase()));
  const toggle = (v: string) => onChange(value.includes(v) ? value.filter(x => x !== v) : [...value, v]);
  return (
    <div ref={ref} className="relative">
      <button type="button" disabled={disabled} onClick={() => !disabled && setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-semibold text-left"
        style={{ background: disabled ? '#f1f5f9' : '#f8fafc', border: '1.5px solid ' + (value.length ? '#f59e0b' : '#e2e8f0'), color: value.length ? '#1e293b' : '#59616c', cursor: disabled ? 'not-allowed' : 'pointer' }}>
        <span className="truncate">{value.length ? `${placeholder} (${value.length})` : placeholder}</span>
        <ChevronRight className="w-4 h-4" style={{ transform: open ? 'rotate(90deg)' : '', color: '#59616c' }} />
      </button>
      {open && (
        <div className="absolute top-full left-0 right-0 mt-2 rounded-2xl shadow-2xl z-50 overflow-hidden" style={{ background: '#fff', border: '1.5px solid #e2e8f0' }}>
          <div className="p-2 border-b" style={{ borderColor: '#f1f5f9' }}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#59616c' }} />
              <input autoFocus type="text" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm rounded-xl outline-none" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }} />
            </div>
          </div>
          <div className="max-h-48 overflow-y-auto">
            {value.length > 0 && (
              <button onClick={() => onChange([])} className="w-full text-left px-4 py-3 text-sm font-medium flex items-center gap-2" style={{ color: '#ef4444' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#fef2f2')} onMouseLeave={e => (e.currentTarget.style.background = '')}>
                <X className="w-4 h-4" /> Reset
              </button>
            )}
            {filtered.map(o => (
              <button key={o.value} onClick={() => toggle(o.value)}
                className="w-full text-left px-4 py-3 text-sm font-medium flex items-center gap-3"
                style={{ background: value.includes(o.value) ? '#fffbeb' : 'transparent', color: '#334155' }}
                onMouseEnter={e => { if (!value.includes(o.value)) (e.currentTarget.style.background = '#f8fafc'); }}
                onMouseLeave={e => { if (!value.includes(o.value)) (e.currentTarget.style.background = 'transparent'); }}>
                <span className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0 text-[10px]"
                  style={{ border: '2px solid ' + (value.includes(o.value) ? '#f59e0b' : '#cbd5e1'), background: value.includes(o.value) ? '#f59e0b' : 'transparent', color: '#0a1628' }}>
                  {value.includes(o.value) && '✓'}
                </span>
                {o.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Skeletons ─────────────────────────────────────────────────────────────────
const SkeletonPill = () => (
  <div className="h-8 w-16 bg-slate-100 rounded-xl animate-pulse" />
);

const SkeletonCard = ({ className = "w-24 h-24" }: { className?: string }) => (
  <div className={`rounded-2xl bg-slate-100 animate-pulse ${className}`} />
);

const SkeletonTab = () => (
  <div className="flex-1 px-4 py-3 border-r border-slate-100 last:border-0">
    <div className="h-4 w-16 bg-slate-100 rounded animate-pulse mb-2" />
    <div className="h-3 w-24 bg-slate-50 rounded animate-pulse mb-1" />
    <div className="h-3 w-20 bg-slate-50 rounded animate-pulse" />
  </div>
);

function PropertyPortal() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtersLoading, setFiltersLoading] = useState(true);

  const [cities, setCities] = useState<{ label: string; value: string }[]>([]);
  const [locations, setLocations] = useState<{ label: string; value: string }[]>([]);
  const [bhkTypes, setBhkTypes] = useState<{ label: string; value: string }[]>([]);
  const [possessions, setPossessions] = useState<{ label: string; value: string }[]>([]);
  const [productTypes, setProductTypes] = useState<{ label: string; value: string }[]>([]);
  const [cityCounts, setCityCounts] = useState<Record<string, { total: number; available: number }>>({});
  const [cityCountsReady, setCityCountsReady] = useState(false);
  const [globalStats, setGlobalStats] = useState<{ totalProjects: number; withUnits: number; totalCities: number } | null>(null);

  const [filterCityId, setFilterCityId] = useState<string | null>(null);
  const [filterLocationIds, setFilterLocationIds] = useState<string[]>([]);
  const [filterBhks, setFilterBhks] = useState<string[]>([]);
  const [filterPossessions, setFilterPossessions] = useState<string[]>([]);
  const [filterProductTypes, setFilterProductTypes] = useState<string[]>([]);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(true);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [appliedFilters, setAppliedFilters] = useState({
    filterCityId: null as string | null,
    filterLocationIds: [] as string[],
    filterBhks: [] as string[],
    filterPossessions: [] as string[],
    filterProductTypes: [] as string[],
    minPrice: '',
    maxPrice: ''
  });

  const [activeStatFilter, setActiveStatFilter] = useState<string | null>(null);
  const [isUnitsModalOpen, setIsUnitsModalOpen] = useState(false);
  const [isCostSheetModalOpen, setIsCostSheetModalOpen] = useState(false);
  const [isBookNowModalOpen, setIsBookNowModalOpen] = useState(false);
  const [isVirtualTourModalOpen, setIsVirtualTourModalOpen] = useState(false);
  const [isSiteVisitModalOpen, setIsSiteVisitModalOpen] = useState(false);

  const mobileCityScrollRef = useRef<HTMLDivElement>(null);
  const desktopCityScrollRef = useRef<HTMLDivElement>(null);
  const possessionScrollRef = useRef<HTMLDivElement>(null);
  const [cityScrollAtStart, setCityScrollAtStart] = useState(true);
  const [cityScrollAtEnd, setCityScrollAtEnd] = useState(false);
  const [possScrollAtStart, setPossScrollAtStart] = useState(true);
  const [possScrollAtEnd, setPossScrollAtEnd] = useState(false);
  
  const [selectedProperty, setSelectedProperty] = useState<any>(null);
  const [selectedUnit, setSelectedUnit] = useState<any>(null);
  const [propertyUnits, setPropertyUnits] = useState<any[]>([]);
  const [propertyAllUnits, setPropertyAllUnits] = useState<any[]>([]);
  const [modalInitialView, setModalInitialView] = useState<'list' | 'grid'>('list');
  const [unitViewers, setUnitViewers] = useState<Record<number, number>>({});
  const [costSheetViewers, setCostSheetViewers] = useState<Record<number, number>>({});
  const socketRef = useRef<any>(null);

  // ── WebSocket Real-time Updates ─────────────────────────────────────────────
  useEffect(() => {
    // Connect to backend socket
    const socket = io('http://localhost:5000');
    socketRef.current = socket;

    socket.on('unit_status_updated', (data: { unit_id: number; status: string; project_id: number }) => {
      console.log('Real-time unit update:', data);
      const unitId = Number(data.unit_id);

      // 1. Update project available counts in the main list
      setProperties(prev => prev.map(p => {
        if (p.id === data.project_id && data.status.toLowerCase() === 'booked') {
          const currentCount = parseInt(p.available_units || 0);
          return { ...p, available_units: Math.max(0, currentCount - 1) };
        }
        return p;
      }));

      // 2. If the modal for this project is open, update the unit status immediately
      setPropertyAllUnits(prev => prev.map(u => 
        u.id === unitId ? { ...u, status: data.status } : u
      ));
      
      // Update the available-only list for the list view
      setPropertyUnits(prev => prev.filter(u => u.id !== unitId));

      // 3. Update selectedUnit if it matches the updated unit
      setSelectedUnit((prev: any) => (prev && prev.id === unitId) ? { ...prev, status: data.status } : prev);

      // 4. Update global stats if needed
      if (data.status.toLowerCase() === 'booked') {
        setGlobalStats(prev => prev ? { ...prev, withUnits: Math.max(0, prev.withUnits - 1) } : null);
      }
    });

    socket.on('unit_viewers_updated', (data: { unitId: any; count: number }) => {
      const id = Number(data.unitId);
      setUnitViewers(prev => ({ ...prev, [id]: data.count }));
    });

    socket.on('cost_sheet_viewers_updated', (data: { unitId: any; count: number }) => {
      const id = Number(data.unitId);
      setCostSheetViewers(prev => ({ ...prev, [id]: data.count }));
    });

    socket.on('initial_counts_data', (data: { unitCounts: Record<string, number>; costCounts: Record<string, number> }) => {
      const uMap: Record<number, number> = {};
      Object.entries(data.unitCounts || {}).forEach(([k, v]) => uMap[Number(k)] = v);
      const cMap: Record<number, number> = {};
      Object.entries(data.costCounts || {}).forEach(([k, v]) => cMap[Number(k)] = v);
      
      setUnitViewers(prev => ({ ...prev, ...uMap }));
      setCostSheetViewers(prev => ({ ...prev, ...cMap }));
    });

    return () => {
      socket.disconnect();
    };
  }, []); // Only run once on mount

  // Sync project room joining
  useEffect(() => {
    if (isUnitsModalOpen && selectedProperty && socketRef.current) {
      socketRef.current.emit('join_project', selectedProperty.id);
      
      // Also request initial counts for all units in this project
      if (propertyAllUnits && propertyAllUnits.length > 0) {
        socketRef.current.emit('get_initial_counts', propertyAllUnits.map(u => u.id));
      }
    }
  }, [isUnitsModalOpen, selectedProperty?.id, propertyAllUnits.length]);

  // Sync cost sheet viewing
  useEffect(() => {
    if (socketRef.current && selectedProperty?.id) {
      socketRef.current.emit('view_cost_sheet', { 
        projectId: selectedProperty.id, 
        unitId: isCostSheetModalOpen ? selectedUnit?.id : null 
      });
    }
    return () => {
      if (socketRef.current && selectedProperty?.id) {
        socketRef.current.emit('view_cost_sheet', { projectId: selectedProperty.id, unitId: null });
      }
    };
  }, [isCostSheetModalOpen, selectedUnit?.id, selectedProperty?.id]);

  const POSSESSION_ORDER = useMemo(() => [
    'Less than 6 Months',
    '6 to 12 Months',
    '12 to 24 Months',
    '24 to 36 Months',
    'More than 36 Months'
  ], []);

  const POSSESSION_GROUP_MAP = useMemo<Record<string, string[]>>(() => ({
    'Ready to Move': ['Ready to Move'],
    'Less than 6 Months': ['Less than 6 Months', '0 to 6 Months'],
    '6 to 12 Months': ['6 to 12 Months'],
    '12 to 24 Months': ['12 to 18 Months', '18 to 24 Months', '12 to 24 Months'],
    '24 to 36 Months': ['24 to 30 Months', '30 to 36 Months', '24 to 36 Months'],
    'More than 36 Months': ['30+ Months', '36 to 40 Months', 'More than 36 Months', 'Above 36 Months'],
  }), []);

  const sortByPossession = useCallback((rows: any[]) => {
    return [...rows].sort((a: any, b: any) => {
      const idxA = POSSESSION_ORDER.indexOf(a.possession_status);
      const idxB = POSSESSION_ORDER.indexOf(b.possession_status);
      if (idxA === -1 && idxB === -1) return a.project_name.localeCompare(b.project_name);
      if (idxA === -1) return 1;
      if (idxB === -1) return -1;
      return idxA - idxB;
    });
  }, [POSSESSION_ORDER]);

  useEffect(() => {
    Promise.all([
      api.get('/portal/distinct-filters'),
      api.get('/properties', { params: { limit: 2000 } }),
    ])
      .then(([filterRes, propsRes]) => {
        const { cities, bhks, possessions, productTypes: ptRaw } = filterRes.data.data;
        const CITY_ORDER = ['chennai', 'bangalore', 'bengaluru', 'hyderabad', 'coimbatore', 'dubai', 'pune'];
        const cityList = (cities || []).map((c: string) => ({ label: c, value: c }))
          .sort((a: any, b: any) => {
            const idxA = CITY_ORDER.indexOf(a.value.toLowerCase());
            const idxB = CITY_ORDER.indexOf(b.value.toLowerCase());
            if (idxA === -1 && idxB === -1) return a.label.localeCompare(b.label);
            if (idxA === -1) return 1;
            if (idxB === -1) return -1;
            return idxA - idxB;
          });
        setCities(cityList);
        setBhkTypes((bhks || []).map((b: string) => ({ label: b, value: b })));
        const possessionList = (possessions || []).map((p: string) => ({ label: p, value: p }))
          .sort((a: any, b: any) => {
            const idxA = POSSESSION_ORDER.indexOf(a.value);
            const idxB = POSSESSION_ORDER.indexOf(b.value);
            if (idxA === -1 && idxB === -1) return a.label.localeCompare(b.label);
            if (idxA === -1) return 1;
            if (idxB === -1) return -1;
            return idxA - idxB;
          });
        setPossessions(possessionList);
        setProductTypes((ptRaw || []).map((p: string) => ({ label: p, value: p })));

        const allRows: any[] = propsRes.data.data || [];
        const cityLabelByLower: Record<string, string> = {};
        cityList.forEach((c: any) => {
          cityLabelByLower[c.value.toLowerCase()] = c.value;
        });
        const map: Record<string, { total: number; available: number }> = {};
        allRows.forEach(p => {
          const rawCity = p.cityData?.name || p.city || '';
          if (!rawCity) return;
          const city = cityLabelByLower[rawCity.toLowerCase()] || rawCity;
          if (!map[city]) map[city] = { total: 0, available: 0 };
          map[city].total += 1;
          map[city].available += parseInt(p.available_units || 0);
        });
        cityList.forEach((c: any) => {
          if (!map[c.value]) map[c.value] = { total: 0, available: 0 };
        });
        setCityCounts(map);
        setCityCountsReady(true);

        const uniqueCities = new Set(allRows.map((p: any) => {
          const rawCity = p.cityData?.name || p.city || '';
          return rawCity ? (cityLabelByLower[rawCity.toLowerCase()] || rawCity) : '';
        }).filter(Boolean)).size;
        setGlobalStats({
          totalProjects: allRows.length,
          withUnits: allRows.reduce((sum: number, p: any) => sum + parseInt(p.available_units || 0), 0),
          totalCities: uniqueCities,
        });

        const initialProps = allRows.filter((p: any) => parseInt(p.available_units || 0) > 0);
        const sorted = sortByPossession(initialProps);
        setProperties(sorted);
        setFiltersLoading(false);

        // Handle URL-based initial state (Query params instead of separate pages)
        const action = searchParams.get('action');
        const id = searchParams.get('id');
        if (action && id) {
          const prop = sorted.find(p => p.id.toString() === id.toString());
          if (prop) {
            setSelectedProperty(prop);
            if (action === 'booking') setIsUnitsModalOpen(true);
            if (action === 'virtual-tour') setIsVirtualTourModalOpen(true);
            if (action === 'site-visit') setIsSiteVisitModalOpen(true);
          }
        }
      })
      .catch(() => { setFiltersLoading(false); });
  }, [sortByPossession, searchParams]);

  useEffect(() => {
    setFilterLocationIds([]);
    setMinPrice('');
    setMaxPrice('');
    if (!filterCityId) { setLocations([]); return; }
    api.get(`/portal/distinct-filters?city=${filterCityId}`)
      .then(r => setLocations((r.data.data.locations || []).map((l: string) => ({ label: l, value: l }))))
      .catch(() => setLocations([]));
  }, [filterCityId]);

  const [searchTrigger, setSearchTrigger] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const params: any = { limit: 2000 };
    if (filterCityId) params.city = filterCityId;
    if (filterLocationIds.length) params.location = filterLocationIds.join(',');
    if (filterBhks.length) params.bhk = filterBhks;
    if (filterPossessions.length) {
      const expandedPossessions = Array.from(
        new Set(filterPossessions.flatMap(p => POSSESSION_GROUP_MAP[p] ?? [p]))
      );
      params.possession = expandedPossessions;
    }
    if (filterProductTypes.length) params.product_type = filterProductTypes;
    if (minPrice) params.min_price = minPrice;
    if (maxPrice) params.max_price = maxPrice;

    setAppliedFilters({
      filterCityId,
      filterLocationIds,
      filterBhks,
      filterPossessions,
      filterProductTypes,
      minPrice,
      maxPrice
    });

    api.get('/properties', { params })
      .then(r => {
        if (cancelled) return;
        const rows: any[] = (r.data.data || []).filter((p: any) => parseInt(p.available_units || 0) > 0);
        if (!cancelled) setProperties(sortByPossession(rows));
      })
      .catch(() => { if (!cancelled) console.error('Failed to load properties'); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [filterCityId, searchTrigger, sortByPossession]);

  const handleResetFilters = () => {
    setFilterCityId(null);
    setFilterLocationIds([]);
    setFilterBhks([]);
    setFilterPossessions([]);
    setFilterProductTypes([]);
    setSearchTrigger(prev => prev + 1);
    setMinPrice('');
    setMaxPrice('');
    setCurrentPage(1);
    setActiveStatFilter(null);
    setShowAdvancedFilters(true);
  };

  const totalProjects = globalStats?.totalProjects ?? null;
  const withUnitsCount = globalStats?.withUnits ?? null;
  const totalCities = globalStats?.totalCities ?? null;
  const grandTotal = useMemo(() => Object.values(cityCounts).reduce((acc, c) => acc + c.total, 0), [cityCounts]);
  const grandAvailable = useMemo(() => Object.values(cityCounts).reduce((acc, c) => acc + c.available, 0), [cityCounts]);

  const activeFiltersCount = [
    appliedFilters.filterLocationIds,
    appliedFilters.filterBhks,
    appliedFilters.filterPossessions,
    appliedFilters.filterProductTypes,
    appliedFilters.minPrice,
    appliedFilters.maxPrice
  ].flat().filter(Boolean).length;

  const hasFilter = appliedFilters.filterCityId !== null || activeFiltersCount > 0 || activeStatFilter !== null;

  const filteredProperties = useMemo(() => {
    if (!hasFilter) return [];
    if (activeStatFilter === 'available') return properties.filter(p => (p.available_units || 0) > 0);
    return properties;
  }, [properties, activeStatFilter, hasFilter]);

  const totalPages = Math.ceil(filteredProperties.length / itemsPerPage);
  const currentProperties = filteredProperties.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handlePropertyClick = async (prop: any, defaultView: 'list' | 'grid' = 'list') => {
    setSelectedProperty(prop);
    setModalInitialView(defaultView);
    try {
      // Fetch ALL units to support the Grid View (floor plan)
      const res = await api.get(`/properties/${prop.id}/details`, { params: { limit: 2000 } });
      const all = res.data.data || [];
      setPropertyAllUnits(all);
      
      // Filter available-only for the List View
      const available = all.filter((u: any) => {
        const status = (u.status || '').toLowerCase();
        return [
          'vacant', 'hsbc-vacant', 'vacant (rent or lease)', 
          'open for sale with 10%', 'hsbc-open for sale with 10%', 
          'investor', 'hsbc-investor', 'investor-open for sale with 10%', 
          'hsbc-vacant-lo'
        ].includes(status);
      });
      setPropertyUnits(available);
      
      setSelectedProperty({ ...prop, available_units: available.length });
      setIsUnitsModalOpen(true);
    } catch { console.error('Failed to fetch units'); }
  };

  const handleBookNowClick = (prop: any) => {
    setSelectedProperty(prop);
    router.push(`/booking-portal/properties?action=booking&id=${prop.id}`);
    handlePropertyClick(prop, 'grid');
  };

  const handleVirtualTourClick = (prop: any) => {
    setSelectedProperty(prop);
    router.push(`/booking-portal/properties?action=virtual-tour&id=${prop.id}`);
    setIsVirtualTourModalOpen(true);
  };

  const handleSiteVisitClick = (prop: any) => {
    setSelectedProperty(prop);
    router.push(`/booking-portal/properties?action=site-visit&id=${prop.id}`);
    setIsSiteVisitModalOpen(true);
  };

  useEffect(() => {
    const el = mobileCityScrollRef.current;
    if (!el) return;
    const check = () => {
      setCityScrollAtStart(el.scrollLeft <= 0);
      setCityScrollAtEnd(Math.ceil(el.scrollLeft + el.clientWidth) >= el.scrollWidth);
    };
    requestAnimationFrame(check);
    el.addEventListener('scroll', check, { passive: true });
    return () => el.removeEventListener('scroll', check);
  }, [cities]);

  useEffect(() => {
    const el = possessionScrollRef.current;
    if (!el) return;
    const check = () => {
      setPossScrollAtStart(el.scrollLeft <= 0);
      setPossScrollAtEnd(Math.ceil(el.scrollLeft + el.clientWidth) >= el.scrollWidth);
    };
    requestAnimationFrame(check);
    el.addEventListener('scroll', check, { passive: true });
    return () => el.removeEventListener('scroll', check);
  }, [showAdvancedFilters]);

  const priceOptions = [
    { label: '20L', value: '20' }, { label: '40L', value: '40' },
    { label: '60L', value: '60' }, { label: '80L', value: '80' },
    { label: '1Cr', value: '100' }, { label: '1.2Cr', value: '120' },
    { label: '1.4Cr', value: '140' }, { label: '1.6Cr', value: '160' },
    { label: '1.8Cr', value: '180' }, { label: '2Cr', value: '200' },
    { label: '2.2Cr', value: '220' }, { label: '2.4Cr', value: '240' },
    { label: '2.6Cr', value: '260' }, { label: '3Cr', value: '300' },
    { label: '3.5Cr', value: '350' }, { label: '4Cr', value: '400' },
    { label: '4.5Cr', value: '450' }, { label: '5Cr+', value: '500' },
  ];

  const dubaiPriceOptions = [
    { label: 'AED 1M', value: '1' }, { label: 'AED 1.5M', value: '1.5' },
    { label: 'AED 2M', value: '2' }, { label: 'AED 2.5M', value: '2.5' },
    { label: 'AED 3M', value: '3' }, { label: 'AED 4M', value: '4' },
    { label: 'AED 5M', value: '5' }, { label: 'AED 7M', value: '7' },
    { label: 'AED 10M', value: '10' }, { label: 'AED 15M', value: '15' },
    { label: 'AED 20M+', value: '20' },
  ];

  const isDubaiCity = filterCityId?.toLowerCase() === 'dubai';
  const activePriceOptions = isDubaiCity ? dubaiPriceOptions : priceOptions;

  const handleCityTabClick = (cityValue: string) => {
    setFilterCityId(cityValue);
    setCurrentPage(1);
    setActiveStatFilter(null);
  };

  const productTypeIcons: Record<string, React.ReactNode> = {
    'Flat/Apartment': <Building2 className="w-5 h-5" />,
    'House/Villa': <Home className="w-5 h-5" />,
    'Villa': <Home className="w-5 h-5" />,
    'Plot/Land': <MapPin className="w-5 h-5" />,
  };
  const defaultProductIcon = <Building2 className="w-5 h-5" />;

  const possessionIcons: Record<string, React.ReactNode> = {
    'Ready to Move': <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>,
    'Less than 6 Months': <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 8 14" /></svg>,
  };
  const defaultPossessionIcon = <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 8 14" /></svg>;

  const maxPriceFiltered = minPrice
    ? activePriceOptions.filter(p => parseFloat(p.value) > parseFloat(minPrice))
    : activePriceOptions;

  const filterPanel = (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-white/40 pb-3 mb-1">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center shadow-lg" style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' }}>
            <Filter className="w-4 h-4 text-white" />
          </div>
          <span className="text-lg font-black tracking-tight" style={{ color: '#0a1628' }}>Advanced Filters</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[360px_1fr] md:gap-x-14 gap-y-8 items-start">
        <div className="space-y-2">
          <div className="text-[10px] uppercase tracking-widest font-black ml-1" style={{ color: '#0f172a' }}>Filter by Budget</div>
          <div className="flex items-start gap-2 p-1.5 rounded-xl border bg-white/50 backdrop-blur-sm" style={{ borderColor: '#e2e8f0' }}>
            <div className="flex-1 flex flex-col min-w-0">
              <div className="px-3 py-1.5 text-[10px] font-black uppercase tracking-widest border-b"
                style={{ color: '#0f172a', borderColor: '#e2e8f0', background: 'rgba(255,255,255,0.85)', borderRadius: '6px 6px 0 0' }}>
                Min Price
              </div>
              <select value={minPrice} onChange={e => { const v = e.target.value; setMinPrice(v); if (maxPrice && v && parseFloat(maxPrice) < parseFloat(v)) setMaxPrice(''); setCurrentPage(1); }}
                size={5}
                className="w-full px-3 py-1 text-xs font-bold outline-none cursor-pointer bg-transparent"
                style={{ color: '#1e293b', overflowY: 'scroll' }}>
                {activePriceOptions.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </div>
            <div className="w-px self-stretch bg-slate-200" />
            <div className="flex-1 flex flex-col min-w-0">
              <div className="px-3 py-1.5 text-[10px] font-black uppercase tracking-widest border-b"
                style={{ color: '#0f172a', borderColor: '#e2e8f0', background: 'rgba(255,255,255,0.85)', borderRadius: '6px 6px 0 0' }}>
                {maxPriceFiltered.length === 0 && minPrice ? 'No Max Price' : 'Max Price'}
              </div>
              <select value={maxPrice} onChange={e => { setMaxPrice(e.target.value); setCurrentPage(1); }}
                size={5}
                className="w-full px-3 py-1 text-xs font-bold outline-none cursor-pointer bg-transparent"
                style={{ color: '#1e293b', overflowY: 'scroll' }}>
                {maxPriceFiltered.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="space-y-2 relative min-w-0">
          <div className="hidden md:block absolute -left-7 top-0 bottom-0 w-px bg-slate-100" />
          <div className="text-[10px] uppercase tracking-widest font-black ml-1" style={{ color: '#0f172a' }}>Bedrooms (BHK)</div>
          <div className="flex flex-wrap gap-2">
            {filtersLoading ? (
              Array.from({ length: 5 }).map((_, i) => <SkeletonPill key={i} />)
            ) : (
              bhkTypes.map(bk => {
                const isActive = filterBhks.includes(bk.value);
                return (
                  <button key={bk.value}
                    onClick={() => { setFilterBhks(prev => prev.includes(bk.value) ? prev.filter(x => x !== bk.value) : [...prev, bk.value]); setCurrentPage(1); }}
                    className="px-4 py-2 rounded-xl text-xs font-black transition-all hover:scale-105 active:scale-95"
                    style={{
                      background: isActive ? 'linear-gradient(135deg, #0a1628 0%, #1e3a5f 100%)' : '#fff',
                      border: isActive ? '1.5px solid transparent' : '1.5px solid #e2e8f0',
                      color: isActive ? '#fff' : '#334155',
                      boxShadow: isActive ? '0 4px 10px rgba(10,22,40,0.15)' : 'none',
                    }}>
                    {bk.label}
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[360px_1fr] md:gap-x-14 gap-y-8 items-start">
        <div className="space-y-2">
          <div className="text-[10px] uppercase tracking-widest font-black ml-1" style={{ color: '#0f172a' }}>Property Type</div>
          <div className="grid grid-cols-2 gap-3 w-full">
            {filtersLoading ? (
              Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} className="w-full h-24" />)
            ) : (
              productTypes.map(pt => {
                const isActive = filterProductTypes.includes(pt.value);
                return (
                  <button key={pt.value}
                    onClick={() => { setFilterProductTypes(prev => prev.includes(pt.value) ? prev.filter(x => x !== pt.value) : [...prev, pt.value]); setCurrentPage(1); }}
                    className="relative flex flex-col items-center justify-center gap-2 w-full h-[88px] md:h-24 rounded-2xl transition-all"
                    style={{
                      background: isActive ? 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)' : '#ffffff',
                      border: `2px solid ${isActive ? '#f59e0b' : '#f1f5f9'}`,
                      boxShadow: isActive ? '0 10px 20px rgba(245,158,11,0.12)' : '0 2px 6px rgba(0,0,0,0.03)',
                    }}>
                    <div className="w-10 h-10 rounded-full flex items-center justify-center transition-transform duration-300"
                      style={{ background: isActive ? 'rgba(245,158,11,0.15)' : '#f8fafc', transform: isActive ? 'scale(1.1)' : 'scale(1)' }}>
                      <span style={{ color: isActive ? '#f59e0b' : '#59616c' }}>
                        {productTypeIcons[pt.value] || defaultProductIcon}
                      </span>
                    </div>
                    <span className="text-[11px] font-black tracking-tight leading-none text-center px-1" style={{ color: isActive ? '#92400e' : '#334155' }}>{pt.label}</span>
                    {isActive && <div className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-amber-500 shadow-sm border border-white" />}
                  </button>
                );
              })
            )}
          </div>
        </div>

        <div className="space-y-2 relative min-w-0">
          <div className="hidden md:block absolute -left-7 top-0 bottom-0 w-px bg-slate-100" />
          <div className="text-[10px] uppercase tracking-widest font-black ml-1" style={{ color: '#0f172a' }}>Possession Status</div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => possessionScrollRef.current?.scrollBy({ left: -(possessionScrollRef.current?.clientWidth ?? 200), behavior: 'smooth' })}
              className="xl:hidden w-8 h-8 min-w-[32px] min-h-[32px] flex-shrink-0 aspect-square flex items-center justify-center rounded-full shadow-sm transition-all"
              style={{ background: '#ffffff', border: `1.5px solid ${possScrollAtStart ? '#f1f5f9' : '#e2e8f0'}`, opacity: possScrollAtStart ? 0.3 : 1, pointerEvents: possScrollAtStart ? 'none' : 'auto', cursor: possScrollAtStart ? 'default' : 'pointer' }}
            >
              <ChevronLeft className="w-4 h-4" style={{ color: '#0a1628' }} />
            </button>
            <div
              ref={possessionScrollRef}
              className="flex gap-2 md:gap-3 overflow-x-auto pb-1 no-scrollbar flex-1" style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}>
              {
                POSSESSION_ORDER.map(label => {
                  const ps = { label, value: label };
                  const isActive = filterPossessions.includes(ps.value);
                  return (
                    <button key={ps.value}
                      onClick={() => { setFilterPossessions(prev => prev.includes(ps.value) ? prev.filter(x => x !== ps.value) : [...prev, ps.value]); setCurrentPage(1); }}
                      className="flex-shrink-0 relative flex flex-col items-center justify-center gap-2 h-[88px] md:!w-24 md:h-24 rounded-2xl transition-all"
                      style={{
                        width: 'calc(50% - 4px)',
                        background: isActive ? 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)' : '#ffffff',
                        border: `2px solid ${isActive ? '#22c55e' : '#f1f5f9'}`,
                        boxShadow: isActive ? '0 10px 20px rgba(34,197,94,0.12)' : '0 2px 6px rgba(0,0,0,0.03)',
                      }}>
                      <div className="w-8 h-8 rounded-full flex items-center justify-center transition-transform duration-300"
                        style={{ background: isActive ? 'rgba(34,197,94,0.15)' : '#f8fafc', transform: isActive ? 'scale(1.1)' : 'scale(1)' }}>
                        <span style={{ color: isActive ? '#22c55e' : '#59616c' }}>
                          {possessionIcons[ps.value] || defaultPossessionIcon}
                        </span>
                      </div>
                      <span className="text-[10px] font-black tracking-tight leading-tight text-center px-0.5" style={{ color: isActive ? '#166534' : '#334155' }}>{ps.label}</span>
                      {isActive && <div className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-green-500 shadow-sm border border-white" />}
                    </button>
                  );
                })
              }
            </div>
            <button
              onClick={() => possessionScrollRef.current?.scrollBy({ left: possessionScrollRef.current?.clientWidth ?? 200, behavior: 'smooth' })}
              className="xl:hidden w-8 h-8 min-w-[32px] min-h-[32px] flex-shrink-0 aspect-square flex items-center justify-center rounded-full shadow-sm transition-all"
              style={{ background: '#ffffff', border: `1.5px solid ${possScrollAtEnd ? '#f1f5f9' : '#e2e8f0'}`, opacity: possScrollAtEnd ? 0.3 : 1, pointerEvents: possScrollAtEnd ? 'none' : 'auto', cursor: possScrollAtEnd ? 'default' : 'pointer' }}
            >
              <ChevronRight className="w-4 h-4" style={{ color: '#0a1628' }} />
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row items-center justify-center gap-4">
        <button onClick={() => { setSearchTrigger(t => t + 1); setCurrentPage(1); setShowAdvancedFilters(false); }}
          className="relative flex items-center justify-center gap-3 py-3 px-10 rounded-2xl font-black text-xs uppercase tracking-widest text-white shadow-xl transition-all active:scale-[0.98] group overflow-hidden"
          style={{ background: '#0a1628', minWidth: 200 }}>
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' }} />
          <Search className="w-4 h-4 relative z-10 group-hover:text-black transition-colors" />
          <span className="relative z-10 group-hover:text-black transition-colors">Search Results</span>
        </button>
        <button onClick={handleResetFilters}
          className="px-8 py-3 rounded-2xl font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 border bg-white/50"
          style={{ borderColor: '#e2e8f0', color: '#334155' }}
          onMouseEnter={e => (e.currentTarget.style.background = '#fef2f2')}
          onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.5)')}>
          <RefreshCw className="w-3.5 h-3.5" />
          Reset
        </button>
      </div>
    </div>
  );

  return (
    <AppLayout title="Property Portal" subtitle="Discover exclusive projects">
      <div className="pb-20 min-h-screen" style={{ background: '#f8f9fc' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-3">

          <div className="relative rounded-[1.5rem] overflow-hidden" style={{ background: 'linear-gradient(135deg, #0a1628 0%, #1e3a5f 100%)' }}>
            <div className="absolute inset-0 opacity-20">
              <img src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=1400&auto=format&fit=crop" alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            </div>
            <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(10,22,40,0.92) 0%, rgba(30,58,95,0.85) 100%)' }} />
            <div className="relative z-10 p-5 sm:p-8">
              <div className="flex items-center gap-3 mb-4">
                <img src="/assets/images/cg_logo.png" alt="Casagrand" className="h-7 w-auto object-contain" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { key: null, label: 'Available Projects', value: totalProjects === null ? '—' : totalProjects, color: '#f59e0b', sub: 'All listings', click: true },
                  { key: 'available', label: 'With Units', value: withUnitsCount === null ? '—' : withUnitsCount, color: '#34d399', sub: 'Available now', click: true },
                  { key: null, label: 'Available Cities', value: totalCities === null ? '—' : totalCities, color: '#a78bfa', sub: 'Across India', click: false },
                ].map(stat => (
                  <button key={stat.label}
                    onClick={() => { if (stat.click) { setActiveStatFilter(activeStatFilter === stat.key ? null : stat.key); setCurrentPage(1); } }}
                    style={{
                      background: activeStatFilter === stat.key && stat.click ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.08)',
                      border: `1.5px solid ${activeStatFilter === stat.key && stat.click ? stat.color : 'rgba(255,255,255,0.15)'}`,
                      borderRadius: 16, padding: '12px 8px', textAlign: 'center', cursor: stat.click ? 'pointer' : 'default', transition: 'all 0.2s',
                    }}>
                    <div style={{ fontSize: 22, fontWeight: 900, color: stat.color, lineHeight: 1 }}>{stat.value}</div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#fff', marginTop: 4, textTransform: 'uppercase', letterSpacing: 1 }}>{stat.label}</div>
                    <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{stat.sub}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="hidden md:block w-full">
            <div
              ref={desktopCityScrollRef}
              className="flex w-full rounded-2xl border shadow-sm overflow-hidden"
              style={{ background: '#ffffff', borderColor: '#e2e8f0' }}
            >
              <button
                onClick={() => handleCityTabClick('')}
                className="flex-1 px-4 py-3 text-left transition-all"
                style={{
                  background: filterCityId === '' ? '#f59e0b' : 'transparent',
                  borderRight: '1px solid #e2e8f0',
                  borderRadius: '1rem 0 0 1rem',
                }}
              >
                <div className="font-black text-sm" style={{ color: filterCityId === '' ? '#0a1628' : '#334155' }}>All Locations</div>
                {filtersLoading ? (
                  <div className="space-y-1 mt-1">
                    <div className="h-3 w-20 bg-slate-200/50 rounded animate-pulse" />
                    <div className="h-3 w-16 bg-slate-200/50 rounded animate-pulse" />
                  </div>
                ) : (
                  <>
                    <div className="text-xs mt-0.5 font-semibold" style={{ color: filterCityId === '' ? 'rgba(10,22,40,0.75)' : '#59616c' }}>
                      All Projects · {grandTotal || '—'}
                    </div>
                    <div className="text-xs font-semibold" style={{ color: filterCityId === '' ? 'rgba(10,22,40,0.75)' : '#59616c' }}>
                      Available · {grandAvailable || '—'}
                    </div>
                  </>
                )}
              </button>

              {filtersLoading ? (
                Array.from({ length: 4 }).map((_, i) => <SkeletonTab key={i} />)
              ) : (
                cities.map((city, idx) => {
                  const isActive = filterCityId === city.value;
                  const counts = cityCounts[city.value];
                  return (
                    <button
                      key={city.value}
                      onClick={() => handleCityTabClick(city.value)}
                      className="flex-1 px-4 py-3 text-sm font-semibold transition-all"
                      style={{
                        background: isActive ? '#fffbeb' : 'transparent',
                        borderRight: idx < cities.length - 1 ? '1px solid #e2e8f0' : 'none',
                        borderBottom: isActive ? '3px solid #f59e0b' : '3px solid transparent',
                        borderRadius: idx === cities.length - 1 ? '0 1rem 1rem 0' : 0,
                      }}
                    >
                      <div className="font-bold text-sm" style={{ color: isActive ? '#92400e' : '#334155' }}>{city.label}</div>
                      {cityCountsReady ? (
                        <>
                          <div className="text-xs mt-0.5" style={{ color: isActive ? '#b45309' : '#59616c' }}>Projects · {counts?.total ?? 0}</div>
                          <div className="text-xs" style={{ color: isActive ? '#b45309' : '#59616c' }}>Available · {counts?.available ?? 0}</div>
                        </>
                      ) : (
                        <div className="text-xs mt-0.5 animate-pulse" style={{ color: '#cbd5e1' }}>Loading…</div>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>

          <div className="md:hidden">
            <div className="flex items-center gap-2">
              <button
                onClick={() => mobileCityScrollRef.current?.scrollBy({ left: -(mobileCityScrollRef.current?.clientWidth ?? 240), behavior: 'smooth' })}
                className="w-8 h-8 min-w-[32px] min-h-[32px] flex-shrink-0 aspect-square flex items-center justify-center rounded-full shadow-sm transition-all"
                style={{ background: '#ffffff', border: `1.5px solid ${cityScrollAtStart ? '#f1f5f9' : '#e2e8f0'}`, opacity: cityScrollAtStart ? 0.3 : 1, pointerEvents: cityScrollAtStart ? 'none' : 'auto', cursor: cityScrollAtStart ? 'default' : 'pointer' }}
              >
                <ChevronLeft className="w-4 h-4" style={{ color: '#0a1628' }} />
              </button>
              <div
                ref={mobileCityScrollRef}
                className="flex gap-2 overflow-x-auto pb-1 flex-1"
                style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}
              >
                <button
                  onClick={() => handleCityTabClick('')}
                  className="flex-shrink-0 flex flex-col items-center px-2 py-2.5 rounded-2xl transition-all"
                  style={{
                    background: filterCityId === '' ? 'linear-gradient(135deg, #f59e0b, #d97706)' : '#ffffff',
                    border: `1.5px solid ${filterCityId === '' ? '#f59e0b' : '#e2e8f0'}`,
                    boxShadow: filterCityId === '' ? '0 4px 12px rgba(245,158,11,0.3)' : '0 1px 4px rgba(0,0,0,0.06)',
                    width: 'calc(50% - 4px)',
                    flexShrink: 0,
                  }}
                >
                  <span className="text-xs font-black" style={{ color: filterCityId === '' ? '#0a1628' : '#334155' }}>All</span>
                  {filtersLoading ? (
                    <div className="space-y-1 mt-1 flex flex-col items-center">
                      <div className="h-2 w-12 bg-slate-200/50 rounded animate-pulse" />
                      <div className="h-2 w-10 bg-slate-200/50 rounded animate-pulse" />
                    </div>
                  ) : (
                    <>
                      <span className="text-[10px] font-bold mt-0.5" style={{ color: filterCityId === '' ? 'rgba(10,22,40,0.7)' : '#59616c' }}>
                        Projects · {grandTotal ?? '—'}
                      </span>
                      <span className="text-[10px] font-bold" style={{ color: filterCityId === '' ? 'rgba(10,22,40,0.7)' : '#59616c' }}>
                        Available · {grandAvailable ?? '—'}
                      </span>
                    </>
                  )}
                </button>

                {filtersLoading ? (
                  Array.from({ length: 4 }).map((_, i) => <SkeletonPill key={i} />)
                ) : (
                  cities.map(city => {
                    const isActive = filterCityId === city.value;
                    const counts = cityCountsReady ? (cityCounts[city.value] ?? { total: 0, available: 0 }) : null;
                    return (
                      <button
                        key={city.value}
                        onClick={() => handleCityTabClick(city.value)}
                        className="flex-shrink-0 flex flex-col items-center px-2 py-2.5 rounded-2xl transition-all"
                        style={{
                          background: isActive ? 'linear-gradient(135deg, #f59e0b, #d97706)' : '#ffffff',
                          border: `1.5px solid ${isActive ? '#f59e0b' : '#e2e8f0'}`,
                          boxShadow: isActive ? '0 4px 12px rgba(245,158,11,0.3)' : '0 1px 4px rgba(0,0,0,0.06)',
                          width: 'calc(50% - 4px)',
                          flexShrink: 0,
                          opacity: counts && counts.total === 0 ? 0.5 : 1,
                        }}
                      >
                        <span className="text-xs font-black truncate w-full text-center" style={{ color: isActive ? '#0a1628' : '#334155' }}>
                          {city.label}
                        </span>
                        {counts ? (
                          <>
                            <span className="text-[10px] font-bold mt-0.5" style={{ color: isActive ? 'rgba(10,22,40,0.7)' : '#59616c' }}>
                              Projects · {counts.total}
                            </span>
                            <span className="text-[10px] font-bold" style={{ color: isActive ? 'rgba(10,22,40,0.7)' : counts.available > 0 ? '#15803d' : '#59616c' }}>
                              Available · {counts.available}
                            </span>
                          </>
                        ) : (
                          <span className="text-[10px] mt-0.5 animate-pulse" style={{ color: '#cbd5e1' }}>…</span>
                        )}
                      </button>
                    );
                  })
                )}
              </div>
              <button
                onClick={() => mobileCityScrollRef.current?.scrollBy({ left: mobileCityScrollRef.current?.clientWidth ?? 240, behavior: 'smooth' })}
                className="w-8 h-8 min-w-[32px] min-h-[32px] flex-shrink-0 aspect-square flex items-center justify-center rounded-full shadow-sm transition-all"
                style={{ background: '#ffffff', border: `1.5px solid ${cityScrollAtEnd ? '#f1f5f9' : '#e2e8f0'}`, opacity: cityScrollAtEnd ? 0.3 : 1, pointerEvents: cityScrollAtEnd ? 'none' : 'auto', cursor: cityScrollAtEnd ? 'default' : 'pointer' }}
              >
                <ChevronRight className="w-4 h-4" style={{ color: '#0a1628' }} />
              </button>
            </div>
          </div>

          <div className="hidden md:flex lg:hidden justify-center items-center gap-3 mt-3 mb-1">
            <button
              onClick={() => desktopCityScrollRef.current?.scrollBy({ left: -160, behavior: 'smooth' })}
              className="w-8 h-8 min-w-[32px] min-h-[32px] flex-shrink-0 aspect-square flex items-center justify-center rounded-full shadow-sm transition-all active:scale-95"
              style={{ background: '#ffffff', border: '1.5px solid #e2e8f0' }}
            >
              <ChevronLeft className="w-4 h-4" style={{ color: '#0a1628' }} />
            </button>
            <div className="h-1 w-10 rounded-full" style={{ background: '#e2e8f0' }} />
            <button
              onClick={() => desktopCityScrollRef.current?.scrollBy({ left: 160, behavior: 'smooth' })}
              className="w-8 h-8 min-w-[32px] min-h-[32px] flex-shrink-0 aspect-square flex items-center justify-center rounded-full shadow-sm transition-all active:scale-95"
              style={{ background: '#ffffff', border: '1.5px solid #e2e8f0' }}
            >
              <ChevronRight className="w-4 h-4" style={{ color: '#0a1628' }} />
            </button>
          </div>

          <>
            <div className="hidden lg:block space-y-4">
              <button onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className="flex items-center gap-3 px-6 py-3 rounded-2xl font-black text-sm transition-all active:scale-[0.98] border shadow-sm"
                style={{ background: '#fff', borderColor: activeFiltersCount > 0 ? '#f59e0b' : '#e2e8f0', color: '#0a1628' }}>
                <div className="w-6 h-6 rounded flex items-center justify-center" style={{ background: activeFiltersCount > 0 ? '#f59e0b' : '#f8fafc' }}>
                  <Filter className={`w-3.5 h-3.5 ${activeFiltersCount > 0 ? 'text-white' : 'text-slate-400'}`} />
                </div>
                {showAdvancedFilters ? 'Hide Filters' : 'Show Advanced Filters'}
                {activeFiltersCount > 0 && <span className="ml-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] bg-red-500 text-white shadow-sm">{activeFiltersCount}</span>}
              </button>

              {showAdvancedFilters && (
                <div className="rounded-[2.5rem] border-2 p-8 shadow-2xl relative overflow-hidden transition-all"
                  style={{ borderColor: 'rgba(255,255,255,0.8)', background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(20px)' }}>
                  <div className="absolute -top-24 -right-24 w-48 h-48 rounded-full blur-[80px]" style={{ background: 'rgba(245,158,11,0.1)' }} />
                  <div className="absolute -bottom-24 -left-24 w-48 h-48 rounded-full blur-[80px]" style={{ background: 'rgba(10,22,40,0.05)' }} />
                  <div className="relative z-10">
                    {filterPanel}
                  </div>
                </div>
              )}
            </div>

            <div className="lg:hidden">
              <button onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className="w-full flex items-center justify-between px-6 py-5 rounded-[1.5rem] font-black text-sm shadow-xl transition-all active:scale-[0.98]"
                style={{ background: '#fff', border: '1.5px solid ' + (activeFiltersCount > 0 ? '#f59e0b' : '#f1f5f9'), color: '#0a1628' }}>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: activeFiltersCount > 0 ? '#f59e0b' : '#f8fafc' }}>
                    <Filter className={`w-4 h-4 ${activeFiltersCount > 0 ? 'text-white' : 'text-slate-400'}`} />
                  </div>
                  Search & Filter {activeFiltersCount > 0 && <span className="ml-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] bg-red-500 text-white shadow-sm">{activeFiltersCount}</span>}
                </div>
                <ChevronRight className="w-4 h-4 transition-transform duration-300" style={{ transform: showAdvancedFilters ? 'rotate(90deg)' : 'rotate(0deg)', color: '#59616c' }} />
              </button>
              {showAdvancedFilters && (
                <div className="mt-4 bg-white rounded-[1.5rem] border-2 p-6 shadow-2xl relative overflow-hidden" style={{ borderColor: '#f1f5f9' }}>
                  {filterPanel}
                </div>
              )}
            </div>
          </>

          <div className="px-2 pb-2">
            {hasFilter && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-6 rounded-full" style={{ background: '#f59e0b' }} />
                  <h2 className="text-xl font-black tracking-tight text-neutral-800">Showing Filtered Results</h2>
                  <span className="text-sm font-bold text-neutral-400">({filteredProperties.length} found)</span>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white shadow-sm border" style={{ borderColor: '#e2e8f0', borderRadius: '1.5rem' }}>
            <div className="hidden md:block overflow-x-auto" style={{ borderRadius: '1.5rem 1.5rem 0 0' }}>
              <div style={{ maxHeight: '600px', overflowY: 'auto', borderRadius: '1.5rem 1.5rem 0 0' }}>
                <table className="w-full text-sm" style={{ borderCollapse: 'separate', borderSpacing: 0 }}>
                  <thead style={{ background: 'linear-gradient(135deg, #0a1628 0%, #1e3a5f 100%)', position: 'sticky', top: 0, zIndex: 10 }}>
                    <tr>
                      <th className="px-6 py-5 text-left font-bold uppercase tracking-widest text-xs" style={{ color: 'rgba(255,255,255,0.7)' }}>Project Name</th>
                      <th className="px-6 py-5 text-left font-bold uppercase tracking-widest text-xs" style={{ color: 'rgba(255,255,255,0.7)' }}>Location</th>
                      <th className="px-6 py-5 text-center font-bold uppercase tracking-widest text-xs" style={{ color: 'rgba(255,255,255,0.7)' }}>Available Units</th>
                      <th className="px-6 py-5 text-center font-bold uppercase tracking-widest text-xs" style={{ color: 'rgba(255,255,255,0.7)' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan={4} className="px-6 py-20 text-center" style={{ color: '#59616c' }}>
                        <div className="w-8 h-8 rounded-full mx-auto mb-4 animate-spin" style={{ border: '4px solid #e2e8f0', borderTopColor: '#f59e0b' }} />
                        Loading...
                      </td></tr>
                    ) : currentProperties.length === 0 ? (
                      <tr><td colSpan={4} className="px-6 py-24 text-center">
                        <Building2 className="w-12 h-12 mx-auto mb-3" style={{ color: '#cbd5e1' }} />
                        <p className="font-bold" style={{ color: '#59616c' }}>{!hasFilter ? "Please apply filters to view properties" : "No properties found matching your filters"}</p>
                      </td></tr>
                    ) : currentProperties.map(p => (
                      <tr key={p.id}
                        className="group transition-colors border-b"
                        style={{ borderColor: '#f1f5f9', cursor: 'pointer' }}
                        onMouseEnter={e => (e.currentTarget.style.background = '#fffbeb')}
                        onMouseLeave={e => (e.currentTarget.style.background = '')}>
                        <td className="px-6 py-5" onClick={() => handlePropertyClick(p)}>
                          <div className="font-bold text-sm" style={{ color: '#1e293b' }}>{p.project_name}</div>
                          {p.possession_status && <div className="text-[10px] uppercase font-bold mt-0.5" style={{ color: '#59616c', letterSpacing: '0.1em' }}>{p.possession_status}</div>}
                        </td>
                        <td className="px-6 py-5" onClick={() => handlePropertyClick(p)}>
                          <div className="font-medium text-sm" style={{ color: '#59616c' }}>{p.locationData?.name || '—'}</div>
                          <div className="text-xs" style={{ color: '#59616c' }}>{p.cityData?.name || ''}</div>
                        </td>
                        <td className="px-6 py-5 text-center" onClick={() => handlePropertyClick(p)}>
                          <span className="inline-flex items-center justify-center min-w-[2.5rem] px-3 py-1 rounded-full font-bold text-sm"
                            style={{ background: '#f0fdf4', color: '#15803d' }}>
                            {p.available_units || 0}
                          </span>
                        </td>
                        <td className="px-6 py-5 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={e => { e.stopPropagation(); handleSiteVisitClick(p); }}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all border shadow-sm"
                              style={{ background: '#f0fdf4', color: '#15803d', borderColor: '#bcf2d1' }}
                              onMouseEnter={e => { (e.currentTarget.style.background = '#15803d'); (e.currentTarget.style.color = '#fff'); }}
                              onMouseLeave={e => { (e.currentTarget.style.background = '#f0fdf4'); (e.currentTarget.style.color = '#15803d'); }}>
                              <CalendarCheck className="w-3 h-3" /> Site Visit
                            </button>
                            <button
                              onClick={e => { e.stopPropagation(); handleVirtualTourClick(p); }}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all border shadow-sm"
                              style={{ background: '#f5f3ff', color: '#6d28d9', borderColor: '#ddd6fe' }}
                              onMouseEnter={e => { (e.currentTarget.style.background = '#6d28d9'); (e.currentTarget.style.color = '#fff'); }}
                              onMouseLeave={e => { (e.currentTarget.style.background = '#f5f3ff'); (e.currentTarget.style.color = '#6d28d9'); }}>
                              <Video className="w-3 h-3" /> Virtual Tour
                            </button>
                            <button
                              onClick={e => { e.stopPropagation(); handleBookNowClick(p); }}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all border shadow-sm"
                              style={{ background: '#fffbeb', color: '#d97706', borderColor: '#fde68a' }}
                              onMouseEnter={e => { (e.currentTarget.style.background = '#f59e0b'); (e.currentTarget.style.color = '#0a1628'); }}
                              onMouseLeave={e => { (e.currentTarget.style.background = '#fffbeb'); (e.currentTarget.style.color = '#d97706'); }}>
                              <BookOpen className="w-3 h-3" /> Book Now
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="md:hidden">
              {loading ? (
                <div className="p-8 text-center" style={{ color: '#59616c' }}>
                  <div className="w-8 h-8 rounded-full mx-auto mb-4 animate-spin" style={{ border: '4px solid #e2e8f0', borderTopColor: '#f59e0b' }} />
                  Loading...
                </div>
              ) : currentProperties.length === 0 ? (
                <div className="p-10 text-center">
                  <Building2 className="w-12 h-12 mx-auto mb-3" style={{ color: '#cbd5e1' }} />
                  <p className="font-bold" style={{ color: '#59616c' }}>{!hasFilter ? "Please apply filters to view properties" : "No properties found matching your filters"}</p>
                </div>
              ) : currentProperties.map(p => (
                <div key={p.id} className="p-4 border-b" style={{ borderColor: '#f1f5f9' }}>
                  <div className="flex items-start justify-between gap-3 mb-4" onClick={() => handlePropertyClick(p)}>
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#f1f5f9' }}>
                        <Building2 className="w-5 h-5" style={{ color: '#59616c' }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-sm truncate" style={{ color: '#1e293b' }}>{p.project_name}</div>
                        <div className="flex items-center gap-1 mt-1 text-xs" style={{ color: '#59616c' }}>
                          <MapPin className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">{p.locationData?.name}, {p.cityData?.name}</span>
                        </div>
                        <span className="inline-flex items-center justify-center mt-2 px-2 py-0.5 rounded-full font-bold text-[10px]" style={{ background: '#f0fdf4', color: '#15803d' }}>
                          {p.available_units || 0} Available
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <button onClick={() => handleSiteVisitClick(p)} className="flex flex-col items-center gap-1 py-2 rounded-xl text-[9px] font-black uppercase tracking-tight border" style={{ background: '#f0fdf4', color: '#15803d', borderColor: '#bcf2d1' }}><CalendarCheck className="w-3.5 h-3.5" /> Visit</button>
                    <button onClick={() => handleVirtualTourClick(p)} className="flex flex-col items-center gap-1 py-2 rounded-xl text-[9px] font-black uppercase tracking-tight border" style={{ background: '#f5f3ff', color: '#6d28d9', borderColor: '#ddd6fe' }}><Video className="w-3.5 h-3.5" /> Tour</button>
                    <button onClick={() => handleBookNowClick(p)} className="flex flex-col items-center gap-1 py-2 rounded-xl text-[9px] font-black uppercase tracking-tight border" style={{ background: '#fffbeb', color: '#d97706', borderColor: '#fde68a' }}><BookOpen className="w-3.5 h-3.5" /> Book</button>
                  </div>
                </div>
              ))}
            </div>

            {!loading && totalPages > 1 && currentProperties.length > 0 && (
              <div className="px-4 sm:px-6 py-4 border-t flex flex-col sm:flex-row items-center justify-between gap-4"
                style={{ borderColor: '#f1f5f9', background: '#f8fafc', borderRadius: '0 0 1.5rem 1.5rem' }}>
                <div className="text-sm font-medium" style={{ color: '#59616c' }}>
                  Showing <span className="font-bold" style={{ color: '#334155' }}>{(currentPage - 1) * itemsPerPage + 1}</span>–<span className="font-bold" style={{ color: '#334155' }}>{Math.min(currentPage * itemsPerPage, filteredProperties.length)}</span> of <span className="font-bold" style={{ color: '#334155' }}>{filteredProperties.length}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
                    className="p-2 rounded-xl border disabled:opacity-50" style={{ borderColor: '#e2e8f0', background: '#fff', color: '#59616c' }}>
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pg = currentPage <= 3 ? i + 1 : currentPage >= totalPages - 2 ? totalPages - 4 + i : currentPage - 2 + i;
                    if (pg < 1 || pg > totalPages) return null;
                    return (
                      <button key={pg} onClick={() => setCurrentPage(pg)}
                        className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold border"
                        style={{ background: pg === currentPage ? '#f59e0b' : '#fff', color: pg === currentPage ? '#0a1628' : '#59616c', borderColor: pg === currentPage ? '#f59e0b' : '#e2e8f0' }}>
                        {pg}
                      </button>
                    );
                  })}
                  <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
                    className="p-2 rounded-xl border disabled:opacity-50" style={{ borderColor: '#e2e8f0', background: '#fff', color: '#59616c' }}>
                    <ChevronRightIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <BookingUnitsModal 
        isOpen={isUnitsModalOpen} 
        onClose={() => { setIsUnitsModalOpen(false); router.push('/booking-portal/properties'); }}
        property={selectedProperty} 
        units={propertyUnits}
        allUnits={propertyAllUnits}
        initialView={modalInitialView}
        viewers={unitViewers}
        costViewers={costSheetViewers}
        socket={socketRef.current}
        onSelectUnit={(unit: any) => { setSelectedUnit(unit); setIsUnitsModalOpen(false); setIsCostSheetModalOpen(true); }}
        onBookNow={(unit: any) => { setSelectedUnit(unit); setIsUnitsModalOpen(false); setIsBookNowModalOpen(true); }}
      />
      
      <CostSheetModal 
        isOpen={isCostSheetModalOpen} 
        onClose={() => { setIsCostSheetModalOpen(false); setIsUnitsModalOpen(true); }}
        unit={selectedUnit} 
        property={selectedProperty} 
      />

      <BookNowModal 
        isOpen={isBookNowModalOpen} 
        onClose={() => { 
          setIsBookNowModalOpen(false); 
          setIsUnitsModalOpen(true); 
        }}
        unit={propertyAllUnits.find(u => u.id === selectedUnit?.id) || selectedUnit}
        property={selectedProperty}
      />

      <VirtualTourModal 
        isOpen={isVirtualTourModalOpen} 
        onClose={() => { setIsVirtualTourModalOpen(false); router.push('/booking-portal/properties'); }}
        property={selectedProperty}
      />

      <SiteVisitModal 
        isOpen={isSiteVisitModalOpen} 
        onClose={() => { setIsSiteVisitModalOpen(false); router.push('/booking-portal/properties'); }}
        property={selectedProperty}
      />
    </AppLayout>
  );
}

export default function PropertyPortalPage() {
  return (
    <Suspense>
      <PropertyPortal />
    </Suspense>
  );
}
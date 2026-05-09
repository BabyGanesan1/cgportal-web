'use client';
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Building2, Home, CheckCircle, Clock, TrendingUp, PieChart, BarChart3, ChevronDown } from 'lucide-react';
import AppLayout from '../../components/layout/AppLayout';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import FilterSelect from '../../components/dashboard/FilterSelect';
import { RotateCcw, Search } from 'lucide-react';

import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

interface ProjectStats {
  id: number;
  name: string;
  city_name: string;
  location_name: string;
  total_units: number;
  available_units: number;
  sold_units: number;
  booked_units: number;
  blocked_units: number;
  status_counts?: Record<string, number>;
}

const ALL_STATUSES = [
  { value: 'HSBC-Open for Sale with 10%', label: 'HSBC-Open for Sale with 10%', category: 'available' },
  { value: 'Open for Sale with 10%', label: 'Open for Sale with 10%', category: 'available' },
  { value: 'Vacant', label: 'Vacant', category: 'available' },
  { value: 'HSBC-Vacant', label: 'HSBC-Vacant', category: 'available' },
  { value: 'Vacant (Rent or Lease)', label: 'Vacant (Rent or Lease)', category: 'available' },
  { value: 'Investor', label: 'Investor', category: 'available' },
  { value: 'HSBC-Investor', label: 'HSBC-Investor', category: 'available' },
  { value: 'Investor-Open for Sale with 10%', label: 'Investor-Open for Sale with 10%', category: 'available' },
  { value: 'HSBC-Vacant-LO', label: 'HSBC-Vacant-LO', category: 'available' },
  { value: 'Sold', label: 'Sold', category: 'sold' },
  { value: 'HSBC-Sold', label: 'HSBC-Sold', category: 'sold' },
  { value: 'HSBC-TOI-Sold', label: 'HSBC-TOI-Sold', category: 'sold' },
  { value: 'HSBC-SBF-NR', label: 'HSBC-SBF-NR', category: 'sold' },
  { value: 'SBF-NR', label: 'SBF-NR', category: 'sold' },
  { value: 'Investor-Sold', label: 'Investor-Sold', category: 'sold' },
  { value: 'MGMT-Sold', label: 'MGMT-Sold', category: 'sold' },
  { value: 'HSBC-MGMT-Sold', label: 'HSBC-MGMT-Sold', category: 'sold' },
  { value: 'Sold - Model Villa', label: 'Sold - Model Villa', category: 'sold' },
  { value: 'HSBC-Model House', label: 'HSBC-Model House', category: 'sold' },
  { value: 'HSBC-Sold-LO', label: 'HSBC-Sold-LO', category: 'sold' },
  { value: 'HSFC-Sold', label: 'HSFC-Sold', category: 'sold' },
  { value: 'Sold for CP', label: 'Sold for CP', category: 'sold' },
  { value: 'TOI-Sold', label: 'TOI-Sold', category: 'sold' },
  { value: 'HMDA', label: 'HMDA', category: 'sold' },
  { value: 'Blocked', label: 'Blocked', category: 'blocked' },
  { value: 'Management', label: 'Management', category: 'booked' },
];

export default function DashboardPage() {
  const [projects, setProjects] = useState<ProjectStats[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const [filterLocation, setFilterLocation] = useState('');
  const [filterProject, setFilterProject] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Additional Filters
  const [filterBhk, setFilterBhk] = useState('');
  const [filterFacing, setFilterFacing] = useState('');
  const [filterUnitType, setFilterUnitType] = useState('');
  const [filterBlock, setFilterBlock] = useState('');
  const [filterPhase, setFilterPhase] = useState('');
  const [filterFloor, setFilterFloor] = useState('');
  const [filterCarPark, setFilterCarPark] = useState('');
  const [filterPlcReason, setFilterPlcReason] = useState('');
  const [filterUnitNo, setFilterUnitNo] = useState('');

  // Filter Options
  const [filterOptions, setFilterOptions] = useState<{
    projects: { id: number, name: string }[],
    locations: string[],
    bhk: string[],
    facing: string[],
    unit_type: string[],
    block: string[],
    phase: string[],
    floor: string[],
    car_park_type: string[],
    plc_reason: string[],
    unit_no: string[]
  }>({
    projects: [], locations: [], bhk: [], facing: [], unit_type: [], 
    block: [], phase: [], floor: [], car_park_type: [], plc_reason: [], unit_no: []
  });


  const pieChartRef = useRef<HTMLCanvasElement>(null);
  const statusChartRef = useRef<HTMLCanvasElement>(null);
  const barChartRef = useRef<HTMLCanvasElement>(null);
  const pieChartInstance = useRef<Chart | null>(null);
  const statusChartInstance = useRef<Chart | null>(null);
  const barChartInstance = useRef<Chart | null>(null);

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { 
        limit: 500,
        location: filterLocation,
        project_id: filterProject,
        bhk: filterBhk,
        facing: filterFacing,
        unit_type: filterUnitType,
        block: filterBlock,
        phase: filterPhase,
        floor: filterFloor,
        car_park_type: filterCarPark,
        plc_reason: filterPlcReason,
        unit_no: filterUnitNo
      };

      const res = await api.get('/projects/dashboard', { params });
      const data = res.data.data || [];
      setProjects(data);
    } catch (e) {
      toast.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  }, [filterLocation, filterProject, filterBhk, filterFacing, filterUnitType, filterBlock, filterPhase, filterFloor, filterCarPark, filterPlcReason, filterUnitNo]);

  const fetchFilterOptions = useCallback(async () => {
    try {
      const res = await api.get('/projects/dashboard-filters');
      if (res.data.success) {
        setFilterOptions(res.data.data);
      }
    } catch (e) {
      console.error('Failed to load filter options');
    }
  }, []);

  useEffect(() => { 
    fetchProjects(); 
    fetchFilterOptions();
  }, [fetchProjects, fetchFilterOptions]);


  const totalStats = projects.reduce((acc, p) => ({
    total: acc.total + (p.total_units || 0),
    available: acc.available + (p.available_units || 0),
    sold: acc.sold + (p.sold_units || 0),
    booked: acc.booked + (p.booked_units || 0),
    blocked: acc.blocked + (p.blocked_units || 0),
  }), { total: 0, available: 0, sold: 0, booked: 0, blocked: 0 });

  const filteredProjects = projects.filter(p => {
    if (filterStatus) {
      const statusInfo = ALL_STATUSES.find(s => s.value === filterStatus);
      if (statusInfo) {
        const categoryCount = statusInfo.category === 'available' ? p.available_units :
                              statusInfo.category === 'sold' ? p.sold_units :
                              statusInfo.category === 'booked' ? p.booked_units :
                              p.blocked_units;
        if (!categoryCount) return false;
      }
    }
    return true;
  });


  useEffect(() => {
    if (loading || filteredProjects.length === 0) return;

    if (pieChartInstance.current) pieChartInstance.current.destroy();
    if (statusChartInstance.current) statusChartInstance.current.destroy();
    if (barChartInstance.current) barChartInstance.current.destroy();

    const pieCtx = pieChartRef.current?.getContext('2d');
    const statusCtx = statusChartRef.current?.getContext('2d');
    const barCtx = barChartRef.current?.getContext('2d');

    if (pieCtx) {
      pieChartInstance.current = new Chart(pieCtx, {
        type: 'doughnut',
        data: {
          labels: ['Available', 'Sold', 'Booked', 'Blocked'],
          datasets: [{
            data: [totalStats.available, totalStats.sold, totalStats.booked, totalStats.blocked],
            backgroundColor: ['#10b981', '#4f46e5', '#eab308', '#ef4444'],
            borderWidth: 0,
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'bottom', labels: { padding: 20, usePointStyle: true } }
          }
        }
      });
    }

    if (statusCtx) {
      const statusCounts: Record<string, number> = {};
      ALL_STATUSES.forEach(s => { statusCounts[s.value] = 0; });
      projects.forEach(p => {
        const counts = p.status_counts;
        if (counts) {
          Object.keys(counts).forEach(status => {
            if (statusCounts[status] !== undefined) {
              statusCounts[status] += counts[status] || 0;
            }
          });
        }
      });

      const sortedStatuses = ALL_STATUSES.filter(s => {
        const count = statusCounts[s.value] || 0;
        return count > 0;
      }).sort((a, b) => (statusCounts[b.value] || 0) - (statusCounts[a.value] || 0));

      statusChartInstance.current = new Chart(statusCtx, {
        type: 'bar',
        data: {
          labels: sortedStatuses.map(s => s.label.length > 20 ? s.label.slice(0, 20) + '...' : s.label),
          datasets: [{
            label: 'Units',
            data: sortedStatuses.map(s => statusCounts[s.value] || 0),
            backgroundColor: sortedStatuses.map(s => s.category === 'available' ? '#10b981' : s.category === 'sold' ? '#4f46e5' : s.category === 'booked' ? '#eab308' : '#ef4444'),
            borderRadius: 4,
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          indexAxis: 'y',
          plugins: { legend: { display: false } },
          scales: { x: { beginAtZero: true }, y: { grid: { display: false } } }
        }
      });
    }

    if (barCtx) {
      const topProjects = [...filteredProjects]
        .sort((a, b) => (b.sold_units || 0) - (a.sold_units || 0))
        .slice(0, 8);

      barChartInstance.current = new Chart(barCtx, {
        type: 'bar',
        data: {
          labels: topProjects.map(p => p.name.length > 15 ? p.name.slice(0, 15) + '...' : p.name),
          datasets: [
            {
              label: 'Available',
              data: topProjects.map(p => p.available_units || 0),
              backgroundColor: '#10b981',
              borderRadius: 4,
            },
            {
              label: 'Sold',
              data: topProjects.map(p => p.sold_units || 0),
              backgroundColor: '#4f46e5',
              borderRadius: 4,
            },
            {
              label: 'Booked',
              data: topProjects.map(p => p.booked_units || 0),
              backgroundColor: '#eab308',
              borderRadius: 4,
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'top', labels: { usePointStyle: true } }
          },
          scales: {
            x: { stacked: true, grid: { display: false } },
            y: { stacked: true, beginAtZero: true }
          }
        }
      });
    }

    return () => {
      if (pieChartInstance.current) pieChartInstance.current.destroy();
      if (statusChartInstance.current) statusChartInstance.current.destroy();
      if (barChartInstance.current) barChartInstance.current.destroy();
    };
  }, [filteredProjects, loading, totalStats, projects]);

  const clearFilters = () => {
    setFilterLocation('');
    setFilterProject('');
    setFilterStatus('');
    setFilterBhk('');
    setFilterFacing('');
    setFilterUnitType('');
    setFilterBlock('');
    setFilterPhase('');
    setFilterFloor('');
    setFilterCarPark('');
    setFilterPlcReason('');
    setFilterUnitNo('');
  };

  const hasFilters = filterLocation || filterProject || filterStatus || filterBhk || filterFacing || filterUnitType || filterBlock || filterPhase || filterFloor || filterCarPark || filterPlcReason || filterUnitNo;


  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = { available: 'Available', sold: 'Sold', booked: 'Booked', blocked: 'Blocked' };
    return labels[status] || status;
  };

  return (
    <AppLayout title="Dashboard" subtitle="Real estate portfolio overview">
      <div className="space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-5">
          <div className="bg-white rounded-xl p-4 sm:p-5 shadow-sm border border-brand-100">
            <div className="flex items-center justify-between mb-2">
              <div className="bg-brand-800 p-2 rounded-lg"><Building2 className="w-4 h-4 text-white" /></div>
              <TrendingUp className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-xl sm:text-2xl font-bold text-brand-900">{loading ? '...' : projects.length}</div>
            <div className="text-xs sm:text-sm text-brand-500 mt-1">Projects</div>
          </div>

          <div className="bg-white rounded-xl p-4 sm:p-5 shadow-sm border border-brand-100">
            <div className="flex items-center justify-between mb-2">
              <div className="bg-emerald-600 p-2 rounded-lg"><Home className="w-4 h-4 text-white" /></div>
            </div>
            <div className="text-xl sm:text-2xl font-bold text-brand-900">{loading ? '...' : totalStats.total.toLocaleString()}</div>
            <div className="text-xs sm:text-sm text-brand-500 mt-1">Total Units</div>
          </div>

          <div className="bg-white rounded-xl p-4 sm:p-5 shadow-sm border border-brand-100">
            <div className="flex items-center justify-between mb-2">
              <div className="bg-emerald-500 p-2 rounded-lg"><CheckCircle className="w-4 h-4 text-white" /></div>
            </div>
            <div className="text-xl sm:text-2xl font-bold text-brand-900">{loading ? '...' : totalStats.available.toLocaleString()}</div>
            <div className="text-xs sm:text-sm text-brand-500 mt-1">Available</div>
          </div>

          <div className="bg-white rounded-xl p-4 sm:p-5 shadow-sm border border-brand-100">
            <div className="flex items-center justify-between mb-2">
              <div className="bg-indigo-600 p-2 rounded-lg"><BarChart3 className="w-4 h-4 text-white" /></div>
            </div>
            <div className="text-xl sm:text-2xl font-bold text-brand-900">{loading ? '...' : totalStats.sold.toLocaleString()}</div>
            <div className="text-xs sm:text-sm text-brand-500 mt-1">Sold</div>
          </div>

          <div className="bg-white rounded-xl p-4 sm:p-5 shadow-sm border border-brand-100">
            <div className="flex items-center justify-between mb-2">
              <div className="bg-yellow-500 p-2 rounded-lg"><Clock className="w-4 h-4 text-white" /></div>
            </div>
            <div className="text-xl sm:text-2xl font-bold text-brand-900">{loading ? '...' : totalStats.booked.toLocaleString()}</div>
            <div className="text-xs sm:text-sm text-brand-500 mt-1">Booked</div>
          </div>

          <div className="bg-white rounded-xl p-4 sm:p-5 shadow-sm border border-brand-100">
            <div className="flex items-center justify-between mb-2">
              <div className="bg-red-500 p-2 rounded-lg"><Clock className="w-4 h-4 text-white" /></div>
            </div>
            <div className="text-xl sm:text-2xl font-bold text-brand-900">{loading ? '...' : totalStats.blocked.toLocaleString()}</div>
            <div className="text-xs sm:text-sm text-brand-500 mt-1">Blocked</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-brand-100">
          <div className="px-6 py-5 border-b border-brand-50 bg-brand-50/20 rounded-t-2xl flex items-center justify-between">
            <h2 className="text-sm font-bold text-brand-900 uppercase tracking-widest flex items-center gap-2">
              <Search className="w-4 h-4 text-brand-500" />
              Search Filters
            </h2>
            {hasFilters && (
              <button 
                onClick={clearFilters} 
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold text-brand-600 hover:bg-brand-50 hover:text-brand-800 transition-all"
              >
                <RotateCcw className="w-3 h-3" />
                Reset
              </button>
            )}
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-y-6 gap-x-5">
              <FilterSelect 
                label="Project" 
                value={filterProject} 
                options={filterOptions.projects} 
                onChange={setFilterProject} 
                placeholder="Select Project"
              />
              <FilterSelect 
                label="BHK Type" 
                value={filterBhk} 
                options={filterOptions.bhk} 
                onChange={setFilterBhk} 
              />
              <FilterSelect 
                label="Facing" 
                value={filterFacing} 
                options={filterOptions.facing} 
                onChange={setFilterFacing} 
              />
              <FilterSelect 
                label="Unit Type" 
                value={filterUnitType} 
                options={filterOptions.unit_type} 
                onChange={setFilterUnitType} 
              />
              <FilterSelect 
                label="Block" 
                value={filterBlock} 
                options={filterOptions.block} 
                onChange={setFilterBlock} 
              />
              <FilterSelect 
                label="Phase" 
                value={filterPhase} 
                options={filterOptions.phase} 
                onChange={setFilterPhase} 
              />
              <FilterSelect 
                label="Floor" 
                value={filterFloor} 
                options={filterOptions.floor} 
                onChange={setFilterFloor} 
              />
              <FilterSelect 
                label="Car Park Type" 
                value={filterCarPark} 
                options={filterOptions.car_park_type} 
                onChange={setFilterCarPark} 
              />
              <FilterSelect 
                label="PLC Reason" 
                value={filterPlcReason} 
                options={filterOptions.plc_reason} 
                onChange={setFilterPlcReason} 
              />
              <FilterSelect 
                label="Unit No" 
                value={filterUnitNo} 
                options={filterOptions.unit_no} 
                onChange={setFilterUnitNo} 
                placeholder="All Units"
              />
              
              <FilterSelect 
                label="Location" 
                value={filterLocation} 
                options={filterOptions.locations} 
                onChange={setFilterLocation} 
                placeholder="Select Location"
              />

              <FilterSelect 
                label="Status Category" 
                value={filterStatus} 
                options={ALL_STATUSES.map(s => ({ id: s.value, name: s.label }))} 
                onChange={setFilterStatus} 
                placeholder="All Status"
              />
            </div>

            <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-brand-50">
              <div className="text-sm text-brand-500">
                Found <span className="font-bold text-brand-900">{filteredProjects.length}</span> matching projects across the portfolio
              </div>
              <div className="flex items-center gap-3">
                {loading && (
                  <div className="flex items-center gap-2 text-xs text-brand-400 font-medium">
                    <div className="w-3 h-3 border-2 border-brand-200 border-t-brand-500 rounded-full animate-spin" />
                    Updating view...
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>


        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-brand-200 border-t-brand-700 rounded-full animate-spin" />
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-brand-100">
            <Building2 className="w-12 h-12 text-brand-300 mx-auto mb-3" />
            <p className="text-brand-600 font-medium">No projects found</p>
            <p className="text-brand-400 text-sm mt-1">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-brand-100">
              <div className="flex items-center gap-2 mb-4">
                <PieChart className="w-5 h-5 text-brand-600" />
                <h3 className="font-semibold text-brand-900">Unit Status Distribution</h3>
              </div>
              <div className="h-[300px]">
                <canvas ref={pieChartRef} />
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-brand-100">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="w-5 h-5 text-brand-600" />
                <h3 className="font-semibold text-brand-900">All Status Breakdown</h3>
              </div>
              <div className="h-[300px]">
                <canvas ref={statusChartRef} />
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-brand-100 lg:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="w-5 h-5 text-brand-600" />
                <h3 className="font-semibold text-brand-900">Top Projects by Sales</h3>
              </div>
              <div className="h-[300px]">
                <canvas ref={barChartRef} />
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
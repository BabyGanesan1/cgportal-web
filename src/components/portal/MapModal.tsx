'use client';
import React, { useState } from 'react';
import { X, MapPin, Globe, Navigation, Layers } from 'lucide-react';

interface MapModalProps {
    isOpen: boolean;
    onClose: () => void;
    property: any;
}

export default function MapModal({ isOpen, onClose, property }: MapModalProps) {
    const [selectedLocation, setSelectedLocation] = useState<string>(
        `${property?.locationData?.name || property?.location}, ${property?.cityData?.name || property?.city}`
    );

    if (!isOpen) return null;

    const primaryLocationName = (property?.locationData?.name || property?.location || '').trim();
    const servicingLocations = property?.serving_locations 
        ? (Array.from(new Set(
            property.serving_locations.split(',')
                .map((s: string) => s.trim())
                .filter((s: string) => s && s.toLowerCase() !== primaryLocationName.toLowerCase())
          )) as string[])
        : [];

    const mainLocation = `${primaryLocationName}, ${property?.cityData?.name || property?.city}`;

    const mapUrl = `https://maps.google.com/maps?q=${encodeURIComponent(selectedLocation)}&t=&z=14&ie=UTF8&iwloc=&output=embed`;

    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, background: 'rgba(5,8,20,0.8)', backdropFilter: 'blur(8px)', fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
            <div style={{ background: '#fff', borderRadius: 24, width: '100%', maxWidth: 1000, height: '80vh', boxShadow: '0 32px 80px rgba(0,0,0,0.4)', overflow: 'hidden', display: 'flex', flexDirection: 'column', animation: 'mapPop 0.3s cubic-bezier(0.34,1.56,0.64,1)' }}>
                
                {/* Header */}
                <div style={{ padding: '20px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', background: '#fff' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 44, height: 44, borderRadius: 14, background: '#fffbeb', border: '1.5px solid #fde68a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <MapPin size={22} style={{ color: '#d97706' }} />
                        </div>
                        <div>
                            <div style={{ fontSize: 18, fontWeight: 800, color: '#1e293b' }}>{property?.project_name} - Location Map</div>
                            <div style={{ fontSize: 13, color: '#64748b' }}>{mainLocation}</div>
                        </div>
                    </div>
                    <button onClick={onClose} style={{ width: 40, height: 40, borderRadius: 12, border: '1px solid #e2e8f0', background: '#fff', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}>
                        <X size={20} />
                    </button>
                </div>

                <div className="map-modal-content" style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
                    {/* Sidebar */}
                    <div className="map-sidebar" style={{ width: 320, borderRight: '1px solid #f1f5f9', background: '#f8fafc', overflowY: 'auto', padding: '20px' }}>
                        <div style={{ marginBottom: 24 }}>
                            <h4 style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: '#94a3b8', marginBottom: 16 }}>Primary Location</h4>
                            <div 
                                onClick={() => setSelectedLocation(mainLocation)}
                                style={{ 
                                    padding: '16px', borderRadius: 16, background: selectedLocation === mainLocation ? '#fff' : 'transparent', 
                                    border: '2px solid ' + (selectedLocation === mainLocation ? '#f59e0b' : 'transparent'),
                                    boxShadow: selectedLocation === mainLocation ? '0 10px 20px rgba(245,158,11,0.1)' : 'none',
                                    cursor: 'pointer', transition: 'all 0.2s'
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <div style={{ width: 32, height: 32, borderRadius: 8, background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Globe size={16} style={{ color: '#d97706' }} />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: 14, fontWeight: 700, color: '#1e293b' }}>Project Site</div>
                                        <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{property?.locationData?.name}</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {servicingLocations.length > 0 && (
                            <div>
                                <h4 style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: '#94a3b8', marginBottom: 16 }}>Servicing Locations</h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                    {servicingLocations.map((loc: string, i: number) => (
                                        <div 
                                            key={i}
                                            onClick={() => setSelectedLocation(`${loc}, ${property?.cityData?.name || property?.city}`)}
                                            style={{ 
                                                padding: '14px', borderRadius: 16, background: selectedLocation.includes(loc) ? '#fff' : 'rgba(255,255,255,0.5)', 
                                                border: '1.5px solid ' + (selectedLocation.includes(loc) ? '#f59e0b' : '#e2e8f0'),
                                                cursor: 'pointer', transition: 'all 0.2s'
                                            }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                <div style={{ width: 28, height: 28, borderRadius: 6, background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    <Navigation size={14} style={{ color: '#10b981' }} />
                                                </div>
                                                <div style={{ fontSize: 13, fontWeight: 600, color: '#334155' }}>{loc}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Map Content */}
                    <div className="map-container" style={{ flex: 1, position: 'relative', background: '#e5e7eb', minHeight: 300 }}>
                        <iframe 
                            width="100%" 
                            height="100%" 
                            frameBorder="0" 
                            style={{ border: 0 }} 
                            src={mapUrl} 
                            allowFullScreen
                        />
                        
                        {/* Map Overlay info */}
                        <div style={{ position: 'absolute', bottom: 20, left: 20, right: 20, maxWidth: 300, background: 'rgba(15,23,42,0.9)', backdropFilter: 'blur(8px)', padding: '12px 20px', borderRadius: 16, border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', gap: 12, boxShadow: '0 20px 40px rgba(0,0,0,0.3)' }}>
                           <div style={{ width: 36, height: 36, borderRadius: 10, background: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                               <Layers size={18} style={{ color: '#0f172a' }} />
                           </div>
                           <div style={{ minWidth: 0 }}>
                               <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600 }}>Viewing</div>
                               <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selectedLocation}</div>
                           </div>
                        </div>
                    </div>
                </div>
            </div>
            <style>{`
                @keyframes mapPop { from { opacity: 0; transform: translateY(20px) scale(0.95); } to { opacity: 1; transform: translateY(0) scale(1); } }
                @media (max-width: 768px) {
                    .map-modal-content { flex-direction: column !important; overflow-y: auto !important; height: auto !important; max-height: 85vh !important; }
                    .map-sidebar { width: 100% !important; border-right: none !important; border-bottom: 1px solid #f1f5f9 !important; height: auto !important; padding: 15px !important; order: 2 !important; }
                    .map-container { position: relative !important; width: 100% !important; height: 350px !important; flex: none !important; order: 1 !important; }
                }
            `}</style>
        </div>
    );
}

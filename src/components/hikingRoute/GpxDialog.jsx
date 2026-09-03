import React, { useEffect, useMemo, useState } from 'react';
import { listGpxFiles } from '../../services/supabase/storageGpx';
import './GpxDialog.css';

// loadList: () => Promise<string[]>  -> elérhető gpx fájlnevek listája
// usedFiles: string[]                -> már felhasznált fájlnevek (zöld kiemelés)
// onSelect: (fileName: string) => void
// onCancel: () => void
export default function GpxDialog({ open, onSelect, onCancel, usedFiles = [] }) {
    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [filter, setFilter] = useState('');
    const [selected, setSelected] = useState(null);

    useEffect(() => {
        if (!open) return;
        setFilter('');
        setSelected(null);

        let cancelled = false;
        setLoading(true);
        Promise.resolve(listGpxFiles())
            .then((list) => {
                if (!cancelled) setFiles(list ?? []);
            })
            .catch((err) => {
                console.error('Hiba a gpx lista betöltésekor:', err);
                if (!cancelled) setFiles([]);
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => { cancelled = true; };
    }, [open]);

    const usedSet = useMemo(() => new Set(usedFiles), [usedFiles]);

    const filteredFiles = useMemo(() => {
        const f = filter.trim().toLowerCase();
        if (!f) return files;
        return files.filter((name) => name.toLowerCase().includes(f));
    }, [files, filter]);

    if (!open) return null;

    const handleOk = () => {
        if (!selected) return;
        onSelect(selected);
    };

    return (
        <div className="gpxDialogOverlay">
            <div className="gpxDialogBox">
                <div className="gpxDialogHeader">GPX fájl kiválasztása {files.length}/{filteredFiles.length}</div>

                <input
                    type="text"
                    className="gpxDialogFilter"
                    placeholder="Szűrés..."
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    autoFocus
                />

                <div className="gpxDialogList">
                    {loading && <div className="gpxDialogEmpty">Betöltés...</div>}
                    {!loading && filteredFiles.length === 0 && (
                        <div className="gpxDialogEmpty">Nincs találat</div>
                    )}
                    {!loading && filteredFiles.map((name) => {
                        const isUsed = usedSet.has(name);
                        const isSelected = selected === name;
                        return (
                            <div
                                key={name}
                                className={
                                    'gpxDialogItem' +
                                    (isSelected ? ' gpxDialogItemSelected' : '') +
                                    (isUsed ? ' gpxDialogItemUsed' : '')
                                }
                                onClick={() => setSelected(name)}
                                onDoubleClick={() => onSelect(name)}
                                title={isUsed ? 'Már fel lett dolgozva' : undefined}
                            >
                                {name}
                            </div>
                        );
                    })}
                </div>

                <div className="gpxDialogFooter">
                    <button className='btn' onClick={onCancel}>
                        Mégse
                    </button>
                    <button
                        className='btn'
                        onClick={handleOk}
                        disabled={!selected}
                    >
                        OK
                    </button>
                </div>
            </div>
        </div>
    );
}
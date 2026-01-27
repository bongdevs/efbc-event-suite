import { useState, useEffect } from '@wordpress/element';
import Toast from '../components/Toast';
import DraggableColumns from '../components/DraggableColumns';

const allPossibleColumns = [
    'First Name','Last Name','Full Name','Badge Name','Email','Phone','Status','Golf Handicap','Club Rentals',
    'Paid','City','State','Zip','Country','Address','Organization',
    'Company','Wednesday Activity','Group Assigned'
];

const fieldKeyMap = {
    "First Name": "firstName",
    "Last Name": "lastName",
    "Full Name": "fullName",
    "Badge Name": "badgeName",
    "Email": "email",
    "Phone": "mobile",
    "Status": "status",
    "Golf Handicap": "golfHandicap",
    "Club Rentals": "clubRentals",
    "Paid": "paid",
    "City": "city",
    "State": "state",
    "Zip": "zipCode",
    "Country": "country",
    "Address": "address",
    "Organization": "organization",
    "Company": "companyType",
    "Group Assigned": "groupAssigned",
    "Wednesday Activity": "wednesdayActivity",
};

const TableBuilder = () => {
    const [events, setEvents] = useState([]);
    const [selectedEventId, setSelectedEventId] = useState(null);
    const [activities, setActivities] = useState([]);
    const [attendees, setAttendees] = useState({});
    const [meta, setMeta] = useState({});
    const [pages, setPages] = useState({});
    const [columns, setColumns] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('All Attendees');
    const [fade, setFade] = useState(true);
    const [toast, setToast] = useState({ message: '', visible: false });
    const [groupNames, setGroupNames] = useState({});

    useEffect(() => {
        fetch(`${efbcData.ajaxUrl}?action=efbc_get_events`)
            .then(res => res.json())
            .then(res => {
                if(!res.success) throw new Error("Failed to load events");
                setEvents(res.data);
                if(res.data.length>0) setSelectedEventId(res.data[0].id);
            })
            .catch(err => { console.error(err); setError("Failed to load events"); });
    }, []);

    const loadEventData = (eventId, force = false, activity = 'All Attendees', page = 1) => {
        if (!eventId) return Promise.resolve();
        setLoading(true);
        const forceParam = force ? '&force=1' : '';

        const attendeesFetch = fetch(`${efbcData.ajaxUrl}?action=efbc_get_attendees&event_id=${eventId}&page=${page}&per_page=${itemsPerPage}${forceParam}${activity && activity !== 'All Attendees' ? `&activity=${encodeURIComponent(activity)}` : ''}&nonce=${efbcData.nonce}`).then(res => res.json());
        const columnsFetch = fetch(`${efbcData.ajaxUrl}?action=efbc_get_saved_columns&nonce=${efbcData.nonce}`).then(res => res.json());

        return Promise.all([attendeesFetch, columnsFetch])
            .then(([attRes, colRes]) => {
                if(!attRes.success) throw new Error("Failed to load attendees");
                const attData = attRes.data.data || [];
                const meta = attRes.data.meta || { total: 0, per_page: itemsPerPage, current_page: page, last_page: 1 };

                setAttendees(prev => ({ ...prev, [activity]: attData }));
                setMeta(prev => ({ ...prev, [activity]: meta }));
                setPages(prev => ({ ...prev, [activity]: meta.current_page }));

                const savedColumns = colRes.success ? colRes.data : {};
                const eventColumns = savedColumns[eventId] || {};

                const selectedEvent = events.find(ev => ev.id===eventId);
                const rawActivities = selectedEvent?.activities || [];
                const eventActivities = rawActivities.map(act => (typeof act === 'string') ? act : (act?.name ?? act?.title ?? String(act))).filter(Boolean);
                setActivities(eventActivities);

                const initialColumns = {};
                eventActivities.forEach(act => {
                    const saved = eventColumns[act] || ['Name','Email','Phone','Status'];
                    initialColumns[act] = saved.map(item => typeof item === 'string' ? item : (item?.name ?? String(item)));
                });
                const savedAll = eventColumns['All Attendees'] || ['Name','Email','Phone','Status'];
                initialColumns['All Attendees'] = savedAll.map(item => typeof item === 'string' ? item : (item?.name ?? String(item)));
                setColumns(initialColumns);
                setLoading(false);
                setCurrentPage(1);
            })
            .catch(err => { console.error(err); setError("Failed to load attendees or columns"); setLoading(false); });
    };

    useEffect(() => {
        if(!selectedEventId) return;
        loadEventData(selectedEventId);
    }, [selectedEventId, events]);

    useEffect(() => {
        const hasGroupColumn = Object.values(columns).some(col => col.includes('Group Assigned'));
        if (!hasGroupColumn) return;

        const allAttendees = Object.values(attendees).flat();
        if (allAttendees.length === 0) return;

        const groupIds = allAttendees
            .map(att => att.groupAssigned)
            .filter(id => id && !groupNames[id]);

        if (groupIds.length === 0) return;

        const fetchGroups = async () => {
            const newGroupNames = {};
            for (const groupId of [...new Set(groupIds)]) {
                try {
                    const response = await fetch(`https://server.efbcconference.org/api/groups/${groupId}`);
                    const data = await response.json();
                    newGroupNames[groupId] = data.data?.name || '';
                } catch (error) {
                    console.error(`Failed to fetch group ${groupId}:`, error);
                    newGroupNames[groupId] = '';
                }
            }
            setGroupNames(prev => ({...prev, ...newGroupNames}));
        };

        fetchGroups();
    }, [attendees, columns]);

    const showToast = (msg) => { setToast({ message: msg, visible: true }); setTimeout(()=>setToast({ message:'', visible:false }),3000); };

    // refresh for current active tab
    const refreshActive = () => {
        if (!selectedEventId) return;
        loadEventData(selectedEventId, true, activeTab, 1).then(() => showToast('Refreshed attendees'), () => showToast('Failed refreshing attendees'));
    };
    const saveColumns = (activity) => {
        const formData = new FormData();
        formData.append('action', 'efbc_save_columns');
        formData.append('event_id', selectedEventId);
        formData.append('activity', activity);
        formData.append('columns', JSON.stringify(columns[activity]));
        formData.append('nonce', efbcData.nonce);
        
        fetch(efbcData.ajaxUrl, {
            method: 'POST',
            body: formData
        })
        .then(res => res.json())
        .then(res => res.success ? showToast(`Columns saved for ${activity}`) : showToast(`Failed: ${res.data || 'Unknown error'}`))
        .catch(err => showToast(`Failed: ${err.message}`));
    };

    const handleDragEnd = (result, activity) => {
        if(!result.destination) return;
        const newCols = Array.from(columns[activity]);
        const [removed] = newCols.splice(result.source.index,1);
        newCols.splice(result.destination.index,0,removed);
        setColumns(prev=>({...prev, [activity]: newCols}));
    };

    const addColumn = (activity,col)=>{ if(!columns[activity].includes(col)) setColumns(prev=>({...prev,[activity]:[...prev[activity],col]})); };
    const removeColumn = (activity,col)=>{ setColumns(prev=>({...prev,[activity]:prev[activity].filter(c=>c!==col)})); };

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const renderTable = (title, tableAttendees, activityKey) => {
        const col = columns[activityKey] || [];
        const availableCols = allPossibleColumns.filter(c=>!col.includes(c));

        const currentItems = tableAttendees || [];
        const metaFor = meta[activityKey] || { total: currentItems.length, per_page: itemsPerPage, current_page: pages[activityKey] || 1, last_page: 1 };
        const totalPages = metaFor.last_page || 1;
        const currentPageFor = pages[activityKey] || metaFor.current_page || 1;

        return (
            <div key={activityKey} style={{
                marginBottom:'30px', padding:'15px', border:'1px solid #ddd', borderRadius:'8px',
                boxShadow:'0 2px 6px rgba(0,0,0,0.05)', opacity:fade?1:0, transform:fade?'translateY(0)':'translateY(15px)',
                transition:'all 0.3s ease'
            }}>
                <h3>{title}</h3>
                <div className="efbc-admin-table-wrapper">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <div>Showing <strong>{currentItems.length}</strong> of <strong>{metaFor.total}</strong> attendees</div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button className="button" onClick={() => loadEventData(selectedEventId, true, activityKey, 1)}>Refresh</button>
                        </div>
                    </div>

                    <table className="efbc-admin-attendees-table" style={{ width:'100%', marginTop:'10px' }}>
                        <thead><tr>{col.map(c=><th key={c} className="efbc-table-header-cell">{c}</th>)}</tr></thead>
                        <tbody>
                            {currentItems.map((att,idx)=>(
                                <tr key={att.id||idx} className={idx % 2 === 0 ? 'efbc-row-odd' : 'efbc-row-even'}>{col.map((c,i)=>{
                                    let cellValue = att[fieldKeyMap[c]];
                                    // Handle Full Name by combining firstName and lastName
                                    if (c === 'Full Name') {
                                        cellValue = (att.firstName || '') + (att.lastName ? ' ' + att.lastName : '');
                                    }
                                    if (c === 'Paid') cellValue = cellValue ? 'Yes' : 'No';
                                    if (c === 'Group Assigned') {
                                        if (!cellValue) cellValue = '';
                                        else cellValue = groupNames[cellValue] || '';
                                    }
                                    return <td key={i} className="efbc-table-cell">{cellValue ?? ''}</td>;
                                })}</tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div style={{ marginTop:'15px' }}>
                    <h4>Reorder Columns</h4>
                    <DraggableColumns columns={col} onDragEnd={res=>handleDragEnd(res,activityKey)} onRemove={c=>removeColumn(activityKey,c)} />
                    {availableCols.length>0 && (
                        <select defaultValue="" onChange={e=>{ addColumn(activityKey,e.target.value); e.target.value=''; }} style={{ marginTop:'10px' }}>
                            <option value="" disabled>Add column...</option>
                            {availableCols.map(c=><option key={c} value={c}>{c}</option>)}
                        </select>
                    )}
                    <button className="button button-primary" style={{ marginTop:'10px' }} onClick={()=>saveColumns(activityKey)}>Save Column Layout</button>
                </div>
                {totalPages > 1 && (
                    <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'center' }}>
                        <button onClick={() => loadEventData(selectedEventId, false, activityKey, Math.max(currentPageFor - 1, 1))} disabled={currentPageFor === 1} className="button">Previous</button>
                        {[...Array(totalPages)].map((_, i) => (
                            <button key={i + 1} onClick={() => loadEventData(selectedEventId, false, activityKey, i + 1)} className={`button ${currentPageFor === i + 1 ? 'button-primary' : ''}`} style={{ margin: '0 5px' }}>
                                {i + 1}
                            </button>
                        ))}
                        <button onClick={() => loadEventData(selectedEventId, false, activityKey, Math.min(currentPageFor + 1, totalPages))} disabled={currentPageFor === totalPages} className="button">Next</button>
                    </div>
                )}
            </div>
        );
    };

    if(loading) return <p>Loading...</p>;
    if(error) return <p>{error}</p>;

    return (
        <div>
            <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', alignItems: 'center' }}>
                <label>Select Event: </label>
                <select value={selectedEventId||""} onChange={e=>setSelectedEventId(Number(e.target.value))}>
                    {events.map(ev=><option key={ev.id} value={ev.id}>{ev.name}</option>)}
                </select>
            </div>

            <div style={{ display:'flex', gap:'8px', marginBottom:'20px', flexWrap:'wrap' }}>
                {['All Attendees', ...activities].map(tab=>(
                    <button key={tab} onClick={()=>{
                        if(activeTab!==tab){ setFade(false); setTimeout(()=>{ setActiveTab(tab); setFade(true); },100); }
                        // if we don't have data for this tab yet, fetch first page
                        if (!attendees[tab] && selectedEventId) {
                            loadEventData(selectedEventId, false, tab, 1);
                        }
                    }} style={{
                        padding:'6px 12px', border:'1px solid #ddd', borderRadius:'4px',
                        background: activeTab===tab?'#0073aa':'#f3f3f3',
                        color: activeTab===tab?'#fff':'#000',
                        cursor:'pointer'
                    }}>{tab}</button>
                ))}
            </div>

            {activeTab==='All Attendees' && renderTable('All Attendees',attendees['All Attendees']||[], 'All Attendees')}
            {activities.map(activity=>activeTab===activity && renderTable(`${activity} Attendees`,attendees[activity]||[],activity))}

            <Toast visible={toast.visible} message={toast.message} />
        </div>
    );
};

export default TableBuilder;

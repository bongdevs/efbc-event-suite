import { useState, useEffect } from '@wordpress/element';
import Toast from '../components/Toast';
import DraggableColumns from '../components/DraggableColumns';

const allPossibleColumns = [
    'Name','Email','Phone','Status','Golf Handicap','Club Rentals',
    'Paid','City','State','Zip','Country','Address','Organization',
    'Company','Group','Wednesday Activity'
];

const fieldKeyMap = {
    "Name": "badgeName",
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
    "Group": "groupAssigned",
    "Wednesday Activity": "wednesdayActivity",
};

const TableBuilder = () => {
    const [events, setEvents] = useState([]);
    const [selectedEventId, setSelectedEventId] = useState(null);
    const [activities, setActivities] = useState([]);
    const [attendees, setAttendees] = useState([]);
    const [columns, setColumns] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('All Attendees');
    const [fade, setFade] = useState(true);
    const [toast, setToast] = useState({ message: '', visible: false });

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

    useEffect(() => {
        if(!selectedEventId) return;
        setLoading(true);

        const attendeesFetch = fetch(`${efbcData.ajaxUrl}?action=efbc_get_attendees&event_id=${selectedEventId}`).then(res => res.json());
        const columnsFetch = fetch(`${efbcData.ajaxUrl}?action=efbc_get_saved_columns`).then(res => res.json());

        Promise.all([attendeesFetch, columnsFetch])
            .then(([attRes, colRes]) => {
                if(!attRes.success) throw new Error("Failed to load attendees");
                setAttendees(attRes.data);

                const savedColumns = colRes.success ? colRes.data : {};
                const eventColumns = savedColumns[selectedEventId] || {};

                const selectedEvent = events.find(ev => ev.id===selectedEventId);
                const eventActivities = selectedEvent?.activities || [];
                setActivities(eventActivities);

                const initialColumns = {};
                eventActivities.forEach(act => {
                    initialColumns[act] = eventColumns[act] || ['Name','Email','Phone','Status'];
                });
                initialColumns['All Attendees'] = eventColumns['All Attendees'] || ['Name','Email','Phone','Status'];
                setColumns(initialColumns);
                setLoading(false);
            })
            .catch(err => { console.error(err); setError("Failed to load attendees or columns"); setLoading(false); });
    }, [selectedEventId, events]);

    const showToast = (msg) => { setToast({ message: msg, visible: true }); setTimeout(()=>setToast({ message:'', visible:false }),3000); };

    const saveColumns = (activity) => {
        const data = { action:'efbc_save_columns', event_id:selectedEventId, activity, columns:columns[activity] };
        fetch(`${efbcData.ajaxUrl}?action=efbc_save_columns`, {
            method:'POST', body: JSON.stringify(data), headers:{ 'Content-Type':'application/json' }
        })
        .then(res=>res.json())
        .then(res=>res.success ? showToast(`Columns saved for ${activity}`) : showToast(`Failed: ${res.data || 'Unknown error'}`))
        .catch(err=>showToast(`Failed: ${err.message}`));
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

    const renderTable = (title, tableAttendees, activityKey) => {
        const col = columns[activityKey] || [];
        const availableCols = allPossibleColumns.filter(c=>!col.includes(c));

        return (
            <div key={activityKey} style={{
                marginBottom:'30px', padding:'15px', border:'1px solid #ddd', borderRadius:'8px',
                boxShadow:'0 2px 6px rgba(0,0,0,0.05)', opacity:fade?1:0, transform:fade?'translateY(0)':'translateY(15px)',
                transition:'all 0.3s ease'
            }}>
                <h3>{title}</h3>
                <div className="efbc-admin-table-wrapper">
                    <table className="efbc-admin-attendees-table" style={{ width:'100%', marginTop:'10px' }}>
                        <thead><tr>{col.map(c=><th key={c} className="efbc-table-header-cell">{c}</th>)}</tr></thead>
                        <tbody>
                            {tableAttendees.map((att,idx)=>(
                                <tr key={att.id} className={idx % 2 === 0 ? 'efbc-row-odd' : 'efbc-row-even'}>{col.map((c,i)=><td key={i} className="efbc-table-cell">{c==='Paid'?att[fieldKeyMap[c]]?'Yes':'No':(att[fieldKeyMap[c]]??'')}</td>)}</tr>
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
            </div>
        );
    };

    if(loading) return <p>Loading...</p>;
    if(error) return <p>{error}</p>;

    return (
        <div>
            <div style={{ marginBottom: '20px' }}>
                <label>Select Event: </label>
                <select value={selectedEventId||""} onChange={e=>setSelectedEventId(Number(e.target.value))}>
                    {events.map(ev=><option key={ev.id} value={ev.id}>{ev.name}</option>)}
                </select>
            </div>

            <div style={{ display:'flex', gap:'8px', marginBottom:'20px', flexWrap:'wrap' }}>
                {['All Attendees', ...activities].map(tab=>(
                    <button key={tab} onClick={()=>{
                        if(activeTab!==tab){ setFade(false); setTimeout(()=>{ setActiveTab(tab); setFade(true); },100); }
                    }} style={{
                        padding:'6px 12px', border:'1px solid #ddd', borderRadius:'4px',
                        background: activeTab===tab?'#0073aa':'#f3f3f3',
                        color: activeTab===tab?'#fff':'#000',
                        cursor:'pointer'
                    }}>{tab}</button>
                ))}
            </div>

            {activeTab==='All Attendees' && renderTable('All Attendees',attendees,'All Attendees')}
            {activities.map(activity=>activeTab===activity && renderTable(`${activity} Attendees`,attendees.filter(a=>a.wednesdayActivity===activity),activity))}

            <Toast visible={toast.visible} message={toast.message} />
        </div>
    );
};

export default TableBuilder;

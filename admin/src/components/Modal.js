import { useState, useEffect } from '@wordpress/element';

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
    "Group Assigned": "groupAssigned",
    "Wednesday Activity": "wednesdayActivity",
};

const Modal = ({ open, title, loading, data, onClose, eventId, activity }) => {
    const [columns, setColumns] = useState(['Name', 'Email', 'Phone', 'Status']);
    const [groupNames, setGroupNames] = useState({});

    useEffect(() => {
        if (!open || !eventId) return;

        // Fetch saved columns for this event/activity
        fetch(`${efbcData.ajaxUrl}?action=efbc_get_saved_columns`)
            .then(res => res.json())
            .then(res => {
                if (res.success && res.data[eventId]) {
                    const activityKey = activity || 'All Attendees';
                    const savedCols = res.data[eventId][activityKey];
                    if (savedCols) {
                        setColumns(savedCols);
                    }
                }
            })
            .catch(err => console.error('Failed to load saved columns:', err));
    }, [open, eventId, activity]);

    useEffect(() => {
        if (!columns.includes('Group Assigned') || data.length === 0) return;
        
        const groupIds = data
            .map(att => att.groupAssigned)
            .filter(id => id && !groupNames[id]);
        
        if (groupIds.length === 0) return;

        const fetchGroups = async () => {
            const newGroupNames = {};
            for (const groupId of [...new Set(groupIds)]) {
                try {
                    const response = await fetch(`https://server.efbcconference.org/api/groups/${groupId}`);
                    const res = await response.json();
                    newGroupNames[groupId] = res.data?.name || 'Unknown';
                } catch (error) {
                    console.error(`Failed to fetch group ${groupId}:`, error);
                    newGroupNames[groupId] = 'Unknown';
                }
            }
            setGroupNames(prev => ({...prev, ...newGroupNames}));
        };
        
        fetchGroups();
    }, [data, columns]);

    if (!open) return null;

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.45)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 9999
        }}>
            <div style={{
                background: '#fff',
                padding: '22px',
                borderRadius: '10px',
                width: '85%',
                maxWidth: '850px',
                maxHeight: '80%',
                overflow: 'auto',
                position: 'relative'
            }}>
                <h2>{title} - Attendees</h2>
                <button className="button" style={{ position: 'absolute', top: '12px', right: '12px' }} onClick={onClose}>
                    Close
                </button>

                {loading ? <p>Loading...</p> : data.length > 0 ? (
                    <div className="efbc-admin-table-wrapper">
                        <table className="efbc-admin-attendees-table">
                            <thead>
                                <tr>
                                    {columns.map(col => (
                                        <th key={col} className="efbc-table-header-cell">{col}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {data.map((att, idx) => (
                                    <tr key={idx} className={idx % 2 === 0 ? 'efbc-row-odd' : 'efbc-row-even'}>
                                        {columns.map((col, i) => {
                                            const key = fieldKeyMap[col];
                                            let value = key && att[key] ? att[key] : '';
                                            if (col === 'Paid') value = att.paid ? 'Yes' : 'No';
                                            if (col === 'Group Assigned') value = groupNames[att.groupAssigned] || (att.groupAssigned ? 'Loading...' : 'Unassigned');
                                            return <td key={i} className="efbc-table-cell">{value}</td>;
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : <p>No attendees found.</p>}
            </div>
        </div>
    );
};

export default Modal;

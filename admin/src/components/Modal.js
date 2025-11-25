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
    "Group": "groupAssigned",
    "Wednesday Activity": "wednesdayActivity",
};

const Modal = ({ open, title, loading, data, onClose, eventId, activity }) => {
    const [columns, setColumns] = useState(['Name', 'Email', 'Phone', 'Status']);

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

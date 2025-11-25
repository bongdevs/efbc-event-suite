import { useState, useEffect } from '@wordpress/element';
import Toast from '../components/Toast';
import Modal from '../components/Modal';

const EventSuiteApp = () => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedActivity, setSelectedActivity] = useState({});
    const [attendeesData, setAttendeesData] = useState([]);
    const [loadingAttendees, setLoadingAttendees] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [modalTitle, setModalTitle] = useState('');

    // Toast
    const [toastMessage, setToastMessage] = useState('');
    const [toastVisible, setToastVisible] = useState(false);

    const showToast = (msg) => {
        setToastMessage(msg);
        setToastVisible(true);
        setTimeout(() => setToastVisible(false), 1800);
    };

    useEffect(() => {
        fetch(`${efbcData.ajaxUrl}?action=efbc_get_events`)
            .then(res => res.json())
            .then(res => {
                if (res.success) setEvents(res.data);
                else setError(res.data || 'Failed to load events');
                setLoading(false);
            })
            .catch(err => {
                setError('Failed to load events: ' + err.message);
                setLoading(false);
            });
    }, []);

    const fetchAttendees = (eventId, activity = '', eventName = '') => {
        setLoadingAttendees(true);
        setModalTitle(eventName);
        setModalOpen(true);

        fetch(`${efbcData.ajaxUrl}?action=efbc_get_attendees&event_id=${eventId}`)
            .then(res => res.json())
            .then(res => {
                if (!res.success) throw new Error(res.data || 'Failed to fetch attendees');

                let data = res.data || [];
                if (activity) {
                    data = data.filter(att =>
                        att.wednesdayActivity &&
                        att.wednesdayActivity.toLowerCase().trim() === activity.toLowerCase().trim()
                    );
                }

                setAttendeesData(data);
                setLoadingAttendees(false);
            })
            .catch(err => {
                setAttendeesData([]);
                setLoadingAttendees(false);
                showToast('Failed to load attendees');
                console.error(err);
            });
    };

    const copyShortcode = (eventId, activity = '') => {
        const shortcode =
            activity
                ? `[efbc_attendees event_id="${eventId}" activity="${activity}"]`
                : `[efbc_attendees event_id="${eventId}"]`;

        navigator.clipboard.writeText(shortcode)
            .then(() => showToast(`Copied: ${shortcode}`))
            .catch(() => showToast('Failed to copy shortcode'));
    };

    if (loading) return <p>Loading events...</p>;
    if (error) return <p>{error}</p>;

    return (
        <div style={{ position: 'relative', paddingBottom: '40px' }}>
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill,minmax(320px,1fr))',
                gap: '20px',
                padding: '10px'
            }}>
                {events.map(event => (
                    <div key={event.id} style={{
                        background: '#fff',
                        border: '1px solid #ddd',
                        borderRadius: '8px',
                        padding: '18px',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
                    }}>
                        <h3>{event.name}</h3>
                        <p><strong>Date:</strong> {new Date(event.date).toLocaleDateString()}</p>
                        <p><strong>Location:</strong> {event.location}</p>
                        <p><strong>Activities:</strong> {event.activities.join(', ')}</p>

                        {event.activities.length > 0 && (
                            <select
                                value={selectedActivity[event.id] || ''}
                                onChange={e =>
                                    setSelectedActivity(prev => ({
                                        ...prev,
                                        [event.id]: e.target.value
                                    }))
                                }
                                style={{ width: '100%', padding: '8px', margin: '8px 0' }}
                            >
                                <option value="">-- Select Activity (optional) --</option>
                                {event.activities.map(act => <option key={act} value={act}>{act}</option>)}
                            </select>
                        )}

                        <div style={{ display: 'flex', gap: '10px', marginBottom: '8px' }}>
                            <code style={{ background: '#f8f8f8', padding: '8px', borderRadius: '5px', flexGrow: 1 }}>
                                {selectedActivity[event.id]
                                    ? `[efbc_attendees event_id="${event.id}" activity="${selectedActivity[event.id]}"]`
                                    : `[efbc_attendees event_id="${event.id}"]`}
                            </code>

                            <button
                                className="button"
                                onClick={() => copyShortcode(event.id, selectedActivity[event.id] || '')}
                            >
                                Copy
                            </button>
                        </div>

                        <button
                            className="button button-primary"
                            style={{ width: '100%' }}
                            onClick={() => fetchAttendees(event.id, selectedActivity[event.id] || '', event.name)}
                        >
                            Preview Attendees
                        </button>
                    </div>
                ))}
            </div>

            <Modal
                open={modalOpen}
                title={modalTitle}
                loading={loadingAttendees}
                data={attendeesData}
                onClose={() => setModalOpen(false)}
                eventId={events.find(e => e.name === modalTitle)?.id}
                activity={selectedActivity[events.find(e => e.name === modalTitle)?.id] || ''}
            />

            <Toast visible={toastVisible} message={toastMessage} />
        </div>
    );
};

export default EventSuiteApp;

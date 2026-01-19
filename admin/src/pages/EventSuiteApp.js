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
    const [modalPage, setModalPage] = useState(1);
    const [modalLastPage, setModalLastPage] = useState(1);
    const [modalTotal, setModalTotal] = useState(0);

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
                if (res.success) {
                    const normalized = (res.data || []).map(ev => ({
                        ...ev,
                        activities: (ev.activities || []).map(a => typeof a === 'string' ? a : (a?.name ?? a?.title ?? String(a)))
                    }));
                    setEvents(normalized);
                }
                else setError(res.data || 'Failed to load events');
                setLoading(false);
            })
            .catch(err => {
                setError('Failed to load events: ' + err.message);
                setLoading(false);
            });
    }, []);

    const fetchAttendees = (eventId, activity = '', eventName = '', page = 1, force = false) => {
        setLoadingAttendees(true);
        setModalTitle(eventName);
        setModalOpen(true);
        setModalPage(page);

        const params = new URLSearchParams({ action: 'efbc_get_attendees', event_id: eventId, page: String(page), per_page: '10', nonce: efbcData.nonce });
        if (activity) params.set('activity', activity);
        if (force) params.set('force', '1');

        fetch(`${efbcData.ajaxUrl}?${params.toString()}`)
            .then(res => res.json())
            .then(res => {
                if (!res.success) throw new Error(res.data || 'Failed to fetch attendees');

                const data = res.data.data || [];
                const meta = res.data.meta || { total: 0, per_page: 20, current_page: page, last_page: 1 };

                setAttendeesData(data);
                setModalPage(meta.current_page || 1);
                setModalLastPage(meta.last_page || 1);
                setModalTotal(meta.total || 0);
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
                                {event.activities.map(act => <option key={`${event.id}-${String(act)}`} value={String(act)}>{String(act)}</option>)}
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
                page={modalPage}
                lastPage={modalLastPage}
                total={modalTotal}
                onPageChange={(newPage) => {
                    const eventId = events.find(e => e.name === modalTitle)?.id;
                    const activity = selectedActivity[eventId] || '';
                    if (eventId) fetchAttendees(eventId, activity, modalTitle, newPage);
                }}
                onRefresh={() => {
                    const eventId = events.find(e => e.name === modalTitle)?.id;
                    const activity = selectedActivity[eventId] || '';
                    if (eventId) fetchAttendees(eventId, activity, modalTitle, 1, true);
                }}
            />

            <Toast visible={toastVisible} message={toastMessage} />
        </div>
    );
};

export default EventSuiteApp;

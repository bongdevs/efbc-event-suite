const Toast = ({ visible, message }) => {
    if (!visible) return null;

    return (
        <div style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: '#111',
            color: '#fff',
            padding: '18px 32px',
            borderRadius: '12px',
            fontSize: '15px',
            zIndex: 10000
        }}>
            {message}
        </div>
    );
};

export default Toast;

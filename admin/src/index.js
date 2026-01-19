import { createRoot } from 'react-dom/client';
import EventSuiteApp from './pages/EventSuiteApp';
import TableBuilder from './table-builder/table-builder';

document.addEventListener("DOMContentLoaded", () => {
    const eventRoot = document.getElementById("efbc-event-suite-app");
    if (eventRoot) {
        createRoot(eventRoot).render(<EventSuiteApp />);
    }

    const tableRoot = document.getElementById("efbc-table-builder-app");
    if (tableRoot) {
        createRoot(tableRoot).render(<TableBuilder />);
    }
});

import { render } from '@wordpress/element';
import EventSuiteApp from './pages/EventSuiteApp';
import TableBuilder from './table-builder/table-builder';

document.addEventListener("DOMContentLoaded", () => {
    const eventRoot = document.getElementById("efbc-event-suite-app");
    if (eventRoot) render(<EventSuiteApp />, eventRoot);

    const tableRoot = document.getElementById("efbc-table-builder-app");
    if (tableRoot) render(<TableBuilder />, tableRoot);
});

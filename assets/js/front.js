document.addEventListener("DOMContentLoaded", function () {
    // For each table wrapper
    document.querySelectorAll('.efbc-attendees-table-wrapper').forEach(wrapper => {
        const table = wrapper.querySelector('table');
        const searchInput = wrapper.querySelector('.efbc-table-search');
        if (!table || !searchInput) return;

        // -------------------------------
        // Search functionality
        // -------------------------------
        searchInput.addEventListener('keyup', function () {
            const filter = this.value.toLowerCase();
            const rows = table.querySelectorAll('tbody tr');
            rows.forEach(row => {
                const text = row.textContent.toLowerCase();
                row.style.display = text.includes(filter) ? '' : 'none';
            });
        });

        // -------------------------------
        // Sorting functionality
        // -------------------------------
        const headers = table.querySelectorAll('th');
        headers.forEach((header, index) => {
            let asc = true;
            header.addEventListener('click', function () {
                const tbody = table.querySelector('tbody');
                const rows = Array.from(tbody.querySelectorAll('tr'));

                // Remove all asc/desc classes from this table only
                headers.forEach(h => h.classList.remove('asc', 'desc'));

                rows.sort((a, b) => {
                    const cellA = a.children[index].textContent.trim().toLowerCase();
                    const cellB = b.children[index].textContent.trim().toLowerCase();

                    if (cellA < cellB) return asc ? -1 : 1;
                    if (cellA > cellB) return asc ? 1 : -1;
                    return 0;
                });

                rows.forEach(row => tbody.appendChild(row));

                // Add sort class to header
                header.classList.add(asc ? 'asc' : 'desc');

                asc = !asc;
            });
        });
    });
});

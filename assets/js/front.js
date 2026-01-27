document.addEventListener("DOMContentLoaded", function () {
    console.log('Front.js DOMContentLoaded - efbcData:', typeof efbcData !== 'undefined' ? efbcData : 'NOT DEFINED');
    
    // For each table wrapper
    document.querySelectorAll('.efbc-attendees-table-wrapper').forEach(wrapper => {
        console.log('Found table wrapper:', wrapper);
        const table = wrapper.querySelector('table');
        const searchInput = wrapper.querySelector('.efbc-table-search');
        if (!table || !searchInput) return;

        // If this wrapper has server-side pagination data, use AJAX-based paging
        const eventId = wrapper.getAttribute('data-efbc-event-id');
        const activity = (wrapper.getAttribute('data-efbc-activity') || '').trim();
        const perPage = parseInt(wrapper.getAttribute('data-efbc-per-page') || '20', 10);
        const paginationContainer = wrapper.querySelector('.efbc-frontend-pagination');

        const renderRows = (rows, columns) => {
            const tbody = table.querySelector('tbody');
            tbody.innerHTML = '';
            rows.forEach(att => {
                const tr = document.createElement('tr');
                columns.forEach(col => {
                    const key = colToKey[col] || '';
                    let value = key && att[key] ? att[key] : '';
                    // Handle Full Name by combining firstName and lastName
                    if (col === 'Full Name') {
                        value = (att.firstName || '') + (att.lastName ? ' ' + att.lastName : '');
                    }
                    if (col === 'Paid') value = att.paid ? 'Yes' : 'No';
                    if (col === 'Group Assigned') value = att.groupAssigned ? (att.groupAssigned_name || '') : '';
                    const td = document.createElement('td');
                    td.textContent = value ?? '';
                    tr.appendChild(td);
                });
                tbody.appendChild(tr);
            });
        };

        // Build columns map by reading table header
        const columns = Array.from(table.querySelectorAll('thead th')).map(th => th.textContent.trim());
        const colToKey = {
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

        if ( eventId ) {
            // AJAX-driven pagination
            let currentPage = parseInt(wrapper.getAttribute('data-efbc-current-page') || '1', 10);
            let lastPage = parseInt(wrapper.getAttribute('data-efbc-last-page') || '1', 10);
            
            // Debug: check if efbcData is available
            if ( typeof efbcData === 'undefined' || !efbcData.ajaxUrl ) {
                console.error('efbcData.ajaxUrl is not available', efbcData);
                return;
            }

            const buildPagination = () => {
                if (!paginationContainer) {
                    console.error('Pagination container not found');
                    return;
                }
                paginationContainer.innerHTML = '';
                paginationContainer.className = 'efbc-frontend-pagination';

                // Previous button
                const prev = document.createElement('button');
                prev.className = 'efbc-pagination-btn nav-btn';
                prev.innerHTML = '← Previous';
                prev.disabled = currentPage === 1;
                prev.onclick = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    loadPage(currentPage - 1);
                    return false;
                };
                paginationContainer.appendChild(prev);

                // Calculate which page buttons to show (smart pagination)
                const maxVisible = 5;
                let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
                let endPage = Math.min(lastPage, startPage + maxVisible - 1);
                if (endPage - startPage + 1 < maxVisible) {
                    startPage = Math.max(1, endPage - maxVisible + 1);
                }

                // First page button and ellipsis
                if (startPage > 1) {
                    const firstBtn = document.createElement('button');
                    firstBtn.className = 'efbc-pagination-btn';
                    firstBtn.textContent = '1';
                    firstBtn.onclick = (e) => {
                        e.preventDefault();
                        loadPage(1);
                        return false;
                    };
                    paginationContainer.appendChild(firstBtn);

                    if (startPage > 2) {
                        const ellipsis = document.createElement('span');
                        ellipsis.className = 'efbc-pagination-separator';
                        ellipsis.textContent = '...';
                        paginationContainer.appendChild(ellipsis);
                    }
                }

                // Page number buttons
                for (let i = startPage; i <= endPage; i++) {
                    const btn = document.createElement('button');
                    btn.className = 'efbc-pagination-btn' + (i === currentPage ? ' active' : '');
                    btn.textContent = String(i);
                    btn.onclick = (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        loadPage(i);
                        return false;
                    };
                    paginationContainer.appendChild(btn);
                }

                // Last page button and ellipsis
                if (endPage < lastPage) {
                    if (endPage < lastPage - 1) {
                        const ellipsis = document.createElement('span');
                        ellipsis.className = 'efbc-pagination-separator';
                        ellipsis.textContent = '...';
                        paginationContainer.appendChild(ellipsis);
                    }

                    const lastBtn = document.createElement('button');
                    lastBtn.className = 'efbc-pagination-btn';
                    lastBtn.textContent = String(lastPage);
                    lastBtn.onclick = (e) => {
                        e.preventDefault();
                        loadPage(lastPage);
                        return false;
                    };
                    paginationContainer.appendChild(lastBtn);
                }

                // Next button
                const next = document.createElement('button');
                next.className = 'efbc-pagination-btn nav-btn';
                next.innerHTML = 'Next →';
                next.disabled = currentPage === lastPage;
                next.onclick = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    loadPage(currentPage + 1);
                    return false;
                };
                paginationContainer.appendChild(next);

                console.log('Professional pagination built');
            };

            // Cache for prefetched pages to avoid duplicate requests
            const pageCache = {};

            const buildFetchUrl = (pageNum) => {
                const params = new URLSearchParams({ action: 'efbc_get_attendees_public', event_id: eventId, page: String(pageNum), per_page: String(perPage) });
                if (activity) params.set('activity', activity);
                if (typeof efbcData !== 'undefined' && efbcData.nonce) {
                    params.set('nonce', efbcData.nonce);
                }
                return `${efbcData.ajaxUrl}?${params.toString()}`;
            };

            // Prefetch pages in the background (without blocking UI)
            const prefetchPages = (pageNum) => {
                const pagesToPrefetch = [pageNum + 1, pageNum + 2];
                pagesToPrefetch.forEach(p => {
                    if (p > 0 && p <= lastPage && !pageCache[p]) {
                        console.log('Prefetching page:', p);
                        fetch(buildFetchUrl(p))
                            .then(res => res.json())
                            .then(res => {
                                if (res.success) {
                                    pageCache[p] = res.data;
                                    console.log('Prefetch complete for page:', p);
                                }
                            })
                            .catch(err => console.log('Prefetch failed for page:', p, err));
                    }
                });
            };

            const loadPage = (page) => {
                currentPage = Math.max(1, Math.min(page, lastPage));

                // Check if page is already cached from prefetch
                if (pageCache[currentPage]) {
                    console.log('Using cached prefetch for page:', currentPage);
                    const res = pageCache[currentPage];
                    const data = res.data || [];
                    const meta = res.meta || { total: 0, per_page: perPage, current_page: currentPage, last_page: 1 };
                    currentPage = meta.current_page || currentPage;
                    lastPage = meta.last_page || lastPage;

                    renderRows(data, columns);
                    buildPagination();
                    prefetchPages(currentPage); // Prefetch next pages
                    return;
                }

                console.log('Loading page:', currentPage, 'URL:', buildFetchUrl(currentPage));

                fetch(buildFetchUrl(currentPage))
                    .then(res => res.json())
                    .then(res => {
                        console.log('AJAX response:', res);
                        if (!res.success) throw new Error(res.data || 'Failed to fetch attendees');
                        const data = res.data.data || [];
                        const meta = res.data.meta || { total: 0, per_page: perPage, current_page: currentPage, last_page: 1 };
                        currentPage = meta.current_page || currentPage;
                        lastPage = meta.last_page || lastPage;

                        renderRows(data, columns);
                        buildPagination();
                        
                        // Prefetch next 2 pages in background
                        prefetchPages(currentPage);
                    })
                    .catch(err => console.error('Failed to load attendees page:', err));
            };

            // initial render uses existing tbody content if present, otherwise load first page
            const initialRows = table.querySelectorAll('tbody tr');
            if (initialRows.length === 0) {
                loadPage(currentPage);
            } else {
                buildPagination();
            }
            
            console.log('Pagination setup complete - eventId:', eventId, 'currentPage:', currentPage, 'lastPage:', lastPage);

            // simple search/filter over current page
            searchInput.addEventListener('keyup', function () {
                const filter = this.value.toLowerCase();
                const rows = table.querySelectorAll('tbody tr');
                rows.forEach(row => {
                    const text = row.textContent.toLowerCase();
                    row.style.display = text.includes(filter) ? '' : 'none';
                });
            });

            // sorting per page
            const headers = table.querySelectorAll('th');
            const sortState = {}; // Track sort state per column
            headers.forEach((header, index) => {
                header.addEventListener('click', function () {
                    const tbody = table.querySelector('tbody');
                    const rows = Array.from(tbody.querySelectorAll('tr'));
                    const columnName = header.textContent.trim();

                    // Toggle sort direction for this column
                    sortState[index] = sortState[index] === true ? false : true;
                    const asc = sortState[index];

                    headers.forEach(h => h.classList.remove('asc', 'desc'));

                    rows.sort((a, b) => {
                        // For Full Name, extract and sort by last name (last word in the cell)
                        if (columnName === 'Full Name') {
                            const fullNameA = a.children[index].textContent.trim();
                            const fullNameB = b.children[index].textContent.trim();
                            
                            // Extract last name (last word)
                            const lastNameA = fullNameA.split(' ').pop().toLowerCase();
                            const lastNameB = fullNameB.split(' ').pop().toLowerCase();
                            
                            if (lastNameA < lastNameB) return asc ? -1 : 1;
                            if (lastNameA > lastNameB) return asc ? 1 : -1;
                            return 0;
                        }
                        // For all other columns, sort by text
                        const cellA = a.children[index].textContent.trim().toLowerCase();
                        const cellB = b.children[index].textContent.trim().toLowerCase();
                        if (cellA < cellB) return asc ? -1 : 1;
                        if (cellA > cellB) return asc ? 1 : -1;
                        return 0;
                    });

                    rows.forEach(row => tbody.appendChild(row));
                    header.classList.add(asc ? 'asc' : 'desc');
                });
            });

            return; // done for server-driven pagination
        }

        // Fallback: legacy client-side behavior (for already fully-rendered tables)

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
                const columnName = header.textContent.trim();

                // Remove all asc/desc classes from this table only
                headers.forEach(h => h.classList.remove('asc', 'desc'));

                // For Full Name sorting, sort by text which was rendered as "firstName lastName"
                // but we can also sort by lastName if we have the data
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

                // After sorting, reset to first page if pagination exists
                if (pagination) renderPage(1);
            });
        });

        // -------------------------------
        // Pagination (client-side)
        // -------------------------------
        const rows = Array.from(table.querySelectorAll('tbody tr'));
        const rowsPerPage = 20;
        const totalRows = rows.length;
        const totalPages = Math.max(1, Math.ceil(totalRows / rowsPerPage));

        // Create pagination controls
        const pagination = document.createElement('div');
        pagination.className = 'efbc-table-pagination';
        pagination.style.display = 'flex';
        pagination.style.gap = '6px';
        pagination.style.justifyContent = 'center';
        pagination.style.marginTop = '12px';

        let currentPage = 1;

        const renderPage = (page) => {
            currentPage = Math.min(Math.max(1, page), totalPages);
            const start = (currentPage - 1) * rowsPerPage;
            const end = start + rowsPerPage;

            rows.forEach((row, idx) => {
                row.style.display = (idx >= start && idx < end) ? '' : 'none';
            });

            // rebuild controls
            pagination.innerHTML = '';
            const prev = document.createElement('button');
            prev.className = 'button';
            prev.textContent = 'Prev';
            prev.disabled = currentPage === 1;
            prev.addEventListener('click', () => renderPage(currentPage - 1));
            pagination.appendChild(prev);

            for (let i = 1; i <= totalPages; i++) {
                const btn = document.createElement('button');
                btn.className = 'button' + (i === currentPage ? ' button-primary' : '');
                btn.textContent = String(i);
                btn.addEventListener('click', () => renderPage(i));
                pagination.appendChild(btn);
            }

            const next = document.createElement('button');
            next.className = 'button';
            next.textContent = 'Next';
            next.disabled = currentPage === totalPages;
            next.addEventListener('click', () => renderPage(currentPage + 1));
            pagination.appendChild(next);
        };

        renderPage(1);
        wrapper.appendChild(pagination);

        // Ensure search resets to first page and recalculates pages
        searchInput.addEventListener('keyup', function () {
            const filter = this.value.toLowerCase();
            const filteredRows = rows.filter(row => row.textContent.toLowerCase().includes(filter));
            rows.forEach(row => row.style.display = 'none');

            filteredRows.forEach((row, idx) => {
                const visible = idx < rowsPerPage;
                row.style.display = visible ? '' : 'none';
            });

            // rebuild pagination based on filteredRows
            const newTotalPages = Math.max(1, Math.ceil(filteredRows.length / rowsPerPage));
            pagination.innerHTML = '';

            const prev = document.createElement('button');
            prev.className = 'button';
            prev.textContent = 'Prev';
            prev.disabled = true;
            prev.addEventListener('click', () => {});
            pagination.appendChild(prev);

            for (let i = 1; i <= newTotalPages; i++) {
                const btn = document.createElement('button');
                btn.className = 'button' + (i === 1 ? ' button-primary' : '');
                btn.textContent = String(i);
                btn.addEventListener('click', () => {
                    // render that page of filtered rows
                    const start = (i - 1) * rowsPerPage;
                    const end = start + rowsPerPage;
                    rows.forEach(row => row.style.display = 'none');
                    filteredRows.forEach((row, idx) => {
                        if (idx >= start && idx < end) row.style.display = '';
                    });
                });
                pagination.appendChild(btn);
            }

            const next = document.createElement('button');
            next.className = 'button';
            next.textContent = 'Next';
            next.disabled = true;
            pagination.appendChild(next);
        });
    });
});

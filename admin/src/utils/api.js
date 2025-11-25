// Cache for group names to avoid redundant API calls
const groupCache = {};

/**
 * Fetch group name by ID from API
 * @param {number} groupId - The group ID
 * @returns {Promise<string>} - Group name or 'Unknown' if not found
 */
export const fetchGroupName = async (groupId) => {
    if (!groupId) return 'Unassigned';
    
    // Return cached value if available
    if (groupCache[groupId]) {
        return groupCache[groupId];
    }

    try {
        const url = `https://server.efbcconference.org/api/groups/${groupId}`;
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.success && data.data && data.data.name) {
            groupCache[groupId] = data.data.name;
            return data.data.name;
        }
    } catch (error) {
        console.error(`Failed to fetch group ${groupId}:`, error);
    }
    
    return 'Unknown';
};

/**
 * Batch fetch group names
 * @param {array} groupIds - Array of group IDs
 * @returns {Promise<object>} - Map of groupId => groupName
 */
export const fetchGroupNamesBatch = async (groupIds) => {
    const uniqueIds = [...new Set(groupIds)].filter(id => id && !groupCache[id]);
    
    if (uniqueIds.length === 0) {
        // All are cached or empty
        const result = {};
        groupIds.forEach(id => {
            result[id] = groupCache[id] || 'Unknown';
        });
        return result;
    }

    // Fetch all uncached IDs
    const promises = uniqueIds.map(id => fetchGroupName(id));
    await Promise.all(promises);
    
    // Return complete map
    const result = {};
    groupIds.forEach(id => {
        result[id] = groupCache[id] || 'Unknown';
    });
    return result;
};

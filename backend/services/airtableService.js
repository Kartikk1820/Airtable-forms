const axios = require("axios");

const airtableService = (accessToken) => {
  const client = axios.create({
    baseURL: "https://api.airtable.com/v0",
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  return {
    listBases: async () => (await client.get("/meta/bases")).data,
    listTables: async (baseId) =>
      (await client.get(`/meta/bases/${baseId}/tables`)).data,
    getTableFields: async (baseId, tableId) => {
      try {
        // First try the meta endpoint
        const response = await client.get(
          `/meta/bases/${baseId}/tables/${tableId}`
        );
        return response.data;
      } catch (error) {
        // If meta endpoint fails, use the tables endpoint as fallback
        if (error.response?.status === 404) {
          try {
            // Get all tables and find the specific table
            const tablesResponse = await client.get(
              `/meta/bases/${baseId}/tables`
            );
            const table = tablesResponse.data.tables.find(
              (t) => t.id === tableId
            );

            if (table) {
              return {
                id: table.id,
                name: table.name,
                primaryFieldId: table.primaryFieldId,
                fields: table.fields || [],
                views: table.views || [],
              };
            } else {
              throw new Error(`Table ${tableId} not found in base ${baseId}`);
            }
          } catch (tableError) {
            throw new Error(
              `Failed to fetch table fields: ${tableError.message}`
            );
          }
        }
        throw error;
      }
    },
    createRecord: async (baseId, tableName, fields) =>
      (await client.post(`/${baseId}/${tableName}`, { fields })).data,
  };
};

module.exports = airtableService;

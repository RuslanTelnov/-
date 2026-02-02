// Simple in-memory store for sync status
// In a production environment, this should be replaced with Redis or a database table
export const syncStatus = new Map<string, any>();

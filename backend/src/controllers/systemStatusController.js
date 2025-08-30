import ActivityLog from "../models/ActivityActivity.js";

export const getSystemStatus = async (req, res) => {
  try {
    // Get recent warning entries from the last 24 hours
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const warnings = await ActivityLog.find({
      severity: "warning",
      createdAt: { $gte: twentyFourHoursAgo }
    }).sort({ createdAt: -1 }).limit(10);

    // Count warnings and determine status
    const warningCount = warnings.length;
    let status = "healthy";
    let statusColor = "green";
    
    if (warningCount >= 4) {
      status = "critical";
      statusColor = "red";
    } else if (warningCount >= 1) {
      status = "warning";
      statusColor = "yellow";
    }

    // Get the most recent warning for display 
    const latestWarning = warnings.length > 0 ? warnings[0] : null;

    const response = {
      status,
      statusColor,
      warningCount,
      latestWarning: latestWarning ? {
        action: latestWarning.action,
        details: latestWarning.details,
        createdAt: latestWarning.createdAt
      } : null,
      recentWarnings: warnings.slice(0, 3).map(warning => ({
        action: warning.action,
        details: warning.details,
        createdAt: warning.createdAt
      }))
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching system status:', error);
    res.status(500).json({ 
      message: 'Failed to fetch system status',
      error: error.message 
    });
  } 
}; 
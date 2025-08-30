import ActivityLog from "../models/ActivityActivity.js";

export const getRecentActivities = async (req, res) => {
  try {
    // Fetch 10 recent activities excluding warnings
    const activities = await ActivityLog.find({
      severity: { $ne: 'warning' }
    })
      .sort({ createdAt: -1 })
      .limit(10)
      .select('action details severity createdAt');

    res.json({ activities });
  } catch (error) {
    console.error('Error fetching recent activities:', error);
    res.status(500).json({ 
      message: 'Failed to fetch recent activities',
      error: error.message 
    });
  }
}; 
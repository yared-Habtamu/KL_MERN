import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Joi from 'joi';
import ActivityLog from '../models/ActivityActivity.js';
import Ticket from '../models/Ticket.js';
import mongoose from 'mongoose';

// Normalize phone number to 09/07 format
const normalizePhoneNumber = (phone) => {
  const cleaned = phone.replace(/\s/g, '');
  
  // If it starts with +2519, convert to 09
  if (cleaned.startsWith('+2519')) {
    return '09' + cleaned.substring(5);
  }
  
  // If it starts with +2517, convert to 07
  if (cleaned.startsWith('+2517')) {
    return '07' + cleaned.substring(5);
  }
  
  // If it already starts with 09 or 07, return as is
  if (cleaned.startsWith('09') || cleaned.startsWith('07')) {
    return cleaned;
  }
  
  return cleaned;
};

// Validate Ethiopian phone number
const validateEthiopianPhone = (phone) => {
  const phoneRegex = /^(\+2519|\+2517|09|07)\d{8}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
};

// Utility to escape HTML (basic)
function escapeHtml(str) {
  return str.replace(/[&<>'"]/g, function (tag) {
    const charsToReplace = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    };
    return charsToReplace[tag] || tag;
  });
}
// Joi schema for staff registration
const staffSchema = Joi.object({
  name: Joi.string().max(100).required(),
  phone: Joi.string().required(),
  role: Joi.string().valid('seller', 'operator', 'manager').required(),
  password: Joi.string().min(6).max(100).required()
});

// Helper function to log activities
const logActivity = async (action, details, severity = 'info') => {
  try {
    await ActivityLog.create({
      action,
      details,
      severity,
      createdAt: new Date()
    });
  } catch (error) {
    console.error('Failed to log activity:', error);
  }
};

// Create new staff member
export const createStaff = async (req, res) => {
  try {
    // Joi validation
    const { error, value } = staffSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }
    let { name, phone, role, password } = value;
    // Sanitize name
    name = escapeHtml(name.trim());
    // Validate Ethiopian phone number
    if (!validateEthiopianPhone(phone)) {
      return res.status(400).json({ 
        message: 'Please enter a valid Ethiopian phone number (09/07/+2519/+2517 + 8 digits)' 
      });
    }
    // Normalize phone number
    const normalizedPhone = normalizePhoneNumber(phone);
    // Check if phone already exists
    const existingStaff = await User.findOne({ phone: normalizedPhone });
    if (existingStaff) {
      return res.status(400).json({ message: 'Phone number already exists' });
    }
    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    // Create new staff member
    const newStaff = new User({
      name,
      phone: normalizedPhone,
      role,
      passwordHash: hashedPassword
    });
    await newStaff.save();
    // Log activity
    await logActivity(
      'Staff Created',
      `Staff member "${newStaff.name}" (${newStaff.role}) was created by ${req.user?.name || req.user?.role || 'system'}`,
      'success'
    );
    // Return staff data without password
    const staffData = {
      _id: newStaff._id,
      name: newStaff.name,
      phone: newStaff.phone,
      role: newStaff.role
    };
    res.status(201).json({
      message: 'Staff member created successfully',
      staff: staffData
    });
  } catch (error) {
    console.error('Error creating staff:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Delete staff member
export const deleteStaff = async (req, res) => {
  try {
    const { id } = req.params;

    // Find and delete staff member
    const deletedStaff = await User.findByIdAndDelete(id);
    
    if (!deletedStaff) {
      return res.status(404).json({ message: 'Staff member not found' });
    }
    // Log activity
    await logActivity(
      'Staff Deleted',
      `Staff member "${deletedStaff.name}" (${deletedStaff.role}) was deleted by ${req.user?.name || req.user?.role || 'system'}`,
      'success'
    );

    res.json({ message: 'Staff member deleted successfully' });

  } catch (error) {
    console.error('Error deleting staff:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get all staff members
export const getAllStaff = async (req, res) => {
  try {
    const staff = await User.find({}, '-password');
    res.json(staff);
  } catch (error) {
    console.error('Error fetching staff:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get staff member by ID
export const getStaffById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const staff = await User.findById(id, '-password');
    
    if (!staff) {
      return res.status(404).json({ message: 'Staff member not found' });
    }
    
    res.json(staff);
  } catch (error) {
    console.error('Error fetching staff member:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Update staff member
export const updateStaff = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone } = req.body;

    // Validate input
    if (!name || !phone) {
      return res.status(400).json({ message: 'Name and phone are required' });
    }

    // Validate Ethiopian phone number
    if (!validateEthiopianPhone(phone)) {
      return res.status(400).json({ 
        message: 'Please enter a valid Ethiopian phone number (09/07/+2519/+2517 + 8 digits)' 
      });
    }

    // Normalize phone number
    const normalizedPhone = normalizePhoneNumber(phone);

    // Check if phone already exists for another staff member
    const existingStaff = await User.findOne({ phone: normalizedPhone, _id: { $ne: id } });
    if (existingStaff) {
      return res.status(400).json({ message: 'Phone number already exists' });
    }

    // Update staff member
    const updatedStaff = await User.findByIdAndUpdate(
      id,
      { 
        name: escapeHtml(name.trim()),
        phone: normalizedPhone
      },
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedStaff) {
      return res.status(404).json({ message: 'Staff member not found' });
    }

    // Log activity
    await logActivity(
      'Staff Updated',
      `Staff member "${updatedStaff.name}" was updated by ${req.user?.name || req.user?.role || 'system'}`,
      'info'
    );

    res.json({
      message: 'Staff member updated successfully',
      staff: updatedStaff
    });
  } catch (error) {
    console.error('Error updating staff member:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Change password
export const changePassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { oldPassword, newPassword } = req.body;

    // Validate input
    if (!oldPassword || !newPassword) {
      return res.status(400).json({ message: 'Old password and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters' });
    }

    // Find staff member
    const staff = await User.findById(id);
    if (!staff) {
      return res.status(404).json({ message: 'Staff member not found' });
    }

    // Verify old password
    const isOldPasswordValid = await bcrypt.compare(oldPassword, staff.passwordHash);
    if (!isOldPasswordValid) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    // Hash new password
    const saltRounds = 10;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    staff.passwordHash = hashedNewPassword;
    await staff.save();

    // Log activity
    await logActivity(
      'Password Changed',
      `Password was changed for staff member "${staff.name}" by ${req.user?.name || req.user?.role || 'system'}`,
      'info'
    );

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}; 

export const getCommissionReportForStaff = async (req, res) => {
  try {
    const staffId = req.params.id || req.user._id;

    const report = await Ticket.aggregate([
      {
        $match: {
          soldBy: new mongoose.Types.ObjectId(staffId),
          paymentStatus: "paid"
        }
      },
      {
        $lookup: {
          from: "Lottery",
          localField: "lotteryId",
          foreignField: "_id",
          as: "lottery"
        }
      },
      { $unwind: "$lottery" },
      {
        $group: {
          _id: {
            lotteryId: "$lottery._id",
            title: "$lottery.title",
            commissionPerTicket: "$lottery.commissionPerTicket"
          },
          ticketsSold: { $sum: 1 },
          lastSoldAt: { $max: "$soldAt" }
        }
      },
      {
        $project: {
          _id: 0,
          lotteryId: "$_id.lotteryId",
          title: "$_id.title",
          date: "$lastSoldAt",
          ticketsSold: 1,
          commissionEarned: {
            $multiply: ["$ticketsSold", "$_id.commissionPerTicket"]
          }
        }
      },
      { $sort: { date: -1 } }
    ]);

    res.json({ success: true, data: report });
  } catch (error) {
    console.error("Failed to get commission report:", error);
    res.status(500).json({ success: false, message: "Failed to generate report" });
  }
}; 
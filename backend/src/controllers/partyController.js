const Party = require('../models/Party');
const Company = require('../models/Company');
const { validationResult } = require('express-validator');
const logger = require('../utils/logger');

// @desc    Get all parties
// @route   GET /api/parties
// @access  Private
exports.getParties = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      type,
      category,
      search,
      hasBalance
    } = req.query;

    const query = { company: req.company._id, isActive: true };

    // Add filters
    if (type) query.type = type;
    if (category) query.category = category;
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { displayName: { $regex: search, $options: 'i' } },
        { gstin: { $regex: search, $options: 'i' } },
        { 'contact.phone': { $regex: search, $options: 'i' } },
        { 'contact.email': { $regex: search, $options: 'i' } }
      ];
    }

    if (hasBalance === 'true') {
      query['balances.current.amount'] = { $gt: 0 };
    }

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { name: 1 },
      populate: [
        { path: 'createdBy', select: 'name email' },
        { path: 'updatedBy', select: 'name email' }
      ]
    };

    const parties = await Party.paginate(query, options);

    res.status(200).json({
      success: true,
      data: parties
    });
  } catch (error) {
    logger.error('Get parties error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get single party
// @route   GET /api/parties/:id
// @access  Private
exports.getParty = async (req, res) => {
  try {
    const party = await Party.findOne({
      _id: req.params.id,
      company: req.company._id
    })
    .populate('createdBy', 'name email')
    .populate('updatedBy', 'name email');

    if (!party) {
      return res.status(404).json({
        success: false,
        message: 'Party not found'
      });
    }

    res.status(200).json({
      success: true,
      data: party
    });
  } catch (error) {
    logger.error('Get party error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Create party
// @route   POST /api/parties
// @access  Private
exports.createParty = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors.array()
      });
    }

    const partyData = {
      ...req.body,
      company: req.company._id,
      createdBy: req.user.id
    };

    // Check for duplicate GSTIN
    if (partyData.gstin) {
      const existingParty = await Party.findOne({
        company: req.company._id,
        gstin: partyData.gstin,
        isActive: true
      });
      
      if (existingParty) {
        return res.status(400).json({
          success: false,
          message: 'Party with this GSTIN already exists'
        });
      }
    }

    // Check for duplicate phone
    if (partyData.contact && partyData.contact.phone) {
      const existingParty = await Party.findOne({
        company: req.company._id,
        'contact.phone': partyData.contact.phone,
        isActive: true
      });
      
      if (existingParty) {
        return res.status(400).json({
          success: false,
          message: 'Party with this phone number already exists'
        });
      }
    }

    const party = await Party.create(partyData);

    const populatedParty = await Party.findById(party._id)
      .populate('createdBy', 'name email');

    res.status(201).json({
      success: true,
      data: populatedParty
    });
  } catch (error) {
    logger.error('Create party error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Update party
// @route   PUT /api/parties/:id
// @access  Private
exports.updateParty = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors.array()
      });
    }

    let party = await Party.findOne({
      _id: req.params.id,
      company: req.company._id
    });

    if (!party) {
      return res.status(404).json({
        success: false,
        message: 'Party not found'
      });
    }

    // Check for duplicate GSTIN (excluding current party)
    if (req.body.gstin && req.body.gstin !== party.gstin) {
      const existingParty = await Party.findOne({
        company: req.company._id,
        gstin: req.body.gstin,
        _id: { $ne: req.params.id },
        isActive: true
      });
      
      if (existingParty) {
        return res.status(400).json({
          success: false,
          message: 'Party with this GSTIN already exists'
        });
      }
    }

    // Check for duplicate phone (excluding current party)
    if (req.body.contact && req.body.contact.phone && 
        req.body.contact.phone !== party.contact.phone) {
      const existingParty = await Party.findOne({
        company: req.company._id,
        'contact.phone': req.body.contact.phone,
        _id: { $ne: req.params.id },
        isActive: true
      });
      
      if (existingParty) {
        return res.status(400).json({
          success: false,
          message: 'Party with this phone number already exists'
        });
      }
    }

    const updateData = {
      ...req.body,
      updatedBy: req.user.id
    };

    party = await Party.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    )
    .populate('updatedBy', 'name email');

    res.status(200).json({
      success: true,
      data: party
    });
  } catch (error) {
    logger.error('Update party error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Delete party
// @route   DELETE /api/parties/:id
// @access  Private
exports.deleteParty = async (req, res) => {
  try {
    const party = await Party.findOne({
      _id: req.params.id,
      company: req.company._id
    });

    if (!party) {
      return res.status(404).json({
        success: false,
        message: 'Party not found'
      });
    }

    // Check if party has any outstanding balance
    if (party.balances.current.amount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete party with outstanding balance'
      });
    }

    // Soft delete
    party.isActive = false;
    party.updatedBy = req.user.id;
    await party.save();

    res.status(200).json({
      success: true,
      message: 'Party deleted successfully'
    });
  } catch (error) {
    logger.error('Delete party error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get party balance summary
// @route   GET /api/parties/:id/balance
// @access  Private
exports.getPartyBalance = async (req, res) => {
  try {
    const party = await Party.findOne({
      _id: req.params.id,
      company: req.company._id
    }).select('name displayName balances');

    if (!party) {
      return res.status(404).json({
        success: false,
        message: 'Party not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        party: {
          id: party._id,
          name: party.fullName
        },
        balances: party.balances
      }
    });
  } catch (error) {
    logger.error('Get party balance error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get parties with outstanding balances
// @route   GET /api/parties/outstanding
// @access  Private
exports.getOutstandingParties = async (req, res) => {
  try {
    const { type } = req.query;
    
    const query = {
      company: req.company._id,
      isActive: true,
      'balances.current.amount': { $gt: 0 }
    };

    if (type) {
      query.type = type;
    }

    const parties = await Party.find(query)
      .select('name displayName type balances contact')
      .sort({ 'balances.current.amount': -1 });

    const totalOutstanding = parties.reduce((sum, party) => {
      return sum + party.balances.current.amount;
    }, 0);

    res.status(200).json({
      success: true,
      data: {
        parties,
        summary: {
          totalParties: parties.length,
          totalOutstanding
        }
      }
    });
  } catch (error) {
    logger.error('Get outstanding parties error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

import mongoose from 'mongoose';

export function validateObjectId(req, res, next) {
  const { id } = req.params;
  if (
    !mongoose.Types.ObjectId.isValid(id) &&
    !id.startsWith('demo-') &&
    !id.startsWith('obl_') &&
    !id.startsWith('mem_')
  ) {
    return res.status(400).json({
      success: false,
      message: `Invalid obligation ID format: ${id}`,
    });
  }
  next();
}

export function validateObligationInput(req, res, next) {
  const { title, category, owner, dueDate, priority, status } = req.body;

  if (req.method === 'POST') {
    if (!title || typeof title !== 'string' || title.trim().length < 3) {
      return res.status(400).json({
        success: false,
        message: 'Title is required and must be at least 3 characters',
      });
    }
    if (!category || typeof category !== 'string' || !category.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Category is required',
      });
    }
    if (!owner || typeof owner !== 'string' || !owner.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Responsible owner is required',
      });
    }
    if (!dueDate || isNaN(new Date(dueDate).getTime())) {
      return res.status(400).json({
        success: false,
        message: 'A valid due date is required',
      });
    }
  }

  if (priority && !['Low', 'Medium', 'High', 'Critical'].includes(priority)) {
    return res.status(400).json({
      success: false,
      message: 'Priority must be one of: Low, Medium, High, Critical',
    });
  }

  if (status && !['Open', 'In Progress', 'Completed'].includes(status)) {
    return res.status(400).json({
      success: false,
      message: 'Status must be one of: Open, In Progress, Completed',
    });
  }

  next();
}

export function validateEvidenceInput(req, res, next) {
  const { label, url } = req.body;

  if (!label || typeof label !== 'string' || !label.trim()) {
    return res.status(400).json({
      success: false,
      message: 'Evidence label is required',
    });
  }

  if (!url || typeof url !== 'string' || !url.trim()) {
    return res.status(400).json({
      success: false,
      message: 'Evidence URL is required',
    });
  }

  try {
    const parsed = new URL(url.trim());
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return res.status(400).json({
        success: false,
        message: 'Evidence URL must use HTTP or HTTPS protocol',
      });
    }
  } catch {
    return res.status(400).json({
      success: false,
      message: 'Invalid evidence URL format',
    });
  }

  next();
}
